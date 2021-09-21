import { useState } from 'react';
import { useDispatch } from 'umi';
import { Upload, message, notification, Avatar, Button } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { getPresignedUrl } from '@/services/driver';

export interface UploadFile {
  uid: string;
  name: string;
  status: string;
  type: string;
  thumbnail: string;
}

function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

const Uploader = ({ children, parent, ...rest }) => {
  const dispatch = useDispatch();
  const [hit, setHit] = useState(1); //count hit upload button
  const [queues, setQueues] = useState({});
  const uploadProps = {
    name: 'file',
    showUploadList: false,
    multiple: true,
    beforeUpload: async (file: UploadFile, fileList: UploadFile[]) => {
      if (!queues[hit]) {
        setQueues(Object.assign(queues, { [hit]: {} })); //status of click upload button everytime
        setHit(hit + fileList.length);
        const presignedUrl = await getPresignedUrl({ parent });
        setQueues(
          Object.assign(queues, {
            [hit]: {
              current: '',
              done: [],
              total: fileList.length,
              presignedUrl,
            },
          }),
        );
      }
      file.queue = hit;
      notification.info({
        key: `upload-process-${hit}`,
        message: `Prepare upload(0/${fileList.length})`,
        placement: 'bottomRight',
        duration: null,
      });
    },
    customRequest: ({ file, onSuccess }) => {
      const formData = new FormData();
      Object.entries(queues[file.queue].presignedUrl).forEach(([k, v]) => {
        formData.append(k, k == 'key' ? v + file.name : v);
      });
      formData.append('file', file);
      fetch('/api/services/minio/drive', { method: 'post', body: formData })
        .then((response) => onSuccess(response, file))
        .catch((e) => {
          console.error(e);
        });
    },
    async onChange({ file }: { file: UploadFile }) {
      const notificationKey = `upload-process-${file.queue}`;
      const queue = queues[file.queue];
      setQueues({ ...queues, [file.queue]: { ...queue, current: file.name } });
      if (file.status == 'done') {
        file.thumbnail = await getBase64(file.originFileObj);
        queue.done.push(file);
        /*
        cancel insert file to documents list after upload
        dispatch({
          type: 'driver/create',
          payload: {
            id: new Date().getTime(),
            name: file.name,
            type: file.type,
            thumbnail: file.thumbnail
          },
        });
        */
        if (queue.done.length == queue.total) {
          notification.success({
            key: notificationKey,
            message: (
              <>
                Done{' '}
                <Button
                  type="link"
                  onClick={() =>
                    dispatch({ type: 'driver/goto', payload: { parent } })
                  }
                >
                  View
                </Button>
              </>
            ),
            description: (
              <Avatar.Group
                maxCount={10}
                maxStyle={{ color: '#f56a00', backgroundColor: '#fde3cf' }}
              >
                {queue.done.map((v) => (
                  <Avatar shape="square" key={v.uid} src={v.thumbnail} />
                ))}
              </Avatar.Group>
            ),
            placement: 'bottomRight',
            duration: null,
          });
          delete queues[file.queue];
          setQueues(queues);
        } else {
          notification.info({
            key: notificationKey,
            icon: <LoadingOutlined />,
            message: `Uploading(${queue.done.length}/${queue.total})`,
            description: <Avatar shape="square" src={file.thumbnail} />,
            placement: 'bottomRight',
            duration: null,
          });
        }
      }
      if (file.status == 'error') {
        message.error(`${file.name} file upload failed.`);
      }
    },
    ...rest,
  };
  return <Upload {...uploadProps}>{children}</Upload>;
};

export default Uploader;
