using HotelManagement.Booking.Models;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Booking.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Models.Booking> Bookings { get; set; }
        public DbSet<Guest> Guests { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Booking configuration
            modelBuilder.Entity<Models.Booking>(entity =>
            {
                entity.HasKey(b => b.Id);

                entity.Property(b => b.RoomNumber)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(b => b.RoomType)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(b => b.PricePerNight)
                    .HasPrecision(18, 2);

                entity.Property(b => b.TotalAmount)
                    .HasPrecision(18, 2);

                entity.Property(b => b.Status)
                    .IsRequired()
                    .HasConversion<string>();

                entity.Property(b => b.CancellationReason)
                    .HasMaxLength(500);

                // Relationship with Guest
                entity.HasOne(b => b.Guest)
                    .WithMany(g => g.Bookings)
                    .HasForeignKey(b => b.GuestId)
                    .OnDelete(DeleteBehavior.Restrict); // Prevent cascade delete

                // Indexes for performance
                entity.HasIndex(b => b.RoomId);
                entity.HasIndex(b => b.GuestId);
                entity.HasIndex(b => b.Status);
                entity.HasIndex(b => b.CheckInDate);
                entity.HasIndex(b => b.CheckOutDate);
                entity.HasIndex(b => new { b.RoomId, b.CheckInDate, b.CheckOutDate });
                entity.HasIndex(b => b.CreatedAt);
            });

            // Guest configuration
            modelBuilder.Entity<Guest>(entity =>
            {
                entity.HasKey(g => g.Id);

                entity.Property(g => g.FirstName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(g => g.LastName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(g => g.Email)
                    .IsRequired()
                    .HasMaxLength(255);

                entity.Property(g => g.PhoneNumber)
                    .IsRequired()
                    .HasMaxLength(20);

                entity.Property(g => g.Address)
                    .HasMaxLength(500);

                // Unique constraint on email
                entity.HasIndex(g => g.Email)
                    .IsUnique();
            });
        }
    }
}
