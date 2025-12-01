using HotelManagement.Auth.Data;
using HotelManagement.Auth.DTOs;
using HotelManagement.Auth.Models;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Auth.Services;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context; 
    private readonly ITokenService _tokenService; 
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;


    public AuthService(ApplicationDbContext context, ITokenService tokenService, IConfiguration configuration, ILogger<AuthService> logger)
    {
        _context = context;
        _tokenService = tokenService;
        _configuration = configuration;
        _logger = logger;

    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        // Validate role
        if (!Enum.TryParse<UserRole>(request.Role, true, out var parsedRole))
        {
            return new AuthResponse
            {
                Success = false,
                Message = "Invalid role specified"
            };
        }

        // Enforce password requirement
        bool isGuest = parsedRole == UserRole.Guest;

        if (!isGuest && string.IsNullOrWhiteSpace(request.Password))
        {
            return new AuthResponse
            {
                Success = false,
                Message = "Password is required for non-guest accounts."
            };
        }

        // Atomic transaction
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // Check email uniqueness
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return new AuthResponse
                {
                    Success = false,
                    Message = "User with this email already exists."
                };
            }

            // Only hash password if needed
            string? passwordHash = isGuest ? null : BCrypt.Net.BCrypt.HashPassword(request.Password);

            // Create user
            var user = new User
            {
                Email = request.Email,
                PasswordHash = passwordHash,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Role = parsedRole,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // If Guest → do NOT create tokens
            if (isGuest)
            {
                await transaction.CommitAsync();

                return new AuthResponse
                {
                    Success = true,
                    Message = "Guest user created successfully.",
                    User = new UserDTO
                    {
                        Id = user.Id,
                        Email = user.Email,
                        FirstName = user.FirstName,
                        LastName = user.LastName,
                        Role = user.Role.ToString()
                    }
                };
            }

            // Generate tokens
            var accessToken = _tokenService.GenerateAccessToken(user);
            var refreshToken = _tokenService.GenerateRefreshToken();

            var refreshTokenEntity = new RefreshToken
            {
                Token = refreshToken,
                UserId = user.Id,
                ExpiresAt = DateTime.UtcNow.AddDays(
                    int.Parse(_configuration["JwtSettings:RefreshTokenExpirationDays"] ?? "7")
                ),
                CreatedAt = DateTime.UtcNow
            };

            _context.RefreshTokens.Add(refreshTokenEntity);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return new AuthResponse
            {
                Success = true,
                Message = "User registered successfully",
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(
                    int.Parse(_configuration["JwtSettings:AccessTokenExpirationMinutes"] ?? "30")
                ),
                User = new UserDTO
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Role = user.Role.ToString()
                }
            };
        }
        catch
        {
            await transaction.RollbackAsync();
            throw; // Logs + returns 500 automatically
        }
    }


    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        // Find user
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return new AuthResponse
            {
                Success = false,
                Message = "Invalid email or password"
            };
        }

        if (!user.IsActive)
        {
            return new AuthResponse
            {
                Success = false,
                Message = "Account is deactivated"
            };
        }

        // Update last login
        user.LastLoginAt = DateTime.UtcNow;

        // Generate tokens
        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

        // Save refresh token
        var refreshTokenEntity = new RefreshToken
        {
            Token = refreshToken,
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(int.Parse(_configuration["JwtSettings:RefreshTokenExpirationDays"] ?? "7")),
            CreatedAt = DateTime.UtcNow
        };

        _context.RefreshTokens.Add(refreshTokenEntity);
        await _context.SaveChangesAsync();

        return new AuthResponse
        {
            Success = true,
            Message = "Login successful",
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(int.Parse(_configuration["JwtSettings:AccessTokenExpirationMinutes"] ?? "30")),
            User = new UserDTO
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role.ToString()
            }
        };
    }

    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken)
    {
        var storedToken = await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (storedToken == null)
        {
            return new AuthResponse
            {
                Success = false,
                Message = "Invalid refresh token"
            };
        }

        if (storedToken.IsRevoked)
        {
            return new AuthResponse
            {
                Success = false,
                Message = "Refresh token has been revoked"
            };
        }

        if (storedToken.ExpiresAt < DateTime.UtcNow)
        {
            return new AuthResponse
            {
                Success = false,
                Message = "Refresh token has expired"
            };
        }

        // Generate new tokens
        var accessToken = _tokenService.GenerateAccessToken(storedToken.User);
        var newRefreshToken = _tokenService.GenerateRefreshToken();

        // Revoke old refresh token
        storedToken.IsRevoked = true;
        storedToken.RevokedReason = "Replaced with new token";

        // Save new refresh token
        var newRefreshTokenEntity = new RefreshToken
        {
            Token = newRefreshToken,
            UserId = storedToken.UserId,
            ExpiresAt = DateTime.UtcNow.AddDays(int.Parse(_configuration["JwtSettings:RefreshTokenExpirationDays"] ?? "7")),
            CreatedAt = DateTime.UtcNow
        };

        _context.RefreshTokens.Add(newRefreshTokenEntity);
        await _context.SaveChangesAsync();

        return new AuthResponse
        {
            Success = true,
            Message = "Token refreshed successfully",
            AccessToken = accessToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(int.Parse(_configuration["JwtSettings:AccessTokenExpirationMinutes"] ?? "30")),
            User = new UserDTO
            {
                Id = storedToken.User.Id,
                Email = storedToken.User.Email,
                FirstName = storedToken.User.FirstName,
                LastName = storedToken.User.LastName,
                Role = storedToken.User.Role.ToString(),
            }
        };
    }

    public async Task<bool> RevokeTokenAsync(string refreshToken)
    {
        var storedToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (storedToken == null || storedToken.IsRevoked)
        {
            return false;
        }

        storedToken.IsRevoked = true;
        storedToken.RevokedReason = "Revoked by user";
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<PaginatedResponseDTO<UserDTO>> GetFilteredUsersAsync(UserFilterDTO filter)
    {
        try
        {
            var query = _context.Users.AsNoTracking().AsQueryable();

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
            {
                var searchTerm = filter.SearchTerm.ToLower();
                query = query.Where(u =>
                    u.Email.ToLower().Contains(searchTerm) ||
                    u.FirstName.ToLower().Contains(searchTerm) ||
                    u.LastName.ToLower().Contains(searchTerm));
            }

            // Apply role filter
            if (!string.IsNullOrWhiteSpace(filter.Role))
            {
                query = query.Where(u => u.Role.ToString().ToLower() == filter.Role.ToString().ToLower());
            }

            // Apply active status filter
            if (filter.IsActive.HasValue)
            {
                query = query.Where(u => u.IsActive == filter.IsActive.Value);
            }

            // Apply created date filters
            //if (filter.CreatedAfter.HasValue)
            //{
            //    query = query.Where(u => u.CreatedAt >= filter.CreatedAfter.Value);
            //}

            //if (filter.CreatedBefore.HasValue)
            //{
            //    query = query.Where(u => u.CreatedAt <= filter.CreatedBefore.Value);
            //}

            // Apply last login filters
            //if (filter.LastLoginAfter.HasValue)
            //{
            //    query = query.Where(u => u.LastLoginAt.HasValue && u.LastLoginAt >= filter.LastLoginAfter.Value);
            //}

            //if (filter.LastLoginBefore.HasValue)
            //{
            //    query = query.Where(u => u.LastLoginAt.HasValue && u.LastLoginAt <= filter.LastLoginBefore.Value);
            //}

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Apply sorting
            query = ApplySorting(query, filter.SortBy, filter.SortOrder);

            // Apply pagination
            query = query
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize);

            // Execute query and map to DTOs
            var users = await query
                .Select(u => new UserDTO
                {
                    Id = u.Id,
                    Email = u.Email,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Role = u.Role.ToString(),
                    IsActive = u.IsActive,
                    //CreatedAt = u.CreatedAt,
                    //LastLoginAt = u.LastLoginAt
                })
                .ToListAsync();

            return PaginatedResponseDTO<UserDTO>.SuccessResult(
                users,
                filter.PageNumber,
                filter.PageSize,
                totalCount,
                $"Retrieved {users.Count} of {totalCount} users"
            );

            //List<T> data, int pageNumber, int pageSize, int totalCount, string message = "Operation successful."
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving filtered users");
            return PaginatedResponseDTO<UserDTO>.FailureResult(
                "An error occurred while retrieving users",
                new List<string> { ex.Message }
            );
        }
    }

    private IQueryable<User> ApplySorting(IQueryable<User> query, string? sortBy, string sortOrder)
    {
        var isDescending = sortOrder.ToLower() == "desc";

        return sortBy?.ToLower() switch
        {
            "email" => isDescending ? query.OrderByDescending(u => u.Email) : query.OrderBy(u => u.Email),
            "firstname" => isDescending ? query.OrderByDescending(u => u.FirstName) : query.OrderBy(u => u.FirstName),
            "lastname" => isDescending ? query.OrderByDescending(u => u.LastName) : query.OrderBy(u => u.LastName),
            "role" => isDescending ? query.OrderByDescending(u => u.Role) : query.OrderBy(u => u.Role),
            "createdat" => isDescending ? query.OrderByDescending(u => u.CreatedAt) : query.OrderBy(u => u.CreatedAt),
            "lastloginat" => isDescending ? query.OrderByDescending(u => u.LastLoginAt) : query.OrderBy(u => u.LastLoginAt),
            _ => query.OrderByDescending(u => u.CreatedAt) // Default sort by CreatedAt descending
        };
    }

}