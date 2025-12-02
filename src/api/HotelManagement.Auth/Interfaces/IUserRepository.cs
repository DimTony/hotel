using HotelManagement.Auth.Models;
using HotelManagement.Auth.DTOs;

namespace HotelManagement.Auth.Services
{
    public interface IUserRepository
    {
        Task<User> GetUserByIdAsync(int id);   
    }
}