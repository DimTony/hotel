import { useState, useCallback } from "react";

/**
 * Standard API Response structure for paginated data
 */
export interface PaginatedApiResponse<T> {
  data: T[];
  totalCount: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
  success: boolean;
  message: string;
  errors: any;
}

/**
 * Payload structure for fetching paginated data
 */
export interface PaginatedRequestPayload {
  pageNumber: number;
  pageSize: number;
  filter?: Record<string, any>;
}

/**
 * Hook configuration options
 */
export interface UsePaginatedDataOptions<T, F = any> {
  pageSize?: number;
  initialFilters?: F;
  onSuccess?: (data: PaginatedApiResponse<T>) => void;
  onError?: (error: any) => void;
}

/**
 * Type for filter updates - can be new filters or a function that receives previous filters
 */
export type FilterUpdater<F> = F | ((prev: F) => F);

/**
 * Reusable Hook for Paginated Data
 *
 * This hook handles all the common state and logic for paginated API calls.
 *
 * @example
 * ```tsx
 * const {
 *   data,
 *   loading,
 *   currentPage,
 *   totalPages,
 *   totalCount,
 *   filters,
 *   setCurrentPage,
 *   setFilters,
 *   fetchData,
 *   refetch
 * } = useTableData({
 *   fetchFn: fetchAllUsers,
 *   pageSize: 10,
 *   initialFilters: { status: "active" }
 * });
 *
 * // In useEffect
 * useEffect(() => {
 *   fetchData();
 * }, [currentPage]);
 * ```
 */
export function useTableData<T, F = any>(
  fetchFn: (
    payload: PaginatedRequestPayload
  ) => Promise<PaginatedApiResponse<T>>,
  options: UsePaginatedDataOptions<T, F> = {}
) {
  const {
    pageSize = 10,
    initialFilters = {} as F,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<F>(initialFilters);

  /**
   * Main fetch function
   */
  const fetchData = useCallback(
    async (customFilters?: F, customPage?: number) => {
      setLoading(true);
      try {
        const filtersToUse =
          customFilters !== undefined ? customFilters : filters;
        const pageToUse = customPage !== undefined ? customPage : currentPage;

        const payload: PaginatedRequestPayload = {
          pageNumber: pageToUse,
          pageSize: pageSize,
          filter: filtersToUse as Record<string, any>,
        };

        const response = await fetchFn(payload);

        setData(response.data || []);
        setTotalCount(response.totalCount || 0);
        setTotalPages(response.totalPages || 0);

        onSuccess?.(response);
      } catch (error) {
        console.error("Failed to fetch paginated data:", error);

        setData([]);
        setTotalCount(0);
        setTotalPages(0);

        onError?.(error);
      } finally {
        setLoading(false);
      }
    },
    [fetchFn, filters, currentPage, pageSize, onSuccess, onError]
  );

  /**
   * Type guard to check if value is a function
   */
  const isFunction = <T>(value: any): value is (prev: T) => T => {
    return typeof value === "function";
  };

  /**
   * Update filters and reset to page 1
   */
  const updateFilters = useCallback(
    (newFilters: FilterUpdater<F>) => {
      const updatedFilters = isFunction<F>(newFilters)
        ? newFilters(filters)
        : newFilters;

      setFilters(updatedFilters);
      setCurrentPage(1);
      fetchData(updatedFilters, 1);
    },
    [filters, fetchData]
  );

  /**
   * Refetch current page with current filters
   */
  const refetch = useCallback(() => {
    fetchData(filters, currentPage);
  }, [fetchData, filters, currentPage]);

  /**
   * Go to specific page
   */
  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages]
  );

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    setCurrentPage(1);
    setFilters(initialFilters);
    setData([]);
    setTotalCount(0);
    setTotalPages(0);
  }, [initialFilters]);

  return {
    // State
    data,
    loading,
    currentPage,
    totalPages,
    totalCount,
    filters,
    pageSize,

    // Setters
    setCurrentPage: goToPage,
    setFilters: updateFilters,

    // Actions
    fetchData,
    refetch,
    reset,
  };
}
