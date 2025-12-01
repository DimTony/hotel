import React from "react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
  itemName?: string; // e.g., "users", "transactions", "items"
}

/**
 * Reusable PaginationControls Component
 *
 * Usage Example:
 *
 * <PaginationControls
 *   currentPage={currentPage}
 *   totalPages={totalPages}
 *   totalCount={totalCount}
 *   pageSize={pageSize}
 *   onPageChange={setCurrentPage}
 *   itemName="users"
 * />
 */
export function TableControls({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  className = "",
  itemName = "items",
}: PaginationControlsProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  // Generate page numbers with ellipsis for large page counts
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];

    if (currentPage <= 4) {
      // Show first 5 pages, ellipsis, last page
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (currentPage >= totalPages - 3) {
      // Show first page, ellipsis, last 5 pages
      pages.push(
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      );
    } else {
      // Show first, ellipsis, current-1, current, current+1, ellipsis, last
      pages.push(
        1,
        "...",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "...",
        totalPages
      );
    }

    return pages;
  };

  if (totalCount === 0) return null;

  return (
    <div
      className={`mt-4 flex items-center justify-between text-sm ${className}`}
    >
      <div className="text-gray-300">
        Showing {startItem} to {endItem} of {totalCount} {itemName}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 backdrop-blur-xl bg-white/10 text-white rounded-md text-xs hover:bg-white/65 hover:text-black cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/10 disabled:hover:text-white"
        >
          Previous
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) =>
            typeof page === "number" ? (
              <button
                key={index}
                onClick={() => onPageChange(page)}
                className={`px-2 py-1 rounded-md text-xs transition-all duration-300 ${
                  currentPage === page
                    ? "bg-white text-black"
                    : "backdrop-blur-xl bg-white/10 text-white hover:bg-white/65 hover:text-black"
                }`}
              >
                {page}
              </button>
            ) : (
              <span key={index} className="px-2 py-1 text-gray-400">
                {page}
              </span>
            )
          )}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 backdrop-blur-xl bg-white/10 text-white rounded-md text-xs hover:bg-white/65 hover:text-black cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/10 disabled:hover:text-white"
        >
          Next
        </button>
      </div>
    </div>
  );
}
