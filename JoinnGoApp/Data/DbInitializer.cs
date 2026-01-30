using Microsoft.AspNetCore.Identity;
using JoinnGoApp.Models;

namespace JoinnGoApp.Data
{
    public static class DbInitializer
    {
        public static void Initialize(MyDbContext context)
        {
            context.Database.EnsureCreated();

            var passwordHasher = new PasswordHasher<User>();
            if (!context.Users.Any(u => u.Role == "Admin"))
            {
                var adminUser = new User
                {
                    Email = "admin@example.com",
                    Username = "admin",
                    Role = "Admin",
                    EmailConfirmed = true
                };
                adminUser.PasswordHash = passwordHasher.HashPassword(adminUser, "admin123");
                context.Users.Add(adminUser);
            }

            if (!context.Users.Any(u => u.Email == "jan.kowalski@example.com"))
            {
                var testUser = new User
                {
                    Email = "jan.kowalski@example.com",
                    Username = "",
                    Role = "User",
                    EmailConfirmed = true
                };
                testUser.PasswordHash = passwordHasher.HashPassword(testUser, "user123");
                context.Users.Add(testUser);
            }

            context.SaveChanges();
        }
    }
}
