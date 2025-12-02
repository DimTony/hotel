namespace HotelManagement.DTOs
{
    public class RoomDTO
    {
        public int Id { get; set; }
        public string RoomNumber { get; set; }
        public string RoomType { get; set; } // e.g., Single, Double, Suite
        public string Status { get; set; }
        public decimal PricePerNight { get; set; }
        public int Capacity { get; set; }
        public bool IsAvailable { get; set; }
        public string Description { get; set; }
    }

    public class CreateRoomDTO
    {
        public string RoomNumber { get; set; }
        public string RoomType { get; set; } // e.g., Single, Double, Suite
        public decimal PricePerNight { get; set; }
        public int Capacity { get; set; }
        public bool IsAvailable { get; set; }
        public string Description { get; set; }
    }

    public class GetRoomsDTO
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? Type { get; set; } // e.g., Single, Double, Suite
    }

    public class  PaginationParams
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

    public abstract class BaseFilter : PaginationParams
    {
        public string? SearchTerm { get; set; }
        public string SortOrder { get; set; } = "asc"; // "asc" or "desc"
        public string? SortBy { get; set; }
    }

    public class RoomFilterDTO : BaseFilter
    {
        public string? RoomType { get; set; } // e.g., Single, Double, Suite
        public string? Status { get; set; } 
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public int? MinCapacity { get; set; }
        public int? MaxCapacity { get; set; }
        public bool? IsAvailable { get; set; }
        public int? Floor { get; set; }
        public DateTime? AvailableFrom { get; set; }
        public DateTime? AvailableTo { get; set; }
    }
}