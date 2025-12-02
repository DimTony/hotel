namespace HotelManagement.Auth.Models
{

    public class User
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public UserRole Role {  get; set; } = UserRole.Guest;
        public UserStatus Status {  get; set; } = UserStatus.Active;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastLoginAt { get; set; }

        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    }

    public enum UserRole
    {
        Receptionist,
        Admin,
        Manager,
        Guest
    }

    public enum UserStatus
    {
        Active,
        Inactive,
        Deleted
    }

}