using HotelManagement.Models;
using HotelManagement.DTOs;


namespace HotelManagement.Interfaces
{
    public interface IRoomRepository
    {
        Task<IEnumerable<Room>> GetAllRoomsAsync();
        Task<PagedList<Room>> GetFilteredRoomsAsync(RoomFilterDTO filter);
        Task<Room?> GetRoomByIdAsync(int id);
        Task<Room?> GetRoomByRoomNumberAsync(string roomNumber);
        Task<Room> CreateRoomAsync(Room room);
        Task<Room> UpdateRoomAsync(Room room);
        Task<Room> DeleteRoomAsync(Room room);
        Task<IEnumerable<Room>> GetAvailableRoomsAsync(DateTime checkIn, DateTime checkOut);
        Task<bool> HasActiveBookingsAsync(int roomId);
    }
}