using HotelManagement.Booking.Data;
using HotelManagement.Booking.Models;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Booking.Interfaces
{
    public interface IGuestRepository
    {
        Task<IEnumerable<Guest>> GetAllGuestsAsync();
        Task<Guest?> GetGuestByIdAsync(int id);
        Task<Guest?> GetGuestByEmailAsync(string email);
        Task<Guest> CreateGuestAsync(Guest guest);
        Task<Guest> UpdateGuestAsync(Guest guest);
        Task<bool> DeleteGuestAsync(int id);
        Task<bool> EmailExistsAsync(string email, int? excludeId = null);
    }
}

namespace HotelManagement.Booking.Repositories
{
    public class GuestRepository : Interfaces.IGuestRepository
    {
        private readonly ApplicationDbContext _context;

        public GuestRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Guest>> GetAllGuestsAsync()
        {
            return await _context.Guests
                .Include(g => g.Bookings)
                .AsNoTracking()
                .OrderBy(g => g.LastName)
                .ThenBy(g => g.FirstName)
                .ToListAsync();
        }

        public async Task<Guest?> GetGuestByIdAsync(int id)
        {
            return await _context.Guests
                .Include(g => g.Bookings)
                .FirstOrDefaultAsync(g => g.Id == id);
        }

        public async Task<Guest?> GetGuestByEmailAsync(string email)
        {
            return await _context.Guests
                .Include(g => g.Bookings)
                .FirstOrDefaultAsync(g => g.Email.ToLower() == email.ToLower());
        }

        public async Task<Guest> CreateGuestAsync(Guest guest)
        {
            await _context.Guests.AddAsync(guest);
            return guest;
        }

        public async Task<Guest> UpdateGuestAsync(Guest guest)
        {
            guest.UpdatedAt = DateTime.UtcNow;
            _context.Entry(guest).State = EntityState.Modified;
            return guest;
        }

        public async Task<bool> DeleteGuestAsync(int id)
        {
            var guest = await _context.Guests.FindAsync(id);
            if (guest == null)
            {
                return false;
            }

            _context.Guests.Remove(guest);
            return true;
        }

        public async Task<bool> EmailExistsAsync(string email, int? excludeId = null)
        {
            var query = _context.Guests.AsNoTracking().Where(g => g.Email.ToLower() == email.ToLower());

            if (excludeId.HasValue)
            {
                query = query.Where(g => g.Id != excludeId.Value);
            }

            return await query.AnyAsync();
        }
    }
}
