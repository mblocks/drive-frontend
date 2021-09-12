import React, { useState, useEffect } from 'react';
import { useDispatch, useIntl } from 'umi';
import { Dropdown, Menu, Input, Modal, Tree } from 'antd';
import {
  DeleteOutlined,
  DragOutlined,
  CopyOutlined,
  DownloadOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import DocumentClick from './DocumentClick';
import Icon from './Icon';
import styles from './Documents.less';

const DocumentsExpand = ({ documents, dirs }) => {
  const dispatch = useDispatch();
  const intl = useIntl();
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [editableKeys, setEditableKeys] = useState([]);
  const [modalAction, setModalAction] = useState({});
  useEffect(() => {
    const newDocuments = documents.filter((v) => !v.id).map(({ key }) => key);
    setEditableKeys(newDocuments);
    setSelectedDocuments(newDocuments);
  }, [documents]);

  useEffect(() => {
    documents
      .filter((v) => !v.id && !selectedDocuments.includes(v.key))
      .forEach((v) => {
        dispatch({
          type: 'driver/update',
          payload: v,
        });
      });
  }, [selectedDocuments]);

  const handleMove = () => {
    setModalAction({
      action: 'move',
      documents: selectedDocuments,
      title:
        intl.formatMessage({ id: 'DRIVE_ACTION_MOVE' }) +
        ' ' +
        documents
          .filter((v) => selectedDocuments.includes(v.key))
          .map((v) => v.name)
          .join(','),
    });
  };
  const handleDelete = () => {
    Modal.confirm({
      title: intl.formatMessage({ id: 'DRIVE_ACTION_DELETE_CONFIRM' }),
      content: documents
        .filter((v) => selectedDocuments.includes(v.key))
        .map((v) => v.name)
        .join(','),
      icon: <ExclamationCircleOutlined />,
      onOk() {
        dispatch({
          type: 'driver/delete',
          payload: { documents: selectedDocuments },
        });
      },
    });
  };
  const handleCopy = () => {
    setModalAction({
      action: 'copy',
      documents: selectedDocuments,
      title:
        intl.formatMessage({ id: 'DRIVE_ACTION_COPY' }) +
        ' ' +
        documents
          .filter((v) => selectedDocuments.includes(v.key))
          .map((v) => v.name)
          .join(','),
    });
  };

  const menu = (item) => (
    <Menu>
      {selectedDocuments.length <= 1 && (
        <Menu.Item
          key="rename"
          icon={<EditOutlined />}
          onClick={() => setEditableKeys([item.key])}
        >
          {intl.formatMessage({ id: 'DRIVE_ACTION_RENAME' })}
        </Menu.Item>
      )}
      <Menu.Item key="download" icon={<DownloadOutlined />}>
        <a
          href={`/api/driver/documents/download?id=${
            selectedDocuments.length > 1 ? selectedDocuments : item.id
          }`}
        >
          {intl.formatMessage({ id: 'DRIVE_ACTION_DOWNLOAD' })}
        </a>
      </Menu.Item>
      <Menu.Item key="move" icon={<DragOutlined />} onClick={handleMove}>
        {intl.formatMessage({ id: 'DRIVE_ACTION_MOVE' })}
      </Menu.Item>
      <Menu.Item key="copy" icon={<CopyOutlined />} onClick={handleCopy}>
        {intl.formatMessage({ id: 'DRIVE_ACTION_COPY' })}
      </Menu.Item>
      <Menu.Item key="delete" icon={<DeleteOutlined />} onClick={handleDelete}>
        {intl.formatMessage({ id: 'DRIVE_ACTION_DELETE' })}
      </Menu.Item>
    </Menu>
  );

  return (
    <>
      <Modal
        title={modalAction.title}
        visible={modalAction.action ? true : false}
        onCancel={() => setModalAction({})}
        onOk={async () => {
          await dispatch({
            type: `driver/${modalAction.action}`,
            payload: modalAction,
          });
          setModalAction({});
          setSelectedDocuments([]);
        }}
      >
        <Tree
          style={{ minHeight: 100, maxHeight: 400, overflowY: 'scroll' }}
          treeData={dirs}
          selectedKeys={[modalAction.target]}
          onSelect={(target) => {
            setModalAction({ ...modalAction, target: target.pop() });
          }}
          loadData={async (node) => {
            await dispatch({
              type: 'driver/fetchDirs',
              payload: { parent: node.id },
            });
          }}
        />
      </Modal>
      <div className={styles['documents-expand']}>
        {documents.map((v) => (
          <div key={v.key}>
            <Dropdown
              overlay={menu(v)}
              trigger={['contextMenu']}
              onVisibleChange={(visible) => {
                if (visible) {
                  setSelectedDocuments(
                    selectedDocuments.includes(v.key)
                      ? [...selectedDocuments, v.key]
                      : [v.key],
                  );
                } else {
                  //selectedDocuments.splice(selectedDocuments.indexOf(v.key), 1);//remove contextMenu inserted key
                  //setSelectedDocuments([...selectedDocuments]);
                  setSelectedDocuments([]);
                }
              }}
            >
              <DocumentClick
                className={[
                  styles.document,
                  selectedDocuments.includes(v.key)
                    ? styles['document-selected']
                    : '',
                ]}
                onClick={(e) => {
                  if (e.ctrlKey) {
                    setSelectedDocuments([...selectedDocuments, v.key]);
                  } else {
                    !editableKeys.includes(v.key) && setSelectedDocuments([]);
                  }
                  //e.ctrlKey && setSelectedDocuments(selectedDocuments.includes(v.key) ? [...selectedDocuments.filter(item => item != v.key)] : [...selectedDocuments, v.key]);
                }}
                onDoubleClick={() => {
                  dispatch({ type: 'driver/goto', payload: { parent: v.id } });
                }}
                title={v.name}
              >
                <Icon type={v.type} style={{ fontSize: 60 }} />
                <div className={styles['document-title']}>
                  {editableKeys.includes(v.key) ? (
                    <Input.TextArea
                      onBlur={(e) => {
                        dispatch({
                          type: 'driver/update',
                          payload: {
                            ...v,
                            name: e.target.value,
                          },
                        }).then(() => {
                          setEditableKeys([
                            ...editableKeys.filter((item) => item != v.key),
                          ]);
                        });
                      }}
                      autoSize={{ minRows: 2 }}
                      size="small"
                      placeholder="Basic usage"
                      defaultValue={v.name}
                    />
                  ) : (
                    v.name
                  )}
                </div>
              </DocumentClick>
            </Dropdown>
          </div>
        ))}
        <i aria-hidden="true"></i>
        <i aria-hidden="true"></i>
        <i aria-hidden="true"></i>
        <i aria-hidden="true"></i>
        <i aria-hidden="true"></i>
        <i aria-hidden="true"></i>
        <i aria-hidden="true"></i>
        <i aria-hidden="true"></i>
        <i aria-hidden="true"></i>
        <i aria-hidden="true"></i>
        <i aria-hidden="true"></i>
        <i aria-hidden="true"></i>
        <i aria-hidden="true"></i>
        <i aria-hidden="true"></i>
      </div>
    </>
  );
};

export default DocumentsExpand;
