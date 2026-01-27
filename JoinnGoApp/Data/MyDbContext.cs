using Microsoft.EntityFrameworkCore;
using JoinnGoApp.Data;
using JoinnGoApp.Models;

namespace JoinnGoApp.Data
{
    public class MyDbContext : DbContext
    {
        public MyDbContext(DbContextOptions<MyDbContext> options)
            : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Event> Events { get; set; }
        public DbSet<EventParticipant> EventParticipants { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<RecurrenceGroup> RecurrenceGroups { get; set; }
        public DbSet<UserLike> UserLikes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<EventParticipant>()
                .HasOne(ep => ep.User)
                .WithMany(u => u.EventParticipants)
                .HasForeignKey(ep => ep.UserId);

            modelBuilder.Entity<EventParticipant>()
                .HasOne(ep => ep.Event)
                .WithMany(e => e.EventParticipants)
                .HasForeignKey(ep => ep.EventId);

            modelBuilder.Entity<Event>()
                .HasOne(e => e.Creator)
                .WithMany()
                .HasForeignKey(e => e.CreatorId)
                .IsRequired()
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Comment>()
                .HasOne(c => c.Event)
                .WithMany(e => e.Comments)
                .HasForeignKey(c => c.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Comment>()
                .HasOne(c => c.User)
                .WithMany(u => u.Comments)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RecurrenceGroup>()
                .HasOne(rg => rg.Creator)
                .WithMany()
                .HasForeignKey(rg => rg.CreatorId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Event>()
                .HasOne(e => e.RecurrenceGroup)
                .WithMany(rg => rg.Events)
                .HasForeignKey(e => e.RecurrenceGroupId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<UserLike>()
                .HasKey(ul => new { ul.ObserverId, ul.TargetId });

            modelBuilder.Entity<UserLike>()
                .HasOne(ul => ul.Observer)
                .WithMany()
                .HasForeignKey(ul => ul.ObserverId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserLike>()
                .HasOne(ul => ul.Target)
                .WithMany()
                .HasForeignKey(ul => ul.TargetId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
