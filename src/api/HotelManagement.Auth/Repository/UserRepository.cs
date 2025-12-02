using Microsoft.EntityFrameworkCore;
using HotelManagement.Auth.Data;
using HotelManagement.Auth.DTOs;
using HotelManagement.Auth.Services;
using HotelManagement.Auth.Models;

namespace HotelManagement.Auth.Services
{
    public class UserRepository : IUserRepository
    {
        private readonly ApplicationDbContext _context;

        public UserRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<User?> GetUserByIdAsync(int id)
        {

            return await _context.Users.FindAsync(id);
        }
    }
}