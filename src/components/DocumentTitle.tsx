import { Button } from 'antd';
import Icon from './Icon';

export interface DocumentTitleProps {
  type: string;
  name: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
}
const DocumentTitle = ({ type, name, onClick }: DocumentTitleProps) => {
  return (
    <Button
      type="text"
      size="large"
      icon={<Icon type={type} />}
      onClick={onClick}
    >
      {name}
    </Button>
  );
};
export default DocumentTitle;
