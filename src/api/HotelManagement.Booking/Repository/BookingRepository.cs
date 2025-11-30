

using HotelManagement.Booking.Data;
using HotelManagement.Booking.DTOs;
using HotelManagement.Booking.Interfaces;
using HotelManagement.Booking.Models;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Booking.Repositories
{
	public class BookingRepository : IBookingRepository
	{
		private readonly ApplicationDbContext _context;

		public BookingRepository(ApplicationDbContext context)
		{
			_context = context;
		}

		public async Task<PagedList<Models.Booking>> GetFilteredBookingsAsync(BookingFilterDTO filter)
		{
			var query = _context.Bookings
				.Include(b => b.Guest)
				.AsNoTracking()
				.AsQueryable();

			query = ApplyFilters(query, filter);
			query = ApplySorting(query, filter.SortBy, filter.SortOrder);

			return await PagedList<Models.Booking>.CreateAsync(query, filter.PageNumber, filter.PageSize);
		}

		public async Task<Models.Booking?> GetBookingByIdAsync(int id)
		{
			return await _context.Bookings
				.Include(b => b.Guest)
				.FirstOrDefaultAsync(b => b.Id == id);
		}

		public async Task<IEnumerable<Models.Booking>> GetBookingsByGuestIdAsync(int guestId)
		{
			return await _context.Bookings
				.Include(b => b.Guest)
				.AsNoTracking()
				.Where(b => b.GuestId == guestId)
				.OrderByDescending(b => b.CheckInDate)
				.ToListAsync();
		}

		public async Task<IEnumerable<Models.Booking>> GetBookingsByRoomIdAsync(int roomId)
		{
			return await _context.Bookings
				.Include(b => b.Guest)
				.AsNoTracking()
				.Where(b => b.RoomId == roomId)
				.OrderByDescending(b => b.CheckInDate)
				.ToListAsync();
		}

		public async Task<Models.Booking> CreateBookingAsync(Models.Booking booking)
		{
			await _context.Bookings.AddAsync(booking);
			return booking;
		}

		public async Task<Models.Booking> UpdateBookingAsync(Models.Booking booking)
		{
			booking.UpdatedAt = DateTime.UtcNow;
			_context.Entry(booking).State = EntityState.Modified;
			return booking;
		}

		public async Task<bool> IsRoomAvailableAsync(int roomId, DateTime checkIn, DateTime checkOut, int? excludeBookingId = null)
		{
			var hasConflict = await _context.Bookings
				.AsNoTracking()
				.Where(b => b.RoomId == roomId
					&& b.Status != BookingStatus.Cancelled
					&& b.CheckInDate < checkOut.Date
					&& b.CheckOutDate > checkIn.Date)
				.Where(b => !excludeBookingId.HasValue || b.Id != excludeBookingId.Value)
				.AnyAsync();

			return !hasConflict;
		}

		public async Task<IEnumerable<Models.Booking>> GetUpcomingBookingsAsync(int days = 7)
		{
			var startDate = DateTime.Today;
			var endDate = startDate.AddDays(days);

			return await _context.Bookings
				.Include(b => b.Guest)
				.AsNoTracking()
				.Where(b => b.CheckInDate >= startDate
					&& b.CheckInDate <= endDate
					&& b.Status != BookingStatus.Cancelled)
				.OrderBy(b => b.CheckInDate)
				.ToListAsync();
		}

		public async Task<IEnumerable<Models.Booking>> GetActiveBookingsAsync()
		{
			var today = DateTime.Today;

			return await _context.Bookings
				.Include(b => b.Guest)
				.AsNoTracking()
				.Where(b => b.CheckInDate <= today
					&& b.CheckOutDate >= today
					&& b.Status == BookingStatus.CheckedIn)
				.OrderBy(b => b.CheckOutDate)
				.ToListAsync();
		}

		public async Task<IEnumerable<Models.Booking>> GetBookingsByDateRangeAsync(DateTime startDate, DateTime endDate)
		{
			return await _context.Bookings
				.Include(b => b.Guest)
				.AsNoTracking()
				.Where(b => b.CheckInDate <= endDate.Date && b.CheckOutDate >= startDate.Date)
				.OrderBy(b => b.CheckInDate)
				.ToListAsync();
		}

		private IQueryable<Models.Booking> ApplyFilters(IQueryable<Models.Booking> query, BookingFilterDTO filter)
		{
			if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
			{
				var searchTerm = filter.SearchTerm.ToLower();
				query = query.Where(b =>
					b.RoomNumber.ToLower().Contains(searchTerm) ||
					b.Guest.FirstName.ToLower().Contains(searchTerm) ||
					b.Guest.LastName.ToLower().Contains(searchTerm) ||
					b.Guest.Email.ToLower().Contains(searchTerm)
				);
			}

			if (filter.GuestId.HasValue)
			{
				query = query.Where(b => b.GuestId == filter.GuestId.Value);
			}

			if (filter.RoomId.HasValue)
			{
				query = query.Where(b => b.RoomId == filter.RoomId.Value);
			}

			if (!string.IsNullOrWhiteSpace(filter.Status) &&
				Enum.TryParse<BookingStatus>(filter.Status, true, out var parsedStatus))
			{
				query = query.Where(b => b.Status == parsedStatus);
			}

			if (!string.IsNullOrWhiteSpace(filter.RoomType))
			{
				query = query.Where(b => b.RoomType.ToLower() == filter.RoomType.ToLower());
			}

			if (filter.CheckInFrom.HasValue)
			{
				query = query.Where(b => b.CheckInDate >= filter.CheckInFrom.Value.Date);
			}

			if (filter.CheckInTo.HasValue)
			{
				query = query.Where(b => b.CheckInDate <= filter.CheckInTo.Value.Date);
			}

			if (filter.CheckOutFrom.HasValue)
			{
				query = query.Where(b => b.CheckOutDate >= filter.CheckOutFrom.Value.Date);
			}

			if (filter.CheckOutTo.HasValue)
			{
				query = query.Where(b => b.CheckOutDate <= filter.CheckOutTo.Value.Date);
			}

			if (filter.MinAmount.HasValue)
			{
				query = query.Where(b => b.TotalAmount >= filter.MinAmount.Value);
			}

			if (filter.MaxAmount.HasValue)
			{
				query = query.Where(b => b.TotalAmount <= filter.MaxAmount.Value);
			}

			if (filter.CreatedAfter.HasValue)
			{
				query = query.Where(b => b.CreatedAt >= filter.CreatedAfter.Value);
			}

			if (filter.CreatedBefore.HasValue)
			{
				query = query.Where(b => b.CreatedAt <= filter.CreatedBefore.Value);
			}

			return query;
		}

		private IQueryable<Models.Booking> ApplySorting(IQueryable<Models.Booking> query, string? sortBy, string? sortOrder)
		{
			if (string.IsNullOrWhiteSpace(sortBy))
			{
				return query.OrderByDescending(b => b.CreatedAt);
			}

			var isDescending = sortOrder?.ToLower() == "desc";

			return sortBy.ToLower() switch
			{
				"checkin" or "checkindate" => isDescending
					? query.OrderByDescending(b => b.CheckInDate)
					: query.OrderBy(b => b.CheckInDate),
				"checkout" or "checkoutdate" => isDescending
					? query.OrderByDescending(b => b.CheckOutDate)
					: query.OrderBy(b => b.CheckOutDate),
				"totalamount" or "amount" => isDescending
					? query.OrderByDescending(b => b.TotalAmount)
					: query.OrderBy(b => b.TotalAmount),
				"status" => isDescending
					? query.OrderByDescending(b => b.Status)
					: query.OrderBy(b => b.Status),
				"roomnumber" => isDescending
					? query.OrderByDescending(b => b.RoomNumber)
					: query.OrderBy(b => b.RoomNumber),
				"guestname" => isDescending
					? query.OrderByDescending(b => b.Guest.LastName).ThenByDescending(b => b.Guest.FirstName)
					: query.OrderBy(b => b.Guest.LastName).ThenBy(b => b.Guest.FirstName),
				"createdat" or "created" => isDescending
					? query.OrderByDescending(b => b.CreatedAt)
					: query.OrderBy(b => b.CreatedAt),
				_ => query.OrderByDescending(b => b.CreatedAt)
			};
		}
	}
}





