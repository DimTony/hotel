using HotelManagement.Booking.DTOs;

namespace HotelManagement.Booking.Interfaces
{
    public interface IBookingRepository
    {
        Task<PagedList<Models.Booking>> GetFilteredBookingsAsync(BookingFilterDTO filter);
        Task<Models.Booking?> GetBookingByIdAsync(int id);
        Task<IEnumerable<Models.Booking>> GetBookingsByGuestIdAsync(int guestId);
        Task<IEnumerable<Models.Booking>> GetBookingsByRoomIdAsync(int roomId);
        Task<Models.Booking> CreateBookingAsync(Models.Booking booking);
        Task<Models.Booking> UpdateBookingAsync(Models.Booking booking);
        Task<bool> IsRoomAvailableAsync(int roomId, DateTime checkIn, DateTime checkOut, int? excludeBookingId = null);
        Task<IEnumerable<Models.Booking>> GetUpcomingBookingsAsync(int days = 7);
        Task<IEnumerable<Models.Booking>> GetActiveBookingsAsync();
        Task<IEnumerable<Models.Booking>> GetBookingsByDateRangeAsync(DateTime startDate, DateTime endDate);
    }
}
