using Microsoft.AspNetCore.Identity;
using JoinnGoApp.Models;

namespace JoinnGoApp.Data
{
    public static class DbInitializer
    {
        public static void Initialize(MyDbContext context)
        {
            context.Database.EnsureCreated();

            if (context.Users.Any(u => u.Role == "Admin"))
            {
                return;
            }

            var passwordHasher = new PasswordHasher<User>();
            var adminUser = new User
            {
                Email = "admin@example.com",
                Role = "Admin"
            };

            adminUser.PasswordHash = passwordHasher.HashPassword(adminUser, "admin123");

            context.Users.Add(adminUser);
            context.SaveChanges();
        }
    }
}
