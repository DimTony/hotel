using System.ComponentModel.DataAnnotations;


namespace HotelManagement.Booking.DTOs
{
    public class BookingDTO
    {
        public int Id { get; set; }
        public int RoomId { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public string RoomType { get; set; } = string.Empty;
        public int GuestId { get; set; }
        public string GuestName { get; set; } = string.Empty;
        public string GuestEmail { get; set; } = string.Empty;
        public string GuestPhone { get; set; } = string.Empty;
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public int NumberOfNights { get; set; }
        public decimal PricePerNight { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? CancellationReason { get; set; }
    }

    public class CreateBookingDTO
    {
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Room ID must be greater than 0")]
        public int RoomId { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Guest ID must be greater than 0")]
        public int GuestId { get; set; }

        [Required]
        public DateTime CheckInDate { get; set; }

        [Required]
        public DateTime CheckOutDate { get; set; }
    }

    public class UpdateBookingDTO
    {
        public DateTime? CheckInDate { get; set; }
        public DateTime? CheckOutDate { get; set; }
        public int? RoomId { get; set; }
    }

    public class CancelBookingDTO
    {
        [MaxLength(500)]
        public string? Reason { get; set; }
    }

    public class BookingFilterDTO : PaginationParams
    {
        public int? GuestId { get; set; }
        public int? RoomId { get; set; }
        public string? Status { get; set; }
        public string? RoomType { get; set; }
        public DateTime? CheckInFrom { get; set; }
        public DateTime? CheckInTo { get; set; }
        public DateTime? CheckOutFrom { get; set; }
        public DateTime? CheckOutTo { get; set; }
        public decimal? MinAmount { get; set; }
        public decimal? MaxAmount { get; set; }
        public DateTime? CreatedAfter { get; set; }
        public DateTime? CreatedBefore { get; set; }
        public string? SearchTerm { get; set; }
        public string? SortBy { get; set; }
        public string SortOrder { get; set; } = "desc";
    }

    public class CheckAvailabilityDTO
    {
        [Required]
        public int RoomId { get; set; }

        [Required]
        public DateTime CheckInDate { get; set; }

        [Required]
        public DateTime CheckOutDate { get; set; }
    }

    public class GuestDTO
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? Address { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public int TotalBookings { get; set; }
    }

    public class CreateGuestDTO
    {
        [Required]
        [MaxLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [Phone]
        [MaxLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Address { get; set; }

        public DateTime? DateOfBirth { get; set; }
    }

    public class UpdateGuestDTO
    {
        [MaxLength(100)]
        public string? FirstName { get; set; }

        [MaxLength(100)]
        public string? LastName { get; set; }

        [EmailAddress]
        [MaxLength(255)]
        public string? Email { get; set; }

        [Phone]
        [MaxLength(20)]
        public string? PhoneNumber { get; set; }

        [MaxLength(500)]
        public string? Address { get; set; }

        public DateTime? DateOfBirth { get; set; }
    }

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

    // Room service DTOs (for external API calls)
    public class RoomDTO
    {
        public int Id { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public string RoomType { get; set; } = string.Empty;
        public decimal PricePerNight { get; set; }
        public int Capacity { get; set; }
        public bool IsAvailable { get; set; }
    }
}