namespace HotelManagement.Booking.Models
{
    public class Booking
    {
        public int Id { get; set; }

        public int RoomId { get; set; }

        public string RoomNumber { get; set; } = string.Empty;
        public string RoomType { get; set; } = string.Empty;
        public decimal PricePerNight { get; set; }

        public int GuestId { get; set; }
        public Guest Guest { get; set; } = null;

        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public int NumberOfNights { get; set; }
        public decimal TotalAmount { get; set; }
        public BookingStatus Status { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public string? CancellationReason {  get; set; }
        public DateTime? CancelledAt { get; set; }
    }

    public enum BookingStatus
    {
        Pending,
        Confirmed,
        CheckedIn,
        CheckedOut,
        Cancelled
    }
}