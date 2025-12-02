using HotelManagement.Auth.DTOs;

namespace HotelManagement.Auth.Services;

public interface IAuthService {
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> MockLoginAsync();
    Task<AuthResponse> RefreshTokenAsync(string refreshToken);
    Task<bool> RevokeTokenAsync(string refreshToken);
    Task<NonPaginatedResponseDTO<UserDTO>> GetUserByIdAsync(int userId);
    Task<PaginatedResponseDTO<UserDTO>> GetFilteredUsersAsync(UserFilterDTO filter);
    Task<NonPaginatedResponseDTO<UserDTO>> UpdateUserAsync(UpdateUserRequest request);
    Task<NonPaginatedResponseDTO<UserDTO>> DeleteUserAsync(int userId);
    Task<NonPaginatedResponseDTO<UserDTO>> PermanentlyDeleteUserAsync(int userId);

}