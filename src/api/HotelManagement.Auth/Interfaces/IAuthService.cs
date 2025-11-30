using HotelManagement.Auth.DTOs;

namespace HotelManagement.Auth.Services;

public interface IAuthService {
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> RefreshTokenAsync(string refreshToken);
    Task<bool> RevokeTokenAsync(string refreshToken); 
}