using HotelManagement.DTOs;
using HotelManagement.Interfaces;
using HotelManagement.Models;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Services
{
    public class RoomService : IRoomService
    {
        private readonly IRoomRepository _roomRepository;
        private readonly ILogger<RoomService> _logger;

        public RoomService(IRoomRepository roomRepository, ILogger<RoomService> logger)
        {
            _roomRepository = roomRepository;
            _logger = logger;
        }
        public async Task<IEnumerable<RoomDTO>> GetAllRoomsAsync()
        {
            var rooms = await _roomRepository.GetAllRoomsAsync();
            return rooms.Select(r => MapToDTO(r));
        }

        public async Task<PagedList<RoomDTO>> GetFilteredRoomsAsync(RoomFilterDTO filter)
        {
            var pagedRooms = await _roomRepository.GetFilteredRoomsAsync(filter);

            var dtoData = pagedRooms.Data.Select(r => MapToDTO(r)).ToList();

            // Return a new PagedList<RoomDTO>
            return new PagedList<RoomDTO>(
                dtoData,
                pagedRooms.TotalCount,
                pagedRooms.PageNumber,
                pagedRooms.PageSize
            );
        }
        //Task<IEnumerable<RoomDTO>> GetFilteredRoomsAsync();

        public async Task<NonPaginatedResponseDTO<RoomDTO>> GetRoomByIdAsync(int id)
        {
            var room = await _roomRepository.GetRoomByIdAsync(id);

            return room == null
                ? NonPaginatedResponseDTO<RoomDTO>.FailureResult(
                    "Room Not Found",
                    new List<string>() // empty error list
                  )
                : NonPaginatedResponseDTO<RoomDTO>.SuccessResult(
                    MapToDTO(room),
                    "Room Fetched Successfully"
                  );
        }

        public async Task<NonPaginatedResponseDTO<RoomDTO>> CreateRoomAsync(CreateRoomDTO createRoomDTO)
        {
            var room = new Room
            {
                RoomNumber = createRoomDTO.RoomNumber,
                //Type = createRoomDTO.Type,
                RoomType = Enum.Parse<RoomType>(createRoomDTO.RoomType),
                PricePerNight = createRoomDTO.PricePerNight,
                Capacity = createRoomDTO.Capacity,
                IsAvailable = createRoomDTO.IsAvailable,
                Description = createRoomDTO.Description
            };
           var createdRoom =  await _roomRepository.CreateRoomAsync(room);

            // _logger.LogInformation("CreateRoomService createdRoom: {@Response}", createdRoom);

            //return MapToDTO(createdRoom);
            return NonPaginatedResponseDTO<RoomDTO>.SuccessResult(MapToDTO(createdRoom), "Room Created Successfully");
        }
        public async Task<NonPaginatedResponseDTO<RoomDTO>> UpdateRoomAsync(int id, CreateRoomDTO updateRoomDTO)
        {
            var room = await _roomRepository.GetRoomByIdAsync(id);
            //if (room == null) return null;
            if (room == null)
            {

                return NonPaginatedResponseDTO<RoomDTO>.FailureResult(
                        "Room Not Found",
                        new List<string>() // empty error list
                      );
            }
            room.RoomNumber = updateRoomDTO.RoomNumber;
            //room.Type = createRoomDTO.Type,
            room.RoomType = Enum.Parse<RoomType>(updateRoomDTO.RoomType);
            room.PricePerNight = updateRoomDTO.PricePerNight;
            room.Capacity = updateRoomDTO.Capacity;
            room.IsAvailable = updateRoomDTO.IsAvailable;
            room.Description = updateRoomDTO.Description;
            var updatedRoom = await _roomRepository.UpdateRoomAsync(room);
            //return MapToDTO(updatedRoom);

            return NonPaginatedResponseDTO<RoomDTO>.SuccessResult(
                    MapToDTO(updatedRoom),
                    "Room Updated Successfully"
                  );
        }
        public async Task<NonPaginatedResponseDTO<RoomDTO>> DeleteRoomAsync(int id)
        {
            var room = await _roomRepository.GetRoomByIdAsync(id);
            //if (room == null) return null;
            if (room == null)
            {

                return NonPaginatedResponseDTO<RoomDTO>.FailureResult(
                        "Room Not Found",
                        new List<string>() // empty error list
                      );
            }
           var deletedRoom = await _roomRepository.DeleteRoomAsync(room);

            return NonPaginatedResponseDTO<RoomDTO>.SuccessResult(
                MapToDTO(deletedRoom),
                "Room Deleted Successfully"
              );
        }
        public async Task<IEnumerable<RoomDTO>> GetAvailableRoomsAsync(DateTime checkIn, DateTime checkOut)
        {
            var rooms = await _roomRepository.GetAvailableRoomsAsync(checkIn, checkOut);
            return rooms.Select(r => MapToDTO(r));
        }

        private RoomDTO MapToDTO(Room room)
        {
            return new RoomDTO
            {
                Id = room.Id,
                RoomNumber = room.RoomNumber,
                RoomType = room.RoomType.ToString(),
                PricePerNight = room.PricePerNight,
                Capacity = room.Capacity,
                IsAvailable = room.IsAvailable,
                Description = room.Description
            };
        }
    }
}