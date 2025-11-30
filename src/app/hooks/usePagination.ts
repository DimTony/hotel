import { useEffect, useState } from "react";

const usePagination = (queryFunction: any) => {
  const [paginatedData, setPaginatedData] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  useEffect(() => {
    queryFunction(1);
  }, []);

  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    await queryFunction(page);
  };

  return {
    pageLoading,
    paginatedData,
    currentPage,
    setPaginatedData,
    setPageLoading,
    setCurrentPage,
    handlePageChange,
    totalItems,
    setTotalItems,
  };
};

export default usePagination;
