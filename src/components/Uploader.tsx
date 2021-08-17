import { useState } from 'react';
import { useDispatch } from 'umi';
import { Upload, message, notification } from 'antd';
import { getPresignedUrl } from '@/services/driver';

export interface UploadFile {
  uid: string;
  name: string;
  status: string;
  type: string;
}

const Uploader = ({ children, ...rest }) => {
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
        const presignedUrl = await getPresignedUrl({ type: 'upload' });
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
      fetch('http://minio.local.com/hello', { method: 'post', body: formData })
        .then((response) => onSuccess(response, file))
        .catch((e) => {
          console.error(e);
        });
    },
    onChange({ file }: { file: UploadFile }) {
      const notificationKey = `upload-process-${file.queue}`;
      const queue = queues[file.queue];
      setQueues({ ...queues, [file.queue]: { ...queue, current: file.name } });
      if (file.status == 'done') {
        queue.done.push(file.uid);
        dispatch({
          type: 'driver/create',
          payload: {
            id: new Date().getTime(),
            name: file.name,
            type: file.type,
          },
        });
        if (queue.done.length == queue.total) {
          notification.success({
            key: notificationKey,
            message: 'Done',
            placement: 'bottomRight',
          });
          delete queues[file.queue];
          setQueues(queues);
        } else {
          notification.info({
            key: notificationKey,
            message: `Uploading(${queue.done.length}/${queue.total})`,
            description: `${queue.current} is uploading`,
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
