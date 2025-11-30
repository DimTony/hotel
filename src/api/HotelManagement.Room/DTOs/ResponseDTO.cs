using Microsoft.EntityFrameworkCore;

namespace HotelManagement.DTOs
{
    public class NonPaginatedResponseDTO<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public T Data { get; set; }
        public List<string> Errors { get; set; }

        public NonPaginatedResponseDTO()
        {
            Errors = new List<string>();
        }

        public static NonPaginatedResponseDTO<T> SuccessResult(T data, string message = "Operation successful.")
        {
            return new NonPaginatedResponseDTO<T>
            {
                Success = true,
                Message = message,
                Data = data
            };
        }

        public static NonPaginatedResponseDTO<T> FailureResult(string message = "Operation failed.", List<string> errors = null)
        {
            return new NonPaginatedResponseDTO<T>
            {
                Success = false,
                Message = message,
                Errors = errors ?? new List<string>()
            };
        }
    }

    public class PagedList<T>
    {
        public List<T> Data { get; set; }
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
            var items = await source.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

            return new PagedList<T>(items, count, pageNumber, pageSize);
        }
    }

    public class PaginatedResponseDTO<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public List<T> Data { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public bool HasPrevious { get; set; }
        public bool HasNext { get; set; }
        public List<string> Errors { get; set; }
        public PaginatedResponseDTO()
        {
            Errors = new List<string>();
        }

        public static PaginatedResponseDTO<T> Create(PagedList<T> pagedList, string message = "Operation Successful")
        {
            return new PaginatedResponseDTO<T>
            {
                Success = true,
                Message = message,
                Data = pagedList.Data,
                PageNumber = pagedList.PageNumber,
                PageSize = pagedList.PageSize,
                TotalCount = pagedList.TotalCount,
                TotalPages = pagedList.TotalPages,
                HasPrevious = pagedList.HasPrevious,
                HasNext = pagedList.HasNext,
            };
        }

        public static PaginatedResponseDTO<T> SuccessResult(List<T> data, int pageNumber, int pageSize, int totalCount, string message = "Operation successful.")
        {
            return new PaginatedResponseDTO<T>
            {
                Success = true,
                Message = message,
                Data = data,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                HasPrevious = pageNumber > 1,
                HasNext = pageNumber < ((int)Math.Ceiling(totalCount / (double)pageSize)),

            };
        }
        public static PaginatedResponseDTO<T> FailureResult(string message = "Operation failed.", List<string> errors = null)
        {
            return new PaginatedResponseDTO<T>
            {
                Success = false,
                Message = message,
                Errors = errors ?? new List<string>()
            };
        }
    }

}
