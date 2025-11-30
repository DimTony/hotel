using HotelManagement.Auth.Models;

namespace HotelManagement.Auth.Services
{
    public interface ITokenService
    {
        string GenerateAccessToken(User user);
        string GenerateRefreshToken();
        int? ValidateAccessToken(string token);
    }
}