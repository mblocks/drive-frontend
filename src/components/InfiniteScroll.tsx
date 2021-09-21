import React, { useState, useEffect } from 'react';
import Scroll from 'react-infinite-scroller';

export type InfiniteScroll = {
  query: { dir: string };
  loadMore: Function;
  children?: JSX.Element;
};
const InfiniteScroll: React.FC<InfiniteScroll> = ({
  query,
  loadMore,
  children,
}) => {
  const [manual, setManual] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [query.parent]);
  useEffect(() => {
    page > 1 && loadMore(page).then((res) => setHasMore(res.length > 0));
  }, [manual]);

  return (
    <Scroll
      pageStart={1}
      initialLoad={false}
      loadMore={() => {
        setHasMore(false);
        setPage(page + 1);
        setManual(new Date().getTime());
      }}
      hasMore={hasMore}
    >
      {children}
    </Scroll>
  );
};

export default InfiniteScroll;
