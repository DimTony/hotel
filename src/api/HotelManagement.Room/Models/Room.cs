
namespace HotelManagement.Models
{
    public class Room
    {
        public int Id { get; set; }
        public string RoomNumber { get; set; }
        public RoomType RoomType { get; set; } // e.g., Single, Double, Suite
        public RoomStatus Status { get; set; } // e.g., Single, Double, Suite
        public decimal PricePerNight { get; set; }
        public int Capacity { get; set; }
        public bool IsAvailable { get; set; }
        public string Description { get; set; }
        //public Room(int roomNumber, string type, decimal pricePerNight, bool isAvailable)
        //{
        //    RoomNumber = roomNumber;
        //    Type = type;
        //    PricePerNight = pricePerNight;
        //    IsAvailable = isAvailable;
        //}
        public List<Booking> Bookings { get; set; }
    }

    public enum RoomType
    {
        Single,
        Double,
        Suite,
        Deluxe
    }

    public enum RoomStatus
    {
        Available,
        Occupied,
        Maintenance,
        Booked,
        Reserved
    }
}