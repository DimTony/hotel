using HotelManagement.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Interfaces
{
    public interface IRoomService
    {
        Task<PaginatedResponseDTO<RoomDTO>> GetFilteredRoomsAsync(RoomFilterDTO filter);
        Task<NonPaginatedResponseDTO<RoomDTO>> GetRoomByIdAsync(int id);
        Task<NonPaginatedResponseDTO<RoomDTO>> CreateRoomAsync(CreateRoomDTO createRoomDTO);
        Task<NonPaginatedResponseDTO<RoomDTO>> UpdateRoomAsync(int id, CreateRoomDTO updateRoomDTO);
        Task<NonPaginatedResponseDTO<RoomDTO>> DeleteRoomAsync(int id);
        Task<NonPaginatedResponseDTO<IEnumerable<RoomDTO>>> GetAvailableRoomsAsync(DateTime checkIn, DateTime checkOut);
    }
}