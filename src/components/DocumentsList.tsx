import React, { useState, useEffect } from 'react';
import { useDispatch, useIntl } from 'umi';
import { Button, Modal, Tree, Space, Table, Dropdown, Menu } from 'antd';
import type { ProColumns } from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import {
  DeleteOutlined,
  DragOutlined,
  CopyOutlined,
  DownloadOutlined,
  EditOutlined,
  EllipsisOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import DocumentClick from './DocumentClick';
import DocumentTitle from './DocumentTitle';

export type TableListItem = {
  key: number;
  name: string;
  creator: string;
  createdAt: number;
  modifiedAt: number;
};

const { confirm } = Modal;
const DocumentsList = ({ documents, dirs }) => {
  const dispatch = useDispatch();
  const intl = useIntl();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [editableKeys, setEditableKeys] = useState([]);
  const [modalAction, setModalAction] = useState({});
  const handleDelete = (rowKey?: number | undefined) => async () => {
    const keys = rowKey ? [rowKey] : selectedRowKeys;
    const selectedDocuments = documents.filter((v) => keys.includes(v.key));
    confirm({
      title: intl.formatMessage({ id: 'DRIVE_ACTION_DELETE_CONFIRM' }),
      content: selectedDocuments.map((v) => v.name).join(','),
      icon: <ExclamationCircleOutlined />,
      onOk() {
        dispatch({ type: 'driver/delete', payload: { documents: keys } }).then(
          () => {
            setSelectedRowKeys(
              rowKey ? [...selectedRowKeys.filter((v) => v != rowKey)] : [],
            );
          },
        );
      },
    });
  };

  const handleCopy = (rowKey?: number | undefined) => async () => {
    const keys = rowKey ? [rowKey] : selectedRowKeys;
    const selectedDocuments = documents.filter((v) => keys.includes(v.key));
    setModalAction({
      action: 'copy',
      documents: keys,
      title: `Copy ${selectedDocuments.map((v) => v.name).join(',')}`,
    });
  };

  const handleMove = (rowKey?: number | undefined) => async () => {
    const keys = rowKey ? [rowKey] : selectedRowKeys;
    const selectedDocuments = documents.filter((v) => keys.includes(v.key));
    setModalAction({
      action: 'move',
      documents: keys,
      title: `Move ${selectedDocuments.map((v) => v.name).join(',')}`,
    });
  };
  const columns: ProColumns<TableListItem>[] = [
    {
      title: intl.formatMessage({ id: 'DRIVE_DOCUMENT_NAME' }),
      dataIndex: 'name',
      render: (_, item) => (
        <DocumentClick
          onDoubleClick={() => {
            if (item.type == 'dir') {
              dispatch({ type: 'driver/goto', payload: { dir: item.id } });
            }
            //console.log(item);
          }}
        >
          <DocumentTitle type={item.type} name={_} />
        </DocumentClick>
      ),
    },
    {
      title: 'public',
      dataIndex: 'public',
      width: 100,
      editable: false,
      hideInTable: true,
    },
    {
      title: intl.formatMessage({ id: 'DRIVE_DOCUMENT_MODIFY_TIME' }),
      dataIndex: 'modifiedAt',
      valueType: 'dateTime',
      width: 160,
      editable: false,
    },
    {
      width: 40,
      key: 'option',
      valueType: 'option',
      render: (_, document) => [
        <Dropdown
          key="actionGroup"
          trigger={['contextMenu', 'click']}
          overlay={menu(document)}
        >
          <EllipsisOutlined />
        </Dropdown>,
      ],
    },
  ];
  const menu = (item) => (
    <Menu>
      <Menu.Item
        key="rename"
        icon={<EditOutlined />}
        onClick={() => setEditableKeys([...editableKeys, item.key])}
      >
        {intl.formatMessage({ id: 'DRIVE_ACTION_RENAME' })}
      </Menu.Item>
      <Menu.Item key="download" icon={<DownloadOutlined />}>
        <a href={`/api/driver/documents/download?id=${item.id}`}>
          {intl.formatMessage({ id: 'DRIVE_ACTION_DOWNLOAD' })}
        </a>
      </Menu.Item>
      <Menu.Item
        key="move"
        icon={<DragOutlined />}
        onClick={handleMove(item.key)}
      >
        {intl.formatMessage({ id: 'DRIVE_ACTION_MOVE' })}
      </Menu.Item>
      <Menu.Item
        key="copy"
        icon={<CopyOutlined />}
        onClick={handleCopy(item.key)}
      >
        {intl.formatMessage({ id: 'DRIVE_ACTION_COPY' })}
      </Menu.Item>
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={handleDelete(item.key)}
      >
        {intl.formatMessage({ id: 'DRIVE_ACTION_DELETE' })}
      </Menu.Item>
    </Menu>
  );
  useEffect(() => {
    setEditableKeys(documents.filter((v) => !v.id).map(({ key }) => key));
  }, [documents]);
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
          setSelectedRowKeys([
            ...selectedRowKeys.filter(
              (v) => !modalAction.documents.includes(v),
            ),
          ]);
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
              payload: { dir: node.id },
            });
          }}
        />
      </Modal>
      <ProTable<TableListItem>
        columns={columns}
        dataSource={documents}
        rowKey="key"
        pagination={false}
        search={false}
        dateFormatter="string"
        headerTitle={false}
        options={false}
        rowSelection={{
          // 自定义选择项参考: https://ant.design/components/table-cn/#components-table-demo-row-selection-custom
          // 注释该行则默认不显示下拉选项
          selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
          selectedRowKeys: selectedRowKeys,
          onChange: (selectedRowKeys) => setSelectedRowKeys(selectedRowKeys),
        }}
        editable={{
          type: 'multiple',
          editableKeys,
          onChange: setEditableKeys,
          actionRender: (row, config) => {
            return (
              <Space>
                <Button
                  key="save"
                  size="small"
                  type="primary"
                  onClick={async () => {
                    const res = await dispatch({
                      type: 'driver/update',
                      payload: {
                        ...row,
                        ...config.form.getFieldValue([row.key]),
                      },
                    });
                    config.cancelEditable(res.key);
                  }}
                >
                  Save
                </Button>
                <Button
                  key="cancel"
                  size="small"
                  onClick={() => {
                    if (row.id) {
                      config.cancelEditable(config.recordKey);
                    } else {
                      dispatch({ type: 'driver/cancel', payload: row });
                    }
                  }}
                >
                  Cancel
                </Button>
              </Space>
            );
          },
        }}
        tableAlertRender={({ selectedRowKeys }) =>
          intl.formatMessage(
            { id: 'DRIVE_ACTION_SELECTED' },
            { number: selectedRowKeys.length },
          )
        }
        tableAlertOptionRender={() => {
          return (
            <Space size={16}>
              <Button
                href={`/api/driver/documents/download?id=${selectedRowKeys}`}
                icon={<DownloadOutlined />}
              >
                {intl.formatMessage({ id: 'DRIVE_ACTION_DOWNLOAD' })}
              </Button>
              <Button icon={<DragOutlined />} onClick={handleMove()}>
                {intl.formatMessage({ id: 'DRIVE_ACTION_MOVE' })}
              </Button>
              <Button icon={<CopyOutlined />} onClick={handleCopy()}>
                {intl.formatMessage({ id: 'DRIVE_ACTION_COPY' })}
              </Button>
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                onClick={handleDelete()}
              >
                {intl.formatMessage({ id: 'DRIVE_ACTION_DELETE' })}
              </Button>
            </Space>
          );
        }}
      />
    </>
  );
};

export default DocumentsList;
