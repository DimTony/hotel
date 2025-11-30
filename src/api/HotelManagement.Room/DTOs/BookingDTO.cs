namespace HotelManagement.DTOs
{
	public class BookingDTO
	{
		public int Id { get; set; }
		public int RoomId { get; set; }
		public string RoomNumber { get; set; }
		public int GuestId { get; set; }
		public string GuestName { get; set; }
		public DateTime CheckInDate { get; set; }
		public DateTime CheckOutDate { get; set; }
		public decimal TotalAmount { get; set; }
		public string Status { get; set; }
	}

	public class CreateBookingDTO
	{
		public int RoomId { get; set; }
		public int GuestId { get; set; }
		public DateTime CheckInDate { get; set; }
		public DateTime CheckOutDate { get; set; }
	}
}