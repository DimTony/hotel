import { useEffect, useState } from "react";

const usePagination = (fetchFunction: any, initialPageSize = 10) => {
  const [paginatedData, setPaginatedData] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [filters, setFilters] = useState({});

  const totalPages = Math.ceil(totalItems / pageSize);

  const queryFunction = async (page: number) => {
    setPageLoading(true);
    try {
      const result = await fetchFunction(page, pageSize, filters);
      if (result && result.data) {
        setPaginatedData(result.data);
        setTotalItems(result.total || result.data.length);
      }
    } catch (error) {
      console.error("Error fetching paginated data:", error);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
  }, []);

  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    await queryFunction(page);
  };

  const handlePageSizeChange = async (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    await queryFunction(1);
  };

  const updateFilters = async (newFilters: any) => {
    setFilters(newFilters);
    setCurrentPage(1);
    await queryFunction(1);
  };

  const refreshData = async () => {
    await queryFunction(currentPage);
  };

  return {
    paginatedData,
    setPaginatedData,
    pageLoading,
    setPageLoading,
    currentPage,
    setCurrentPage,
    totalItems,
    setTotalItems,
    totalPages,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    updateFilters,
    refreshData,
  };
};

export default usePagination;
