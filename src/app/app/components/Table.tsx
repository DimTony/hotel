import React from "react";

interface Column<T> {
  key: string;
  header: string;
  render: (item: T, index: number) => React.ReactNode;
  className?: string;
}

interface PaginatedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  rowClassName?: string;
  tableClassName?: string;
}

/**
 * Reusable PaginatedTable Component
 *
 * Usage Example:
 *
 * const columns = [
 *   {
 *     key: "name",
 *     header: "Name",
 *     render: (user) => (
 *       <div className="flex items-center gap-2">
 *         <div className="w-8 h-8 rounded-full bg-blue-500" />
 *         <span>{user.firstName} {user.lastName}</span>
 *       </div>
 *     )
 *   },
 *   {
 *     key: "email",
 *     header: "Email",
 *     render: (user) => user.email
 *   }
 * ];
 *
 * <PaginatedTable data={tableData} columns={columns} loading={loading} />
 */
export function Table<T extends { id?: number | string }>({
  data,
  columns,
  loading = false,
  emptyMessage = "No data found",
  rowClassName = "border-b border-white/10 hover:bg-white/5 transition",
  tableClassName = "w-full text-left text-sm text-white",
}: PaginatedTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className={tableClassName}>
        <thead>
          <tr className="border-b border-white/20 text-gray-200">
            {columns.map((column) => (
              <th key={column.key} className={column.className || "py-3 px-2"}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-8 text-center text-gray-400"
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Loading...
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-8 text-center text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr key={item.id || index} className={rowClassName}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={column.className || "py-2 px-2"}
                  >
                    {column.render(item, index)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
