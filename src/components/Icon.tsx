import { createFromIconfontCN } from '@ant-design/icons';
const MyIcon = createFromIconfontCN({
  scriptUrl: '/load/drive/assets/icon/font_2691390_fnxb7b483y.js', // 在 iconfont.cn 上生成
});
const types = {
  dir: 'icon-dir',
  file: 'icon-file',
  xlsx: 'icon-xlsx',
  pptx: 'icon-pptx',
  jpeg: 'icon-jpeg',
  png: 'icon-png',
};

export default ({ type, ...props }: { type: string }) => (
  <MyIcon {...props} type={types[type] ? types[type] : 'icon-file'} />
);
