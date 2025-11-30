using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Booking.DTOs
{
    public class NonPaginatedResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public static NonPaginatedResponse<T> SuccessResult(T data, string message = "Operation successful")
        {
            return new NonPaginatedResponse<T>
            {
                Success = true,
                Message = message,
                Data = data
            };
        }

        public static NonPaginatedResponse<T> FailureResult(string message, List<string>? errors = null)
        {
            return new NonPaginatedResponse<T>
            {
                Success = false,
                Message = message,
                Errors = errors ?? new List<string>()
            };
        }
    }

    public class PagedList<T>
    {
        public List<T> Data { get; set; } = new List<T>();
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public bool HasPrevious => PageNumber > 1;
        public bool HasNext => PageNumber < TotalPages;

        public PagedList(List<T> items, int count, int pageNumber, int pageSize)
        {
            Data = items;
            PageNumber = pageNumber;
            PageSize = pageSize;
            TotalCount = count;
            TotalPages = (int)Math.Ceiling(count / (double)pageSize);
        }

        public static async Task<PagedList<T>> CreateAsync(IQueryable<T> source, int pageNumber, int pageSize)
        {
            var count = await source.CountAsync();
            var items = await source
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedList<T>(items, count, pageNumber, pageSize);
        }
    }

    public class PaginatedResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public List<T> Data { get; set; } = new List<T>();
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public bool HasPrevious { get; set; }
        public bool HasNext { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public static PaginatedResponse<T> Create(PagedList<T> pagedList, string message = "Operation successful")
        {
            return new PaginatedResponse<T>
            {
                Success = true,
                Message = message,
                Data = pagedList.Data,
                PageNumber = pagedList.PageNumber,
                PageSize = pagedList.PageSize,
                TotalCount = pagedList.TotalCount,
                TotalPages = pagedList.TotalPages,
                HasPrevious = pagedList.HasPrevious,
                HasNext = pagedList.HasNext
            };
        }

        public static PaginatedResponse<T> FailureResult(string message, List<string>? errors = null)
        {
            return new PaginatedResponse<T>
            {
                Success = false,
                Message = message,
                Errors = errors ?? new List<string>()
            };
        }
    }
}
