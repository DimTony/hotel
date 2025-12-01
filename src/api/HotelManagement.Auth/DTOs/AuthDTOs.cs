using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Auth.DTOs
{
    public class RegisterRequest
    {
        [Required]
        [EmailAddress]
        public string Email {  get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;

        [Required]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        public string LastName {  get; set; } = string.Empty;

        [Required]
        public string Role { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set;} = string.Empty;
    }

    public class RefreshTokenRequest
    {
        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }

    public class AuthResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? AccessToken { get; set; }
        public string? RefreshToken { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public UserDTO User { get; set; }
    }

    public class UserDTO
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Role {  get; set; } = string.Empty;
        public bool IsActive {  get; set; }
    }
      

    public class UserFilterDTO : PaginationParams
    {
        public string SearchTerm { get; set; } = string.Empty;
        public string? Role { get; set; }
        public bool? IsActive { get; set; }
        public string? SortBy { get; set; }
        public string? SortOrder { get; set; } = "desc";
    }
}