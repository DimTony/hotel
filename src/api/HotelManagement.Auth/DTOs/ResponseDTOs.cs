using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Auth.DTOs
{
    public class PaginationParams
    {
        private const int MaxPageSize = 100;
        private int _pageSize = 10;

        public int PageNumber { get; set; } = 1;

        public int PageSize
        {
            get => _pageSize;
            set => _pageSize = (value > MaxPageSize) ? MaxPageSize : value;
        }
    }

    public class NonPaginatedResponseDTO<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public string? Message { get; set; }
        public List<string> Errors { get; set; }

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