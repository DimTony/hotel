using HotelManagement.Booking.DTOs;
using HotelManagement.Booking.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Booking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BookingsController : ControllerBase
    {
        private readonly IBookingService _bookingService;
        private readonly ILogger<BookingsController> _logger;

        public BookingsController(IBookingService bookingService, ILogger<BookingsController> logger)
        {
            _bookingService = bookingService;
            _logger = logger;
        }

        /// <summary>
        /// Get all bookings with filtering, sorting, and pagination
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(PaginatedResponse<BookingDTO>), StatusCodes.Status200OK)]
        public async Task<ActionResult<PaginatedResponse<BookingDTO>>> GetBookings([FromQuery] BookingFilterDTO filter)
        {
            var response = await _bookingService.GetFilteredBookingsAsync(filter);
            return Ok(response);
        }

        /// <summary>
        /// Get a specific booking by ID
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(NonPaginatedResponse<BookingDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<NonPaginatedResponse<BookingDTO>>> GetBooking(int id)
        {
            var response = await _bookingService.GetBookingByIdAsync(id);
            return response.Success ? Ok(response) : NotFound(response);
        }

        /// <summary>
        /// Get all bookings for a specific guest
        /// </summary>
        [HttpGet("guest/{guestId}")]
        [ProducesResponseType(typeof(NonPaginatedResponse<IEnumerable<BookingDTO>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<NonPaginatedResponse<IEnumerable<BookingDTO>>>> GetBookingsByGuest(int guestId)
        {
            var response = await _bookingService.GetBookingsByGuestIdAsync(guestId);
            return Ok(response);
        }

        /// <summary>
        /// Create a new booking
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(NonPaginatedResponse<BookingDTO>), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<NonPaginatedResponse<BookingDTO>>> CreateBooking([FromBody] CreateBookingDTO createBookingDTO)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var response = await _bookingService.CreateBookingAsync(createBookingDTO);

            if (!response.Success)
            {
                return BadRequest(response);
            }

            return CreatedAtAction(nameof(GetBooking), new { id = response.Data!.Id }, response);
        }

        /// <summary>
        /// Update an existing booking
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(NonPaginatedResponse<BookingDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<NonPaginatedResponse<BookingDTO>>> UpdateBooking(int id, [FromBody] UpdateBookingDTO updateBookingDTO)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var response = await _bookingService.UpdateBookingAsync(id, updateBookingDTO);

            if (!response.Success)
            {
                return response.Message.Contains("not found") ? NotFound(response) : BadRequest(response);
            }

            return Ok(response);
        }

        /// <summary>
        /// Cancel a booking
        /// </summary>
        [HttpPost("{id}/cancel")]
        [ProducesResponseType(typeof(NonPaginatedResponse<BookingDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<NonPaginatedResponse<BookingDTO>>> CancelBooking(int id, [FromBody] CancelBookingDTO? cancelDto = null)
        {
            var response = await _bookingService.CancelBookingAsync(id, cancelDto?.Reason);

            if (!response.Success)
            {
                return response.Message.Contains("not found") ? NotFound(response) : BadRequest(response);
            }

            return Ok(response);
        }

        /// <summary>
        /// Confirm a pending booking
        /// </summary>
        [HttpPost("{id}/confirm")]
        [ProducesResponseType(typeof(NonPaginatedResponse<BookingDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<NonPaginatedResponse<BookingDTO>>> ConfirmBooking(int id)
        {
            var response = await _bookingService.ConfirmBookingAsync(id);

            if (!response.Success)
            {
                return response.Message.Contains("not found") ? NotFound(response) : BadRequest(response);
            }

            return Ok(response);
        }

        /// <summary>
        /// Check in a guest
        /// </summary>
        [HttpPost("{id}/checkin")]
        [ProducesResponseType(typeof(NonPaginatedResponse<BookingDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<NonPaginatedResponse<BookingDTO>>> CheckIn(int id)
        {
            var response = await _bookingService.CheckInAsync(id);

            if (!response.Success)
            {
                return response.Message.Contains("not found") ? NotFound(response) : BadRequest(response);
            }

            return Ok(response);
        }

        /// <summary>
        /// Check out a guest
        /// </summary>
        [HttpPost("{id}/checkout")]
        [ProducesResponseType(typeof(NonPaginatedResponse<BookingDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<NonPaginatedResponse<BookingDTO>>> CheckOut(int id)
        {
            var response = await _bookingService.CheckOutAsync(id);

            if (!response.Success)
            {
                return response.Message.Contains("not found") ? NotFound(response) : BadRequest(response);
            }

            return Ok(response);
        }

        /// <summary>
        /// Check room availability for specific dates
        /// </summary>
        [HttpPost("check-availability")]
        [ProducesResponseType(typeof(NonPaginatedResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<NonPaginatedResponse<bool>>> CheckAvailability([FromBody] CheckAvailabilityDTO request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var response = await _bookingService.CheckAvailabilityAsync(
                request.RoomId,
                request.CheckInDate,
                request.CheckOutDate
            );

            return response.Success ? Ok(response) : BadRequest(response);
        }

        /// <summary>
        /// Get upcoming bookings for the next N days
        /// </summary>
        [HttpGet("upcoming")]
        [ProducesResponseType(typeof(NonPaginatedResponse<IEnumerable<BookingDTO>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<NonPaginatedResponse<IEnumerable<BookingDTO>>>> GetUpcomingBookings([FromQuery] int days = 7)
        {
            var response = await _bookingService.GetUpcomingBookingsAsync(days);
            return Ok(response);
        }

        /// <summary>
        /// Get currently active (checked-in) bookings
        /// </summary>
        [HttpGet("active")]
        [ProducesResponseType(typeof(NonPaginatedResponse<IEnumerable<BookingDTO>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<NonPaginatedResponse<IEnumerable<BookingDTO>>>> GetActiveBookings()
        {
            var response = await _bookingService.GetActiveBookingsAsync();
            return Ok(response);
        }
    }
}
