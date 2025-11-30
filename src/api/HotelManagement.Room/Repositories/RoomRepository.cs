using Microsoft.EntityFrameworkCore;
using HotelManagement.Data;
using HotelManagement.DTOs;
using HotelManagement.Interfaces;
using HotelManagement.Models;

namespace HotelManagement.Repositories
{
    public class RoomRepository : IRoomRepository
    {
        private readonly ApplicationDbContext _context;

        public RoomRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Room>> GetAllRoomsAsync()
        {
            return await _context.Rooms
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<PagedList<Room>> GetFilteredRoomsAsync(RoomFilterDTO filter)
        {
            var query = _context.Rooms.AsNoTracking().AsQueryable();

            query = ApplyFilters(query, filter);
            query = ApplySorting(query, filter.SortBy, filter.SortOrder);

            return await PagedList<Room>.CreateAsync(query, filter.PageNumber, filter.PageSize);
        }

        public async Task<Room?> GetRoomByIdAsync(int id)
        {
            return await _context.Rooms.FindAsync(id);
        }

        public async Task<Room?> GetRoomByRoomNumberAsync(string roomNumber)
        {
            return await _context.Rooms
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.RoomNumber == roomNumber);
        }

        public async Task<Room> CreateRoomAsync(Room room)
        {
            await _context.Rooms.AddAsync(room);
            // Note: SaveChanges is called in the service layer via UnitOfWork
            return room;
        }

        public async Task<Room> UpdateRoomAsync(Room room)
        {
            _context.Entry(room).State = EntityState.Modified;
            // Note: SaveChanges is called in the service layer via UnitOfWork
            return room;
        }

        public async Task<Room> DeleteRoomAsync(Room room)
        {
            _context.Rooms.Remove(room);
            // Note: SaveChanges is called in the service layer via UnitOfWork
            return room;
        }

        public async Task<IEnumerable<Room>> GetAvailableRoomsAsync(DateTime checkIn, DateTime checkOut)
        {
            var bookedRoomIds = await _context.Bookings
                .AsNoTracking()
                .Where(b => b.CheckInDate < checkOut && b.CheckOutDate > checkIn)
                .Select(b => b.RoomId)
                .ToListAsync();

            return await _context.Rooms
                .AsNoTracking()
                .Where(r => !bookedRoomIds.Contains(r.Id) && r.IsAvailable)
                .ToListAsync();
        }

        public async Task<bool> HasActiveBookingsAsync(int roomId)
        {
            var today = DateTime.Today;
            return await _context.Bookings
                .AsNoTracking()
                .AnyAsync(b => b.RoomId == roomId && b.CheckOutDate >= today);
        }

        private IQueryable<Room> ApplyFilters(IQueryable<Room> query, RoomFilterDTO filter)
        {
            if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
            {
                var searchTerm = filter.SearchTerm.ToLower();
                query = query.Where(r =>
                    r.RoomNumber.ToLower().Contains(searchTerm) ||
                    r.RoomType.ToString().ToLower().Contains(searchTerm) ||
                    (r.Description != null && r.Description.ToLower().Contains(searchTerm))
                );
            }

            if (!string.IsNullOrWhiteSpace(filter.RoomType) &&
                Enum.TryParse<RoomType>(filter.RoomType, true, out var parsedType))
            {
                query = query.Where(r => r.RoomType == parsedType);
            }

            if (filter.MinPrice.HasValue)
            {
                query = query.Where(r => r.PricePerNight >= filter.MinPrice.Value);
            }

            if (filter.MaxPrice.HasValue)
            {
                query = query.Where(r => r.PricePerNight <= filter.MaxPrice.Value);
            }

            if (filter.IsAvailable.HasValue)
            {
                query = query.Where(r => r.IsAvailable == filter.IsAvailable.Value);
            }

            return query;
        }

        private IQueryable<Room> ApplySorting(IQueryable<Room> query, string? sortBy, string? sortOrder)
        {
            if (string.IsNullOrWhiteSpace(sortBy))
            {
                return query.OrderBy(r => r.RoomNumber);
            }

            var isDescending = sortOrder?.ToLower() == "desc";

            return sortBy.ToLower() switch
            {
                "price" => isDescending
                    ? query.OrderByDescending(r => r.PricePerNight)
                    : query.OrderBy(r => r.PricePerNight),
                "roomnumber" => isDescending
                    ? query.OrderByDescending(r => r.RoomNumber)
                    : query.OrderBy(r => r.RoomNumber),
                "capacity" => isDescending
                    ? query.OrderByDescending(r => r.Capacity)
                    : query.OrderBy(r => r.Capacity),
                "roomtype" => isDescending
                    ? query.OrderByDescending(r => r.RoomType)
                    : query.OrderBy(r => r.RoomType),
                _ => query.OrderBy(r => r.RoomNumber)
            };
        }
    }
}
