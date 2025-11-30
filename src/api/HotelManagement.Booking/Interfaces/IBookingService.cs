using HotelManagement.Booking.DTOs;

namespace HotelManagement.Booking.Interfaces
{
    public interface IBookingService
    {
        Task<PaginatedResponse<BookingDTO>> GetFilteredBookingsAsync(BookingFilterDTO filter);
        Task<NonPaginatedResponse<BookingDTO>> GetBookingByIdAsync(int id);
        Task<NonPaginatedResponse<IEnumerable<BookingDTO>>> GetBookingsByGuestIdAsync(int guestId);
        Task<NonPaginatedResponse<BookingDTO>> CreateBookingAsync(CreateBookingDTO createBookingDTO);
        Task<NonPaginatedResponse<BookingDTO>> UpdateBookingAsync(int id, UpdateBookingDTO updateBookingDTO);
        Task<NonPaginatedResponse<BookingDTO>> CancelBookingAsync(int id, string? cancellationReason = null);
        Task<NonPaginatedResponse<BookingDTO>> ConfirmBookingAsync(int id);
        Task<NonPaginatedResponse<BookingDTO>> CheckInAsync(int id);
        Task<NonPaginatedResponse<BookingDTO>> CheckOutAsync(int id);
        Task<NonPaginatedResponse<bool>> CheckAvailabilityAsync(int roomId, DateTime checkIn, DateTime checkOut);
        Task<NonPaginatedResponse<IEnumerable<BookingDTO>>> GetUpcomingBookingsAsync(int days = 7);
        Task<NonPaginatedResponse<IEnumerable<BookingDTO>>> GetActiveBookingsAsync();
    }
}

