using HotelManagement.DTOs;
using HotelManagement.Interfaces;
using HotelManagement.Models;
using Microsoft.EntityFrameworkCore.Storage;
using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Services
{
    public class RoomService : IRoomService
    {
        private readonly IRoomRepository _roomRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<RoomService> _logger;

        public RoomService(
            IRoomRepository roomRepository,
            IUnitOfWork unitOfWork,
            ILogger<RoomService> logger)
        {
            _roomRepository = roomRepository;
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<PaginatedResponseDTO<RoomDTO>> GetFilteredRoomsAsync(RoomFilterDTO filter)
        {
            try
            {
                var pagedRooms = await _roomRepository.GetFilteredRoomsAsync(filter);
                var roomDtos = pagedRooms.Data.Select(r => MapToDTO(r)).ToList();

                return PaginatedResponseDTO<RoomDTO>.SuccessResult(
                    roomDtos,
                    pagedRooms.PageNumber,
                    pagedRooms.PageSize,
                    pagedRooms.TotalCount
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving filtered rooms");
                throw;
            }
        }

        public async Task<NonPaginatedResponseDTO<RoomDTO>> GetRoomByIdAsync(int id)
        {
            try
            {
                var room = await _roomRepository.GetRoomByIdAsync(id);

                return room == null
                    ? NonPaginatedResponseDTO<RoomDTO>.FailureResult(
                        "Room not found",
                        new List<string> { $"Room with ID {id} does not exist" }
                    )
                    : NonPaginatedResponseDTO<RoomDTO>.SuccessResult(
                        MapToDTO(room),
                        "Room retrieved successfully"
                    );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving room {RoomId}", id);
                throw;
            }
        }

        public async Task<NonPaginatedResponseDTO<RoomDTO>> CreateRoomAsync(CreateRoomDTO createRoomDTO)
        {
            await using var transaction = await _unitOfWork.BeginTransactionAsync();

            try
            {
                // Validate DTO
                var validationErrors = ValidateCreateRoomDTO(createRoomDTO);
                if (validationErrors.Any())
                {
                    return NonPaginatedResponseDTO<RoomDTO>.FailureResult(
                        "Validation failed",
                        validationErrors
                    );
                }

                // Check if room number already exists
                var existingRoom = await _roomRepository.GetRoomByRoomNumberAsync(createRoomDTO.RoomNumber);
                if (existingRoom != null)
                {
                    return NonPaginatedResponseDTO<RoomDTO>.FailureResult(
                        "Room creation failed",
                        new List<string> { $"Room number '{createRoomDTO.RoomNumber}' already exists" }
                    );
                }

                // Create room entity
                var room = new Room
                {
                    RoomNumber = createRoomDTO.RoomNumber,
                    RoomType = Enum.Parse<RoomType>(createRoomDTO.RoomType),
                    PricePerNight = createRoomDTO.PricePerNight,
                    Capacity = createRoomDTO.Capacity,
                    IsAvailable = createRoomDTO.IsAvailable,
                    Description = createRoomDTO.Description
                };

                var createdRoom = await _roomRepository.CreateRoomAsync(room);
                await _unitOfWork.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("Room created successfully: {RoomId}", createdRoom.Id);

                return NonPaginatedResponseDTO<RoomDTO>.SuccessResult(
                    MapToDTO(createdRoom),
                    "Room created successfully"
                );
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating room");
                throw;
            }
        }

        public async Task<NonPaginatedResponseDTO<RoomDTO>> UpdateRoomAsync(int id, CreateRoomDTO updateRoomDTO)
        {
            await using var transaction = await _unitOfWork.BeginTransactionAsync();

            try
            {
                // Validate DTO
                var validationErrors = ValidateCreateRoomDTO(updateRoomDTO);
                if (validationErrors.Any())
                {
                    return NonPaginatedResponseDTO<RoomDTO>.FailureResult(
                        "Validation failed",
                        validationErrors
                    );
                }

                // Get existing room
                var room = await _roomRepository.GetRoomByIdAsync(id);
                if (room == null)
                {
                    return NonPaginatedResponseDTO<RoomDTO>.FailureResult(
                        "Room not found",
                        new List<string> { $"Room with ID {id} does not exist" }
                    );
                }

                // Check if room number is being changed to an existing one
                if (room.RoomNumber != updateRoomDTO.RoomNumber)
                {
                    var existingRoom = await _roomRepository.GetRoomByRoomNumberAsync(updateRoomDTO.RoomNumber);
                    if (existingRoom != null && existingRoom.Id != id)
                    {
                        return NonPaginatedResponseDTO<RoomDTO>.FailureResult(
                            "Room update failed",
                            new List<string> { $"Room number '{updateRoomDTO.RoomNumber}' already exists" }
                        );
                    }
                }

                // Update room properties
                room.RoomNumber = updateRoomDTO.RoomNumber;
                room.RoomType = Enum.Parse<RoomType>(updateRoomDTO.RoomType);
                room.PricePerNight = updateRoomDTO.PricePerNight;
                room.Capacity = updateRoomDTO.Capacity;
                room.IsAvailable = updateRoomDTO.IsAvailable;
                room.Description = updateRoomDTO.Description;

                var updatedRoom = await _roomRepository.UpdateRoomAsync(room);
                await _unitOfWork.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("Room updated successfully: {RoomId}", updatedRoom.Id);

                return NonPaginatedResponseDTO<RoomDTO>.SuccessResult(
                    MapToDTO(updatedRoom),
                    "Room updated successfully"
                );
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error updating room {RoomId}", id);
                throw;
            }
        }

        public async Task<NonPaginatedResponseDTO<RoomDTO>> DeleteRoomAsync(int id)
        {
            await using var transaction = await _unitOfWork.BeginTransactionAsync();

            try
            {
                var room = await _roomRepository.GetRoomByIdAsync(id);
                if (room == null)
                {
                    return NonPaginatedResponseDTO<RoomDTO>.FailureResult(
                        "Room not found",
                        new List<string> { $"Room with ID {id} does not exist" }
                    );
                }

                // Check if room has active bookings
                var hasActiveBookings = await _roomRepository.HasActiveBookingsAsync(id);
                if (hasActiveBookings)
                {
                    return NonPaginatedResponseDTO<RoomDTO>.FailureResult(
                        "Room deletion failed",
                        new List<string> { "Cannot delete room with active bookings" }
                    );
                }

                var deletedRoom = await _roomRepository.DeleteRoomAsync(room);
                await _unitOfWork.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("Room deleted successfully: {RoomId}", id);

                return NonPaginatedResponseDTO<RoomDTO>.SuccessResult(
                    MapToDTO(deletedRoom),
                    "Room deleted successfully"
                );
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error deleting room {RoomId}", id);
                throw;
            }
        }

        public async Task<NonPaginatedResponseDTO<IEnumerable<RoomDTO>>> GetAvailableRoomsAsync(DateTime checkIn, DateTime checkOut)
        {
            try
            {
                // Validate dates
                if (checkIn >= checkOut)
                {
                    return NonPaginatedResponseDTO<IEnumerable<RoomDTO>>.FailureResult(
                        "Invalid date range",
                        new List<string> { "Check-in date must be before check-out date" }
                    );
                }

                if (checkIn < DateTime.Today)
                {
                    return NonPaginatedResponseDTO<IEnumerable<RoomDTO>>.FailureResult(
                        "Invalid date range",
                        new List<string> { "Check-in date cannot be in the past" }
                    );
                }

                var rooms = await _roomRepository.GetAvailableRoomsAsync(checkIn, checkOut);
                var roomDtos = rooms.Select(r => MapToDTO(r)).ToList();

                return NonPaginatedResponseDTO<IEnumerable<RoomDTO>>.SuccessResult(
                    roomDtos,
                    $"Found {roomDtos.Count} available rooms"
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving available rooms");
                throw;
            }
        }

        private List<string> ValidateCreateRoomDTO(CreateRoomDTO dto)
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(dto.RoomNumber))
            {
                errors.Add("Room number is required");
            }

            if (string.IsNullOrWhiteSpace(dto.RoomType))
            {
                errors.Add("Room type is required");
            }
            else if (!Enum.TryParse<RoomType>(dto.RoomType, true, out _))
            {
                errors.Add($"Invalid room type: {dto.RoomType}");
            }

            if (dto.PricePerNight <= 0)
            {
                errors.Add("Price per night must be greater than zero");
            }

            if (dto.Capacity <= 0)
            {
                errors.Add("Capacity must be greater than zero");
            }

            return errors;
        }

        private RoomDTO MapToDTO(Room room)
        {
            return new RoomDTO
            {
                Id = room.Id,
                RoomNumber = room.RoomNumber,
                RoomType = room.RoomType.ToString(),
                Status = room.Status.ToString(),
                PricePerNight = room.PricePerNight,
                Capacity = room.Capacity,
                IsAvailable = room.IsAvailable,
                Description = room.Description
            };
        }
    }
}
