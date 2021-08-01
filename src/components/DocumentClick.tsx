import React, { useState } from 'react';

export interface DocumentClickProps {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLElement>;
  onDoubleClick?: React.MouseEventHandler<HTMLElement>;
}

const DocumentClick = ({
  onClick,
  onDoubleClick,
  children,
  ...rest
}: DocumentClickProps) => {
  const [current, setCurrent] = useState(new Date().getTime());
  return (
    <div
      {...rest}
      onClick={(e) => {
        const time = new Date().getTime();
        if (time - current > 400) {
          onClick && onClick(e);
        } else {
          onDoubleClick && onDoubleClick(e);
        }
        setCurrent(time);
      }}
    >
      {children}
    </div>
  );
};

export default DocumentClick;
