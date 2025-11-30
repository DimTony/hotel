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
            return await _context.Rooms.ToListAsync();
        }
        public async Task<PagedList<Room>> GetFilteredRoomsAsync(RoomFilterDTO filter)
        {
            var query = _context.Rooms.AsQueryable();

            query = ApplyFilters(query, filter);

            query = ApplySorting(query, filter.SortBy, filter.SortOrder);

            return await PagedList<Room>.CreateAsync(query, filter.PageNumber, filter.PageSize);
        }
        public async Task<Room> GetRoomByIdAsync(int id)
        {
            return await _context.Rooms.FindAsync(id);
        }
        public async Task<Room> CreateRoomAsync(Room room)
        {
            _context.Rooms.Add(room);
            await _context.SaveChangesAsync();
            return room;
        }
        public async Task<Room> UpdateRoomAsync(Room room)
        {
            //_context.Rooms.Update(room);
            _context.Entry(room).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return room;
        }
        public async Task<Room> DeleteRoomAsync(Room room)
        {
            _context.Rooms.Remove(room);
            await _context.SaveChangesAsync();
            return room;
        }
        public async Task<IEnumerable<Room>> GetAvailableRoomsAsync(DateTime checkIn, DateTime checkOut)
        {
            var bookedRoomIds = await _context.Bookings
                .Where(b => b.CheckInDate < checkOut && b.CheckOutDate > checkIn)
                .Select(b => b.RoomId)
                .ToListAsync();
            return await _context.Rooms
                .Where(r => !bookedRoomIds.Contains(r.Id) && r.IsAvailable)
                .ToListAsync();
        }
        private IQueryable<Room> ApplyFilters(IQueryable<Room> query, RoomFilterDTO filter)
        {
            if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
            {
                var searchTerm = filter.SearchTerm.ToLower();
                query = query.Where(r => r.RoomNumber.ToLower().Contains(searchTerm) ||
                r.RoomType.ToString().ToLower().Contains(searchTerm) ||
                r.Description.ToLower().Contains(searchTerm)
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
                query = query.Where(r => r.PricePerNight >= filter.MaxPrice.Value);
            }

            if (filter.IsAvailable.HasValue)
            {
                query = query.Where(r => r.IsAvailable == filter.IsAvailable.Value);
            }

            //if (filter.Floor.HasValue)
            //{
            //    some logic for room floor filtering
            //    query = query.Where(r => r.Floor >= filter.Floor.Value);
            //}

            //if (filter.AvailableFrom.HasValue)
            //{
            // some logic from AvailableFrom
            //    query = query.Where(r => r.PricePerNight >= filter.AvailableFrom.Value);
            //}

            //if (filter.AvailableTo.HasValue)
            //{
            // some logic from AvailableTo
            //    query = query.Where(r => r.PricePerNight >= filter.AvailableTo.Value);
            //}

            return query;
        }

        private IQueryable<Room> ApplySorting(IQueryable<Room> query, string sortBy, string sortOrder)
        {
            if (string.IsNullOrWhiteSpace(sortBy))
            {
                return query.OrderBy(r => r.RoomNumber);
            }

            var isDescending = sortOrder?.ToLower() == "desc";

            query = sortBy.ToLower() switch
            {
                "price" => isDescending
                    ? query.OrderByDescending(r => r.PricePerNight)
                    : query.OrderBy(r => r.PricePerNight)
            };

            return query;
        }
    }
}