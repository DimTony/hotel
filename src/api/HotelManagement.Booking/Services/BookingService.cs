

using HotelManagement.Booking.DTOs;
using HotelManagement.Booking.Interfaces;
using HotelManagement.Booking.Models;

namespace HotelManagement.Booking.Services
{
    public class BookingService : IBookingService
    {
        private readonly IBookingRepository _bookingRepository;
        private readonly IGuestRepository _guestRepository;
        private readonly IRoomServiceClient _roomServiceClient;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<BookingService> _logger;

        public BookingService(
            IBookingRepository bookingRepository,
            IGuestRepository guestRepository,
            IRoomServiceClient roomServiceClient,
            IUnitOfWork unitOfWork,
            ILogger<BookingService> logger)
        {
            _bookingRepository = bookingRepository;
            _guestRepository = guestRepository;
            _roomServiceClient = roomServiceClient;
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<PaginatedResponse<BookingDTO>> GetFilteredBookingsAsync(BookingFilterDTO filter)
        {
            try
            {
                var pagedBookings = await _bookingRepository.GetFilteredBookingsAsync(filter);
                var bookingDtos = pagedBookings.Data.Select(b => MapToDTO(b)).ToList();

                return PaginatedResponse<BookingDTO>.Create(
                    new PagedList<BookingDTO>(
                        bookingDtos,
                        pagedBookings.TotalCount,
                        pagedBookings.PageNumber,
                        pagedBookings.PageSize
                    ),
                    "Bookings retrieved successfully"
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving filtered bookings");
                return PaginatedResponse<BookingDTO>.FailureResult(
                    "An error occurred while retrieving bookings",
                    new List<string> { ex.Message }
                );
            }
        }

        public async Task<NonPaginatedResponse<BookingDTO>> GetBookingByIdAsync(int id)
        {
            try
            {
                var booking = await _bookingRepository.GetBookingByIdAsync(id);

                return booking == null
                    ? NonPaginatedResponse<BookingDTO>.FailureResult(
                        "Booking not found",
                        new List<string> { $"Booking with ID {id} does not exist" }
                    )
                    : NonPaginatedResponse<BookingDTO>.SuccessResult(
                        MapToDTO(booking),
                        "Booking retrieved successfully"
                    );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving booking {BookingId}", id);
                return NonPaginatedResponse<BookingDTO>.FailureResult(
                    "An error occurred while retrieving booking",
                    new List<string> { ex.Message }
                );
            }
        }

        public async Task<NonPaginatedResponse<IEnumerable<BookingDTO>>> GetBookingsByGuestIdAsync(int guestId)
        {
            try
            {
                var bookings = await _bookingRepository.GetBookingsByGuestIdAsync(guestId);
                var bookingDtos = bookings.Select(b => MapToDTO(b)).ToList();

                return NonPaginatedResponse<IEnumerable<BookingDTO>>.SuccessResult(
                    bookingDtos,
                    $"Found {bookingDtos.Count} bookings for guest"
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving bookings for guest {GuestId}", guestId);
                return NonPaginatedResponse<IEnumerable<BookingDTO>>.FailureResult(
                    "An error occurred while retrieving guest bookings",
                    new List<string> { ex.Message }
                );
            }
        }

        public async Task<NonPaginatedResponse<BookingDTO>> CreateBookingAsync(CreateBookingDTO createBookingDTO)
        {
            await using var transaction = await _unitOfWork.BeginTransactionAsync();

            try
            {
                // Step 1: Validate input
                var validationErrors = ValidateCreateBookingDTO(createBookingDTO);
                if (validationErrors.Any())
                {
                    return NonPaginatedResponse<BookingDTO>.FailureResult("Validation failed", validationErrors);
                }

                // Step 2: Validate dates
                var dateValidation = ValidateDates(createBookingDTO.CheckInDate, createBookingDTO.CheckOutDate);
                if (!dateValidation.IsValid)
                {
                    return NonPaginatedResponse<BookingDTO>.FailureResult("Invalid dates", dateValidation.Errors);
                }

                // Step 3: Verify guest exists
                var guest = await _guestRepository.GetGuestByIdAsync(createBookingDTO.GuestId);
                if (guest == null)
                {
                    return NonPaginatedResponse<BookingDTO>.FailureResult(
                        "Guest not found",
                        new List<string> { $"Guest with ID {createBookingDTO.GuestId} does not exist" }
                    );
                }

                // Step 4: Get room details from Room service
                var room = await _roomServiceClient.GetRoomByIdAsync(createBookingDTO.RoomId);
                if (room == null)
                {
                    return NonPaginatedResponse<BookingDTO>.FailureResult(
                        "Room not found",
                        new List<string> { $"Room with ID {createBookingDTO.RoomId} does not exist or is unavailable" }
                    );
                }

                // Step 5: Check room availability in local booking database
                var isAvailable = await _bookingRepository.IsRoomAvailableAsync(
                    createBookingDTO.RoomId,
                    createBookingDTO.CheckInDate,
                    createBookingDTO.CheckOutDate
                );

                if (!isAvailable)
                {
                    return NonPaginatedResponse<BookingDTO>.FailureResult(
                        "Room not available",
                        new List<string> { "The selected room is not available for the specified dates" }
                    );
                }

                // Step 6: Calculate booking details
                var checkInDate = createBookingDTO.CheckInDate.Date;
                var checkOutDate = createBookingDTO.CheckOutDate.Date;
                var numberOfNights = (checkOutDate - checkInDate).Days;
                var totalAmount = numberOfNights * room.PricePerNight;

                // Step 7: Create booking entity
                var booking = new Models.Booking
                {
                    RoomId = createBookingDTO.RoomId,
                    RoomNumber = room.RoomNumber,
                    RoomType = room.RoomType,
                    PricePerNight = room.PricePerNight,
                    GuestId = createBookingDTO.GuestId,
                    CheckInDate = checkInDate,
                    CheckOutDate = checkOutDate,
                    NumberOfNights = numberOfNights,
                    TotalAmount = totalAmount,
                    Status = BookingStatus.Pending,
                    CreatedAt = DateTime.UtcNow
                };

                // Step 8: Save to database
                var createdBooking = await _bookingRepository.CreateBookingAsync(booking);
                await _unitOfWork.SaveChangesAsync();

                // Step 9: Reload with navigation properties
                createdBooking = await _bookingRepository.GetBookingByIdAsync(createdBooking.Id);

                // Step 10: Commit transaction
                await transaction.CommitAsync();

                _logger.LogInformation(
                    "Booking created successfully: BookingId={BookingId}, RoomId={RoomId}, GuestId={GuestId}, Amount={Amount}",
                    createdBooking!.Id, createdBooking.RoomId, createdBooking.GuestId, createdBooking.TotalAmount
                );

                return NonPaginatedResponse<BookingDTO>.SuccessResult(
                    MapToDTO(createdBooking),
                    "Booking created successfully"
                );
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating booking");
                return NonPaginatedResponse<BookingDTO>.FailureResult(
                    "An error occurred while creating booking",
                    new List<string> { ex.Message }
                );
            }
        }

        public async Task<NonPaginatedResponse<BookingDTO>> UpdateBookingAsync(int id, UpdateBookingDTO updateBookingDTO)
        {
            await using var transaction = await _unitOfWork.BeginTransactionAsync();

            try
            {
                var booking = await _bookingRepository.GetBookingByIdAsync(id);
                if (booking == null)
                {
                    return NonPaginatedResponse<BookingDTO>.FailureResult(
                        "Booking not found",
                        new List<string> { $"Booking with ID {id} does not exist" }
                    );
                }

                // Cannot update cancelled or checked-out bookings
                if (booking.Status == BookingStatus.Cancelled || booking.Status == BookingStatus.CheckedOut)
                {
                    return NonPaginatedResponse<BookingDTO>.FailureResult(
                        "Booking cannot be updated",
                        new List<string> { $"Cannot update bookings with status: {booking.Status}" }
                    );
                }

                var newCheckIn = updateBookingDTO.CheckInDate?.Date ?? booking.CheckInDate;
                var newCheckOut = updateBookingDTO.CheckOutDate?.Date ?? booking.CheckOutDate;
                var newRoomId = updateBookingDTO.RoomId ?? booking.RoomId;

                // Validate dates if they changed
                if (updateBookingDTO.CheckInDate.HasValue || updateBookingDTO.CheckOutDate.HasValue)
                {
                    var dateValidation = ValidateDates(newCheckIn, newCheckOut);
                    if (!dateValidation.IsValid)
                    {
                        return NonPaginatedResponse<BookingDTO>.FailureResult("Invalid dates", dateValidation.Errors);
                    }
                }

                // Check availability if room or dates changed
                if (updateBookingDTO.RoomId.HasValue ||
                    updateBookingDTO.CheckInDate.HasValue ||
                    updateBookingDTO.CheckOutDate.HasValue)
                {
                    var isAvailable = await _bookingRepository.IsRoomAvailableAsync(
                        newRoomId,
                        newCheckIn,
                        newCheckOut,
                        id // Exclude current booking
                    );

                    if (!isAvailable)
                    {
                        return NonPaginatedResponse<BookingDTO>.FailureResult(
                            "Room not available",
                            new List<string> { "The room is not available for the specified dates" }
                        );
                    }
                }

                // Get updated room details if room changed
                if (updateBookingDTO.RoomId.HasValue && updateBookingDTO.RoomId.Value != booking.RoomId)
                {
                    var room = await _roomServiceClient.GetRoomByIdAsync(newRoomId);
                    if (room == null)
                    {
                        return NonPaginatedResponse<BookingDTO>.FailureResult(
                            "Room not found",
                            new List<string> { $"Room with ID {newRoomId} does not exist" }
                        );
                    }

                    booking.RoomNumber = room.RoomNumber;
                    booking.RoomType = room.RoomType;
                    booking.PricePerNight = room.PricePerNight;
                }

                // Recalculate if dates or room changed
                if (updateBookingDTO.RoomId.HasValue ||
                    updateBookingDTO.CheckInDate.HasValue ||
                    updateBookingDTO.CheckOutDate.HasValue)
                {
                    var numberOfNights = (newCheckOut - newCheckIn).Days;
                    booking.NumberOfNights = numberOfNights;
                    booking.TotalAmount = numberOfNights * booking.PricePerNight;
                }

                // Update booking properties
                booking.CheckInDate = newCheckIn;
                booking.CheckOutDate = newCheckOut;
                booking.RoomId = newRoomId;

                var updatedBooking = await _bookingRepository.UpdateBookingAsync(booking);
                await _unitOfWork.SaveChangesAsync();

                // Reload with navigation properties
                updatedBooking = await _bookingRepository.GetBookingByIdAsync(updatedBooking.Id);

                await transaction.CommitAsync();

                _logger.LogInformation("Booking updated successfully: {BookingId}", id);

                return NonPaginatedResponse<BookingDTO>.SuccessResult(
                    MapToDTO(updatedBooking!),
                    "Booking updated successfully"
                );
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error updating booking {BookingId}", id);
                return NonPaginatedResponse<BookingDTO>.FailureResult(
                    "An error occurred while updating booking",
                    new List<string> { ex.Message }
                );
            }
        }

        public async Task<NonPaginatedResponse<BookingDTO>> CancelBookingAsync(int id, string? cancellationReason = null)
        {
            await using var transaction = await _unitOfWork.BeginTransactionAsync();

            try
            {
                var booking = await _bookingRepository.GetBookingByIdAsync(id);
                if (booking == null)
                {
                    return NonPaginatedResponse<BookingDTO>.FailureResult(
                        "Booking not found",
                        new List<string> { $"Booking with ID {id} does not exist" }
                    );
                }

                if (booking.Status == BookingStatus.Cancelled)
                {
                    return NonPaginatedResponse<BookingDTO>.FailureResult(
                        "Booking already cancelled",
                        new List<string> { "This booking has already been cancelled" }
                    );
                }

                if (booking.Status == BookingStatus.CheckedOut)
                {
                    return NonPaginatedResponse<BookingDTO>.FailureResult(
                        "Cannot cancel booking",
                        new List<string> { "Cannot cancel a booking that has already been checked out" }
                    );
                }

                booking.Status = BookingStatus.Cancelled;
                booking.CancellationReason = cancellationReason;
                booking.CancelledAt = DateTime.UtcNow;

                var cancelledBooking = await _bookingRepository.UpdateBookingAsync(booking);
                await _unitOfWork.SaveChangesAsync();

                cancelledBooking = await _bookingRepository.GetBookingByIdAsync(cancelledBooking.Id);

                await transaction.CommitAsync();

                _logger.LogInformation(
                    "Booking cancelled successfully: {BookingId}, Reason: {Reason}",
                    id, cancellationReason ?? "Not specified"
                );

                return NonPaginatedResponse<BookingDTO>.SuccessResult(
                    MapToDTO(cancelledBooking!),
                    "Booking cancelled successfully"
                );
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error cancelling booking {BookingId}", id);
                return NonPaginatedResponse<BookingDTO>.FailureResult(
                    "An error occurred while cancelling booking",
                    new List<string> { ex.Message }
                );
            }
        }

        public async Task<NonPaginatedResponse<BookingDTO>> ConfirmBookingAsync(int id)
        {
            await using var transaction = await _unitOfWork.BeginTransactionAsync();

            try
            {
                var booking = await _bookingRepository.GetBookingByIdAsync(id);
                if (booking == null)
                {
                    return NonPaginatedResponse<BookingDTO>.FailureResult(
                        "Booking not found",
                        new List<string> { $"Booking with ID {id} does not exist" }
                    );
                }

                if (booking.Status != BookingStatus.Pending)
                {
                    return NonPaginatedResponse<BookingDTO>.FailureResult(
                        "Invalid booking status",
                        new List<string> { $"Cannot confirm booking with status: {booking.Status}" }
                    );
                }

                booking.Status = BookingStatus.Confirmed;
                var confirmedBooking = await _bookingRepository.UpdateBookingAsync(booking);
                await _unitOfWork.SaveChangesAsync();

                confirmedBooking = await _bookingRepository.GetBookingByIdAsync(confirmedBooking.Id);

                await transaction.CommitAsync();

                _logger.LogInformation("Booking confirmed successfully: {BookingId}", id);

                return NonPaginatedResponse<BookingDTO>.SuccessResult(
                    MapToDTO(confirmedBooking!),
                    "Booking confirmed successfully"
                );
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error confirming booking {BookingId}", id);
                return NonPaginatedResponse<BookingDTO>.FailureResult(
                    "An error occurred while confirming booking",
                    new List<string> { ex.Message }
                );
            }
        }

        public async Task<NonPaginatedResponse<BookingDTO>> CheckInAsync(int id)
        {
            await using var transaction = await _unitOfWork.BeginTransactionAsync();

            try
            {
                var booking = await _bookingRepository.GetBookingByIdAsync(id);
                if (booking == null)
                {
                    return NonPaginatedResponse<BookingDTO>.FailureResult(
                        "Booking not found",
                        new List<string> { $"Booking with ID {id} does not exist" }
                    );
                }

                if (booking.Status != BookingStatus.Confirmed && booking.Status != BookingStatus.Pending)
                {
                    return NonPaginatedResponse<BookingDTO>.FailureResult(
                        "Invalid booking status",
                        new List<string> { $"Cannot check in booking with status: {booking.Status}" }
                    );
                }

                var today = DateTime.Today;
                if (booking.CheckInDate > today)
                {
                    return NonPaginatedResponse<BookingDTO>.FailureResult(
                        "Check-in not allowed",
                        new List<string> { "Check-in date has not arrived yet" }
                    );
                }

                booking.Status = BookingStatus.CheckedIn;
                var checkedInBooking = await _bookingRepository.UpdateBookingAsync(booking);
                await _unitOfWork.SaveChangesAsync();

                checkedInBooking = await _bookingRepository.GetBookingByIdAsync(checkedInBooking.Id);

                await transaction.CommitAsync();

                _logger.LogInformation("Guest checked in successfully: {BookingId}", id);

                return NonPaginatedResponse<BookingDTO>.SuccessResult(
                    MapToDTO(checkedInBooking!),
                    "Guest checked in successfully"
                );
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error checking in booking {BookingId}", id);
                return NonPaginatedResponse<BookingDTO>.FailureResult(
                    "An error occurred while checking in guest",
                    new List<string> { ex.Message }
                );
            }
        }

        public async Task<NonPaginatedResponse<BookingDTO>> CheckOutAsync(int id)
        {
            await using var transaction = await _unitOfWork.BeginTransactionAsync();

            try
            {
                var booking = await _bookingRepository.GetBookingByIdAsync(id);
                if (booking == null)
                {
                    return NonPaginatedResponse<BookingDTO>.FailureResult(
                        "Booking not found",
                        new List<string> { $"Booking with ID {id} does not exist" }
                    );
                }

                if (booking.Status != BookingStatus.CheckedIn)
                {
                    return NonPaginatedResponse<BookingDTO>.FailureResult(
                        "Invalid booking status",
                        new List<string> { $"Cannot check out booking with status: {booking.Status}" }
                    );
                }

                booking.Status = BookingStatus.CheckedOut;
                var checkedOutBooking = await _bookingRepository.UpdateBookingAsync(booking);
                await _unitOfWork.SaveChangesAsync();

                checkedOutBooking = await _bookingRepository.GetBookingByIdAsync(checkedOutBooking.Id);

                await transaction.CommitAsync();

                _logger.LogInformation("Guest checked out successfully: {BookingId}", id);

                return NonPaginatedResponse<BookingDTO>.SuccessResult(
                    MapToDTO(checkedOutBooking!),
                    "Guest checked out successfully"
                );
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error checking out booking {BookingId}", id);
                return NonPaginatedResponse<BookingDTO>.FailureResult(
                    "An error occurred while checking out guest",
                    new List<string> { ex.Message }
                );
            }
        }

        public async Task<NonPaginatedResponse<bool>> CheckAvailabilityAsync(int roomId, DateTime checkIn, DateTime checkOut)
        {
            try
            {
                var dateValidation = ValidateDates(checkIn, checkOut);
                if (!dateValidation.IsValid)
                {
                    return NonPaginatedResponse<bool>.FailureResult("Invalid dates", dateValidation.Errors);
                }

                // Check if room exists in Room service
                var room = await _roomServiceClient.GetRoomByIdAsync(roomId);
                if (room == null)
                {
                    return NonPaginatedResponse<bool>.FailureResult(
                        "Room not found",
                        new List<string> { $"Room with ID {roomId} does not exist" }
                    );
                }

                // Check availability in local bookings
                var isAvailable = await _bookingRepository.IsRoomAvailableAsync(roomId, checkIn, checkOut);

                return NonPaginatedResponse<bool>.SuccessResult(
                    isAvailable,
                    isAvailable ? "Room is available" : "Room is not available for the specified dates"
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking room availability");
                return NonPaginatedResponse<bool>.FailureResult(
                    "An error occurred while checking availability",
                    new List<string> { ex.Message }
                );
            }
        }

        public async Task<NonPaginatedResponse<IEnumerable<BookingDTO>>> GetUpcomingBookingsAsync(int days = 7)
        {
            try
            {
                var bookings = await _bookingRepository.GetUpcomingBookingsAsync(days);
                var bookingDtos = bookings.Select(b => MapToDTO(b)).ToList();

                return NonPaginatedResponse<IEnumerable<BookingDTO>>.SuccessResult(
                    bookingDtos,
                    $"Found {bookingDtos.Count} upcoming bookings"
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving upcoming bookings");
                return NonPaginatedResponse<IEnumerable<BookingDTO>>.FailureResult(
                    "An error occurred while retrieving upcoming bookings",
                    new List<string> { ex.Message }
                );
            }
        }

        public async Task<NonPaginatedResponse<IEnumerable<BookingDTO>>> GetActiveBookingsAsync()
        {
            try
            {
                var bookings = await _bookingRepository.GetActiveBookingsAsync();
                var bookingDtos = bookings.Select(b => MapToDTO(b)).ToList();

                return NonPaginatedResponse<IEnumerable<BookingDTO>>.SuccessResult(
                    bookingDtos,
                    $"Found {bookingDtos.Count} active bookings"
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active bookings");
                return NonPaginatedResponse<IEnumerable<BookingDTO>>.FailureResult(
                    "An error occurred while retrieving active bookings",
                    new List<string> { ex.Message }
                );
            }
        }

        #region Private Helper Methods

        private List<string> ValidateCreateBookingDTO(CreateBookingDTO dto)
        {
            var errors = new List<string>();

            if (dto.RoomId <= 0)
            {
                errors.Add("Invalid room ID");
            }

            if (dto.GuestId <= 0)
            {
                errors.Add("Invalid guest ID");
            }

            return errors;
        }

        private (bool IsValid, List<string> Errors) ValidateDates(DateTime checkIn, DateTime checkOut)
        {
            var errors = new List<string>();

            if (checkIn.Date < DateTime.Today)
            {
                errors.Add("Check-in date cannot be in the past");
            }

            if (checkOut.Date <= checkIn.Date)
            {
                errors.Add("Check-out date must be after check-in date");
            }

            var numberOfNights = (checkOut.Date - checkIn.Date).Days;
            if (numberOfNights > 365)
            {
                errors.Add("Booking duration cannot exceed 365 days");
            }

            if (numberOfNights < 1)
            {
                errors.Add("Booking must be at least 1 night");
            }

            return (errors.Count == 0, errors);
        }

        private BookingDTO MapToDTO(Models.Booking booking)
        {
            return new BookingDTO
            {
                Id = booking.Id,
                RoomId = booking.RoomId,
                RoomNumber = booking.RoomNumber,
                RoomType = booking.RoomType,
                GuestId = booking.GuestId,
                GuestName = booking.Guest != null
                    ? $"{booking.Guest.FirstName} {booking.Guest.LastName}"
                    : string.Empty,
                GuestEmail = booking.Guest?.Email ?? string.Empty,
                GuestPhone = booking.Guest?.PhoneNumber ?? string.Empty,
                CheckInDate = booking.CheckInDate,
                CheckOutDate = booking.CheckOutDate,
                NumberOfNights = booking.NumberOfNights,
                PricePerNight = booking.PricePerNight,
                TotalAmount = booking.TotalAmount,
                Status = booking.Status.ToString(),
                CreatedAt = booking.CreatedAt,
                UpdatedAt = booking.UpdatedAt,
                CancellationReason = booking.CancellationReason
            };
        }

        #endregion
    }
}
