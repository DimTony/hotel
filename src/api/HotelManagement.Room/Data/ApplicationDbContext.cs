using Microsoft.EntityFrameworkCore;
using HotelManagement.Models;

namespace HotelManagement.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<Guest> Guests { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            // Configure relationships and constraints if needed
            modelBuilder.Entity<Room>()
                .Property(r => r.PricePerNight)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Booking>()
               .Property(b => b.TotalAmount)
               .HasPrecision(18, 2);

            modelBuilder.Entity<Booking>()
                .HasOne(b => b.Room)
                .WithMany(r => r.Bookings)
                .HasForeignKey(b => b.RoomId);

            modelBuilder.Entity<Booking>()
                .HasOne(b => b.Guest)
                .WithMany(g => g.Bookings)
                .HasForeignKey(b => b.GuestId);

            // seed
            modelBuilder.Entity<Room>().HasData(
                new Room { Id = 1, RoomNumber = "101", RoomType = RoomType.Single, PricePerNight = 100, Capacity = 1, IsAvailable = true, Description = "Single room with one bed." },
                new Room { Id = 2, RoomNumber = "102", RoomType = RoomType.Double, PricePerNight = 150, Capacity = 2, IsAvailable = true, Description = "Double room with two beds." },
                new Room { Id = 3, RoomNumber = "201", RoomType = RoomType.Suite, PricePerNight = 300, Capacity = 4, IsAvailable = true, Description = "Luxury suite with living area." }
            );
        }
    }

}