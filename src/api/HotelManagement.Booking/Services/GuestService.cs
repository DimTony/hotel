using HotelManagement.Booking.DTOs;
using HotelManagement.Booking.Interfaces;
using HotelManagement.Booking.Models;

namespace HotelManagement.Booking.Services
{
    public interface IGuestService
    {
        Task<NonPaginatedResponse<IEnumerable<GuestDTO>>> GetAllGuestsAsync();
        Task<NonPaginatedResponse<GuestDTO>> GetGuestByIdAsync(int id);
        Task<NonPaginatedResponse<GuestDTO>> GetGuestByEmailAsync(string email);
        Task<NonPaginatedResponse<GuestDTO>> CreateGuestAsync(CreateGuestDTO createGuestDTO);
        Task<NonPaginatedResponse<GuestDTO>> UpdateGuestAsync(int id, UpdateGuestDTO updateGuestDTO);
        Task<NonPaginatedResponse<bool>> DeleteGuestAsync(int id);
    }

    public class GuestService : IGuestService
    {
        private readonly IGuestRepository _guestRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<GuestService> _logger;

        public GuestService(
            IGuestRepository guestRepository,
            IUnitOfWork unitOfWork,
            ILogger<GuestService> logger)
        {
            _guestRepository = guestRepository;
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<NonPaginatedResponse<IEnumerable<GuestDTO>>> GetAllGuestsAsync()
        {
            try
            {
                var guests = await _guestRepository.GetAllGuestsAsync();
                var guestDtos = guests.Select(g => MapToDTO(g)).ToList();

                return NonPaginatedResponse<IEnumerable<GuestDTO>>.SuccessResult(
                    guestDtos,
                    $"Found {guestDtos.Count} guests"
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving guests");
                return NonPaginatedResponse<IEnumerable<GuestDTO>>.FailureResult(
                    "An error occurred while retrieving guests",
                    new List<string> { ex.Message }
                );
            }
        }

        public async Task<NonPaginatedResponse<GuestDTO>> GetGuestByIdAsync(int id)
        {
            try
            {
                var guest = await _guestRepository.GetGuestByIdAsync(id);

                return guest == null
                    ? NonPaginatedResponse<GuestDTO>.FailureResult(
                        "Guest not found",
                        new List<string> { $"Guest with ID {id} does not exist" }
                    )
                    : NonPaginatedResponse<GuestDTO>.SuccessResult(
                        MapToDTO(guest),
                        "Guest retrieved successfully"
                    );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving guest {GuestId}", id);
                return NonPaginatedResponse<GuestDTO>.FailureResult(
                    "An error occurred while retrieving guest",
                    new List<string> { ex.Message }
                );
            }
        }

        public async Task<NonPaginatedResponse<GuestDTO>> GetGuestByEmailAsync(string email)
        {
            try
            {
                var guest = await _guestRepository.GetGuestByEmailAsync(email);

                return guest == null
                    ? NonPaginatedResponse<GuestDTO>.FailureResult(
                        "Guest not found",
                        new List<string> { $"Guest with email {email} does not exist" }
                    )
                    : NonPaginatedResponse<GuestDTO>.SuccessResult(
                        MapToDTO(guest),
                        "Guest retrieved successfully"
                    );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving guest by email {Email}", email);
                return NonPaginatedResponse<GuestDTO>.FailureResult(
                    "An error occurred while retrieving guest",
                    new List<string> { ex.Message }
                );
            }
        }

        public async Task<NonPaginatedResponse<GuestDTO>> CreateGuestAsync(CreateGuestDTO createGuestDTO)
        {
            await using var transaction = await _unitOfWork.BeginTransactionAsync();

            try
            {
                // Check if email already exists
                var emailExists = await _guestRepository.EmailExistsAsync(createGuestDTO.Email);
                if (emailExists)
                {
                    return NonPaginatedResponse<GuestDTO>.FailureResult(
                        "Guest creation failed",
                        new List<string> { $"A guest with email '{createGuestDTO.Email}' already exists" }
                    );
                }

                var guest = new Guest
                {
                    FirstName = createGuestDTO.FirstName,
                    LastName = createGuestDTO.LastName,
                    Email = createGuestDTO.Email,
                    PhoneNumber = createGuestDTO.PhoneNumber,
                    Address = createGuestDTO.Address,
                    DateOfBirth = createGuestDTO.DateOfBirth,
                    CreatedAt = DateTime.UtcNow
                };

                var createdGuest = await _guestRepository.CreateGuestAsync(guest);
                await _unitOfWork.SaveChangesAsync();

                createdGuest = await _guestRepository.GetGuestByIdAsync(createdGuest.Id);

                await transaction.CommitAsync();

                _logger.LogInformation("Guest created successfully: {GuestId}", createdGuest!.Id);

                return NonPaginatedResponse<GuestDTO>.SuccessResult(
                    MapToDTO(createdGuest),
                    "Guest created successfully"
                );
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating guest");
                return NonPaginatedResponse<GuestDTO>.FailureResult(
                    "An error occurred while creating guest",
                    new List<string> { ex.Message }
                );
            }
        }

        public async Task<NonPaginatedResponse<GuestDTO>> UpdateGuestAsync(int id, UpdateGuestDTO updateGuestDTO)
        {
            await using var transaction = await _unitOfWork.BeginTransactionAsync();

            try
            {
                var guest = await _guestRepository.GetGuestByIdAsync(id);
                if (guest == null)
                {
                    return NonPaginatedResponse<GuestDTO>.FailureResult(
                        "Guest not found",
                        new List<string> { $"Guest with ID {id} does not exist" }
                    );
                }

                // Check email uniqueness if being updated
                if (!string.IsNullOrWhiteSpace(updateGuestDTO.Email) && updateGuestDTO.Email != guest.Email)
                {
                    var emailExists = await _guestRepository.EmailExistsAsync(updateGuestDTO.Email, id);
                    if (emailExists)
                    {
                        return NonPaginatedResponse<GuestDTO>.FailureResult(
                            "Guest update failed",
                            new List<string> { $"A guest with email '{updateGuestDTO.Email}' already exists" }
                        );
                    }
                }

                // Update properties
                if (!string.IsNullOrWhiteSpace(updateGuestDTO.FirstName))
                    guest.FirstName = updateGuestDTO.FirstName;

                if (!string.IsNullOrWhiteSpace(updateGuestDTO.LastName))
                    guest.LastName = updateGuestDTO.LastName;

                if (!string.IsNullOrWhiteSpace(updateGuestDTO.Email))
                    guest.Email = updateGuestDTO.Email;

                if (!string.IsNullOrWhiteSpace(updateGuestDTO.PhoneNumber))
                    guest.PhoneNumber = updateGuestDTO.PhoneNumber;

                if (updateGuestDTO.Address != null)
                    guest.Address = updateGuestDTO.Address;

                if (updateGuestDTO.DateOfBirth.HasValue)
                    guest.DateOfBirth = updateGuestDTO.DateOfBirth;

                var updatedGuest = await _guestRepository.UpdateGuestAsync(guest);
                await _unitOfWork.SaveChangesAsync();

                updatedGuest = await _guestRepository.GetGuestByIdAsync(updatedGuest.Id);

                await transaction.CommitAsync();

                _logger.LogInformation("Guest updated successfully: {GuestId}", id);

                return NonPaginatedResponse<GuestDTO>.SuccessResult(
                    MapToDTO(updatedGuest!),
                    "Guest updated successfully"
                );
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error updating guest {GuestId}", id);
                return NonPaginatedResponse<GuestDTO>.FailureResult(
                    "An error occurred while updating guest",
                    new List<string> { ex.Message }
                );
            }
        }

        public async Task<NonPaginatedResponse<bool>> DeleteGuestAsync(int id)
        {
            await using var transaction = await _unitOfWork.BeginTransactionAsync();

            try
            {
                var guest = await _guestRepository.GetGuestByIdAsync(id);
                if (guest == null)
                {
                    return NonPaginatedResponse<bool>.FailureResult(
                        "Guest not found",
                        new List<string> { $"Guest with ID {id} does not exist" }
                    );
                }

                // Check if guest has any bookings
                if (guest.Bookings.Any())
                {
                    return NonPaginatedResponse<bool>.FailureResult(
                        "Guest deletion failed",
                        new List<string> { "Cannot delete guest with existing bookings" }
                    );
                }

                var deleted = await _guestRepository.DeleteGuestAsync(id);
                if (!deleted)
                {
                    return NonPaginatedResponse<bool>.FailureResult(
                        "Guest deletion failed",
                        new List<string> { "Failed to delete guest" }
                    );
                }

                await _unitOfWork.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("Guest deleted successfully: {GuestId}", id);

                return NonPaginatedResponse<bool>.SuccessResult(
                    true,
                    "Guest deleted successfully"
                );
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error deleting guest {GuestId}", id);
                return NonPaginatedResponse<bool>.FailureResult(
                    "An error occurred while deleting guest",
                    new List<string> { ex.Message }
                );
            }
        }

        private GuestDTO MapToDTO(Guest guest)
        {
            return new GuestDTO
            {
                Id = guest.Id,
                FirstName = guest.FirstName,
                LastName = guest.LastName,
                Email = guest.Email,
                PhoneNumber = guest.PhoneNumber,
                Address = guest.Address,
                DateOfBirth = guest.DateOfBirth,
                TotalBookings = guest.Bookings?.Count ?? 0
            };
        }
    }
}
