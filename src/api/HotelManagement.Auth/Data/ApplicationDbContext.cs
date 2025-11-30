using Microsoft.EntityFrameworkCore;
using HotelManagement.Auth.Models;

namespace HotelManagement.Auth.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }
        public DbSet<User> Users { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            // Configure relationships and constraints if needed
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.Id);
                entity.HasIndex(u => u.Email).IsUnique();
                entity.Property(u => u.Email).IsRequired().HasMaxLength(255);
                entity.Property(u => u.PasswordHash).IsRequired();
                entity.Property(u => u.FirstName).IsRequired().HasMaxLength(100);
                entity.Property(u => u.LastName).IsRequired().HasMaxLength(100);
                entity.Property(u => u.Role).IsRequired().HasMaxLength(50)
                        .HasConversion<string>();

            });

            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.HasKey(rt => rt.Id);
                entity.HasIndex(rt => rt.Token).IsUnique();
                entity.Property(rt => rt.Token).IsRequired();
                entity.HasOne(rt => rt.User)
                        .WithMany(u => u.RefreshTokens)
                        .HasForeignKey(rt => rt.UserId)
                        .OnDelete(DeleteBehavior.Cascade);

            });

            //modelBuilder.Entity<Booking>()
            //   .Property(b => b.TotalAmount)
            //   .HasPrecision(18, 2);

            //modelBuilder.Entity<Booking>()
            //    .HasOne(b => b.Room)
            //    .WithMany(r => r.Bookings)
            //    .HasForeignKey(b => b.RoomId);

            //modelBuilder.Entity<Booking>()
            //    .HasOne(b => b.Guest)
            //    .WithMany(g => g.Bookings)
            //    .HasForeignKey(b => b.GuestId);

            //// seed
            //modelBuilder.Entity<Room>().HasData(
            //    new Room { Id = 1, RoomNumber = "101", RoomType = RoomType.Single, PricePerNight = 100, Capacity = 1, IsAvailable = true, Description = "Single room with one bed." },
            //    new Room { Id = 2, RoomNumber = "102", RoomType = RoomType.Double, PricePerNight = 150, Capacity = 2, IsAvailable = true, Description = "Double room with two beds." },
            //    new Room { Id = 3, RoomNumber = "201", RoomType = RoomType.Suite, PricePerNight = 300, Capacity = 4, IsAvailable = true, Description = "Luxury suite with living area." }
            //);
        }
    }

}