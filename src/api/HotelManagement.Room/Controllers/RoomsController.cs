using AutoMapper;
using HotelManagement.DTOs;
using HotelManagement.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RoomsController : ControllerBase
    {
        private readonly IRoomService _roomService;
        private readonly ILogger<RoomsController> _logger;

        public RoomsController(IRoomService roomService, ILogger<RoomsController> logger)
        {
            _roomService = roomService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedResponseDTO<RoomDTO>>> GetRooms([FromQuery] RoomFilterDTO filter)
        {
            try
            {
                var response = await _roomService.GetFilteredRoomsAsync(filter);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving rooms");
                return StatusCode(500, PaginatedResponseDTO<RoomDTO>.FailureResult(
                    "An error occurred while retrieving rooms",
                    new List<string> { ex.Message }
                ));
            }
        }

        [HttpPost]
        public async Task<ActionResult<NonPaginatedResponseDTO<RoomDTO>>> CreateRoom([FromBody] CreateRoomDTO createRoomDTO)
        {
            try
            {
                var response = await _roomService.CreateRoomAsync(createRoomDTO);

                if (!response.Success)
                {
                    return BadRequest(response);
                }

                return CreatedAtAction(nameof(GetRoom), new { id = response.Data.Id }, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating room");
                return StatusCode(500, NonPaginatedResponseDTO<RoomDTO>.FailureResult(
                    "An error occurred while creating room",
                    new List<string> { ex.Message }
                ));
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<NonPaginatedResponseDTO<RoomDTO>>> GetRoom(int id)
        {
            try
            {
                var response = await _roomService.GetRoomByIdAsync(id);

                if (!response.Success)
                {
                    return NotFound(response);
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving room {RoomId}", id);
                return StatusCode(500, NonPaginatedResponseDTO<RoomDTO>.FailureResult(
                    "An error occurred while retrieving room",
                    new List<string> { ex.Message }
                ));
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<NonPaginatedResponseDTO<RoomDTO>>> UpdateRoom(int id, [FromBody] CreateRoomDTO updateRoomDTO)
        {
            try
            {
                var response = await _roomService.UpdateRoomAsync(id, updateRoomDTO);

                if (!response.Success)
                {
                    return NotFound(response);
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating room {RoomId}", id);
                return StatusCode(500, NonPaginatedResponseDTO<RoomDTO>.FailureResult(
                    "An error occurred while updating room",
                    new List<string> { ex.Message }
                ));
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<NonPaginatedResponseDTO<RoomDTO>>> DeleteRoom(int id)
        {
            try
            {
                var response = await _roomService.DeleteRoomAsync(id);

                if (!response.Success)
                {
                    return NotFound(response);
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while deleting room {RoomId}", id);
                return StatusCode(500, NonPaginatedResponseDTO<RoomDTO>.FailureResult(
                    "An error occurred while deleting room",
                    new List<string> { ex.Message }
                ));
            }
        }

        [HttpGet("available")]
        public async Task<ActionResult<NonPaginatedResponseDTO<IEnumerable<RoomDTO>>>> GetAvailableRooms(
            [FromQuery] DateTime checkIn,
            [FromQuery] DateTime checkOut)
        {
            try
            {
                var response = await _roomService.GetAvailableRoomsAsync(checkIn, checkOut);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving available rooms");
                return StatusCode(500, NonPaginatedResponseDTO<IEnumerable<RoomDTO>>.FailureResult(
                    "An error occurred while retrieving available rooms",
                    new List<string> { ex.Message }
                ));
            }
        }
    }
}
