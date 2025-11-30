namespace HotelManagement.Shared.Events
{
    public abstract class BaseEvent
    {
        public Guid EventId { get; set; }
        public DateTime CreatedAt { get; set; }
        public string EventType { get; set; }

        protected BaseEvent()
        {
            EventId = Guid.NewGuid();
            CreatedAt = DateTime.UtcNow;
            EventType = GetType().Name;
        }
    }

    public class RoomCreatedEvent : BaseEvent
    {
        public int RoomId { get; set; }
        public string RoomNumber { get; set; }
        public string RoomType { get; set; }
    }

    public class BookingCreatedEvent : BaseEvent
    {
        public int BookingId { get; set; }
        public int RoomId { get; set; }
        public int GuestId { get; set; }
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public decimal TotalAmount { get; set; }
    }

}

