using AutoMapper;
using Azure;
using HotelManagement.DTOs;
using HotelManagement.Interfaces;
using Microsoft.AspNetCore.Mvc;


namespace HotelManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoomsController : ControllerBase
    {
        private readonly IMapper _mapper;
        private readonly IRoomService _roomService;
        private readonly ILogger<RoomsController> _logger;

        public RoomsController(IRoomService roomService, IMapper mapper, ILogger<RoomsController> logger)
        {
            _roomService = roomService;
            _mapper = mapper;
            _logger = logger;
        }
        
        [HttpGet]
        public async Task<ActionResult<PaginatedResponseDTO<RoomDTO>>> GetRooms([FromQuery] RoomFilterDTO filter)
        {

            //var rooms = await _roomService.GetAllRoomsAsync();
            //return Ok(rooms);
            try
            {
                var pagedRooms = await _roomService.GetFilteredRoomsAsync(filter);
                var roomDtos = _mapper.Map<List<RoomDTO>>(pagedRooms.Data);

                var pagedList = new PagedList<RoomDTO>(
                    roomDtos,
                    pagedRooms.TotalCount,
                    pagedRooms.PageNumber,
                    pagedRooms.PageSize
                    );

                return Ok(PaginatedResponseDTO<RoomDTO>.SuccessResult(pagedList.Data, pagedList.PageNumber, pagedList.PageSize, pagedList.TotalCount ));
            }
            catch (Exception ex)
            {
                return StatusCode(500, PaginatedResponseDTO<List<RoomDTO>>.FailureResult(
                    "An error occurred while retrieving rooms",
                    new List<string> { ex.Message }
                    ));
            }
        }
        [HttpPost]
        public async Task<ActionResult<NonPaginatedResponseDTO<RoomDTO>>> CreateRoom([FromBody] CreateRoomDTO createRoomDTO)
        {
            // _logger.LogInformation("CreateRoom createRoomDTO: {@Response}", createRoomDTO);
            try
            {

            var response = await _roomService.CreateRoomAsync(createRoomDTO);

            // _logger.LogInformation("CreateRoom response: {@Response}", response);

            return response;
            }
            catch (Exception ex)
            {
                return StatusCode(500, NonPaginatedResponseDTO<List<RoomDTO>>.FailureResult(
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
         
            return response;

            }
             catch (Exception ex)
            {
                return StatusCode(500, NonPaginatedResponseDTO<List<RoomDTO>>.FailureResult(
                    "An error occurred while creating room",
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
                //if (room == null) return NotFound();
                ////return Ok(room);
                //return Ok(room);
                return response;


            }
            catch (Exception ex)
            {
                return StatusCode(500, NonPaginatedResponseDTO<List<RoomDTO>>.FailureResult(
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
                //return NoContent();
                return response;


            }
            catch (Exception ex)
            {
                return StatusCode(500, NonPaginatedResponseDTO<List<RoomDTO>>.FailureResult(
                    "An error occurred while deleting room",
                    new List<string> { ex.Message }
                    ));
            }
        }
        [HttpGet("available")]
        public async Task<IActionResult> GetAvailableRooms([FromQuery] DateTime checkIn, [FromQuery] DateTime checkOut)
        {
            var rooms = await _roomService.GetAvailableRoomsAsync(checkIn, checkOut);
            return Ok(rooms);
        }
    }
}