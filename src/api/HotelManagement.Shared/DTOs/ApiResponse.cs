namespace HotelManagement.Shared.DTOs
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public T Data { get; set; }
        public List<string> Errors { get; set; }
        public DateTime Timestamp { get; set; }
        public string TraceId { get; set; }


        public ApiResponse()
        {
            Errors = new List<string>();
            Timestamp = DateTime.UtcNow;
        }

        public static ApiResponse<T> SuccessResponse(T data, string message = "Operation successful")
        {
            return new ApiResponse<T>
            {
                Success = true,
                Message = message,
                Data = data
            }
        }

        public static ApiResponse<T> ErrorResponse(string message = "Operation Failed", List<string> errors = null)
        {
            return new ApiResponse<T>
            {
                Success = false,
                Message = message,
                Errors = errors ?? new List<string>()
            }
        }
    }

    public class PaginatedApiResponse<T> : ApiResponse<List<T>>
    {
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public bool HasPrevious { get; set; }
        public bool HasNext { get; set; }

        public static PaginatedApiResponse<T> SuccessResponse(List<T> data, int pageNumber, int pageSize, int totalCount, string message = "Operation Successful")
        {
            return new PaginatedApiResponse<T>
            {
                Success = true,
                Message = message,
                Data = data,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                HasPrevious = pageNumber > 1,
                HasNext = pageNumber < (int)Math.Ceiling(totalCount / (double)pageSize),
            }
        }

        public static PaginatedApiResponse<T> ErrorResponse(string message = "Operation failed.", List<string> errors = null)
        {
            return new PaginatedApiResponse<T>
            {
                Success = false,
                Message = message,
                Errors = errors ?? new List<string>()
            };
        }
    }
}