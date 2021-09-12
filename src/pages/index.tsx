import { useEffect, useState } from 'react';
import { connect, useDispatch, useLocation, history, useIntl } from 'umi';
import { PageContainer } from '@ant-design/pro-layout';
import {
  Row,
  Col,
  Card,
  Tree,
  Radio,
  Breadcrumb,
  Button,
  Menu,
  Dropdown,
} from 'antd';
import {
  UnorderedListOutlined,
  AppstoreOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import InfiniteScroll from '@/components/InfiniteScroll';
import DocumentsExpand from '@/components/DocumentsExpand';
import DocumentsList from '@/components/DocumentsList';
import Uploader from '@/components/Uploader';

const IndexPage = ({ driver }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const intl = useIntl();
  const [query, setQuery] = useState(location.query);
  const [selectedKeys, setSelectedKeys] = useState([query.parent]);
  const [showType, setShowType] = useState('list');

  driver.dirs.length == 1 &&
    driver.dirs.forEach((v) => {
      if (v.id == 'root') {
        v.title = intl.formatMessage({ id: 'DRIVE_ROOT' });
      }
    });

  useEffect(() => {
    // Loading directories requires root data first, so exclude query
    dispatch({ type: 'driver/fetchDirs', payload: {} });
  }, []);
  useEffect(() => history.push({ query }), [query]);
  useEffect(() => {
    setQuery({ ...query, parent: driver.parent });
    !selectedKeys.includes(Number(driver.parent)) && setSelectedKeys([]);
    window.scroll(0, 0);
  }, [driver.parent]);
  useEffect(() => {
    selectedKeys.length > 0 &&
      dispatch({
        type: 'driver/goto',
        payload: { parent: selectedKeys.join('') },
      });
  }, [selectedKeys]);

  const MyBreadcrumb = () => {
    return (
      <Breadcrumb>
        <Breadcrumb.Item
          onClick={() => dispatch({ type: 'driver/goto', payload: {} })}
        >
          <Button type="text">
            {intl.formatMessage({ id: 'DRIVE_ROOT' })}
          </Button>
        </Breadcrumb.Item>
        {driver.breadcrumb.map((v) => (
          <Breadcrumb.Item
            key={v.id}
            onClick={() =>
              dispatch({
                type: 'driver/goto',
                payload: { parent: v.id },
              })
            }
          >
            <Button type="text">{v.title}</Button>
          </Breadcrumb.Item>
        ))}
      </Breadcrumb>
    );
  };
  return (
    <PageContainer
      header={{
        title: 'Drive',
        ghost: true,
      }}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={12} lg={12} xl={6} xxl={4}>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item
                  key="create-dir"
                  onClick={() => {
                    dispatch({
                      type: 'driver/create',
                      payload: {
                        name: 'New Dir',
                        type: 'dir',
                        parent: query.parent,
                      },
                    });
                  }}
                >
                  {intl.formatMessage({ id: 'DRIVE_CREATE_DIR' })}
                </Menu.Item>
                <Menu.Item key="upload-file" icon={<UploadOutlined />}>
                  <Uploader parent={query.parent}>
                    {intl.formatMessage({ id: 'DRIVE_UPLOAD_FILE' })}
                  </Uploader>
                </Menu.Item>
                <Menu.Item key="upload-dir" icon={<UploadOutlined />}>
                  <Uploader directory parent={query.parent}>
                    {intl.formatMessage({ id: 'DRIVE_UPLOAD_DIR' })}
                  </Uploader>
                </Menu.Item>
              </Menu>
            }
          >
            <Button
              type="primary"
              size="large"
              block
              icon={<PlusOutlined />}
              style={{ marginBottom: 10 }}
            >
              {intl.formatMessage({ id: 'DRIVE_NEW' })}
            </Button>
          </Dropdown>
          <Card size="small">
            <Tree
              treeData={driver.dirs}
              selectedKeys={selectedKeys}
              onSelect={(key) => {
                key.length != 0 && setSelectedKeys(key);
              }}
              loadData={(node) =>
                dispatch({
                  type: 'driver/fetchDirs',
                  payload: { parent: node.id },
                })
              }
            />
          </Card>
        </Col>
        <Col
          className="gutter-row"
          xs={24}
          sm={12}
          md={12}
          lg={12}
          xl={18}
          xxl={20}
        >
          <Card
            bordered={false}
            size="small"
            title={<MyBreadcrumb />}
            extra={
              <Radio.Group
                key="showtype"
                options={[
                  { label: <UnorderedListOutlined />, value: 'list' },
                  { label: <AppstoreOutlined />, value: 'expand' },
                ]}
                defaultValue={showType}
                optionType="button"
                buttonStyle="solid"
                onChange={(e) => setShowType(e.target.value)}
              />
            }
          >
            <InfiniteScroll
              query={query}
              loadMore={(page) => {
                return dispatch({
                  type: 'driver/fetchDocuments',
                  payload: { params: { ...query, page } },
                });
              }}
            >
              <div hidden={showType != 'list'}>
                <DocumentsList
                  documents={driver.documents}
                  dirs={driver.dirs}
                />
              </div>
              <div hidden={showType != 'expand'}>
                <DocumentsExpand
                  documents={driver.documents}
                  dirs={driver.dirs}
                />
              </div>
            </InfiniteScroll>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default connect(({ driver }) => ({ driver }))(IndexPage);
