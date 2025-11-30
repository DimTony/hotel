using HotelManagement.Booking.DTOs;
using System.Text.Json;

namespace HotelManagement.Booking.Services
{
    public interface IRoomServiceClient
    {
        Task<RoomDTO?> GetRoomByIdAsync(int roomId);
        Task<bool> IsRoomAvailableAsync(int roomId);
    }

    public class RoomServiceClient : IRoomServiceClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<RoomServiceClient> _logger;
        private readonly JsonSerializerOptions _jsonOptions;

        public RoomServiceClient(HttpClient httpClient, ILogger<RoomServiceClient> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
        }

        public async Task<RoomDTO?> GetRoomByIdAsync(int roomId)
        {
            try
            {
                var response = await _httpClient.GetAsync($"/api/rooms/{roomId}");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to get room {RoomId} from Room service. Status: {StatusCode}",
                        roomId, response.StatusCode);
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync();
                var apiResponse = JsonSerializer.Deserialize<NonPaginatedResponse<RoomDTO>>(content, _jsonOptions);

                return apiResponse?.Data;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Room service to get room {RoomId}", roomId);
                return null;
            }
        }

        public async Task<bool> IsRoomAvailableAsync(int roomId)
        {
            try
            {
                var room = await GetRoomByIdAsync(roomId);
                return room?.IsAvailable ?? false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking room availability for room {RoomId}", roomId);
                return false;
            }
        }
    }
}
