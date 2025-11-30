namespace HotelManagement.Auth.Models
{

    public class RefreshToken
    {
        public int Id { get; set; }
        public string Token { get; set; } = string.Empty;
        public int UserId { get; set; }
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsRevoked { get; set; } = false;
        public string? RevokedReason { get; set; }

        public User User { get; set; } = null;
    }
}