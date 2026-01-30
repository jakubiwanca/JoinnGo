using System.Security.Claims;
using JoinnGoApp.Data;
using JoinnGoApp.Models;
using JoinnGoApp.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace JoinnGoApp.Tests
{
    public class EventControllerTests
    {
        private MyDbContext GetDatabaseContext()
        {
            var options = new DbContextOptionsBuilder<MyDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            var databaseContext = new MyDbContext(options);
            databaseContext.Database.EnsureCreated();
            return databaseContext;
        }

        private EventController GetController(MyDbContext context, int userId = 1, string role = "User")
        {
            var recurrenceService = new RecurrenceService();

            var controller = new EventController(context, recurrenceService);
            
            var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.Email, "test@example.com"),
                new Claim(ClaimTypes.Name, "testuser")
            }, "mock"));

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            return controller;
        }

        // Czy metoda GetEvents zwraca listę wydarzeń (kod 200).
        [Fact]
        public async Task GetEvents_ReturnsOkResult_WithListOfEvents()
        {
            // Arrange
            using var context = GetDatabaseContext();
            var creator = new User { Id = 1, Username = "creator", Email = "creator@example.com", PasswordHash = "hash", Role = "User" };
            context.Users.Add(creator);
            
            context.Events.Add(new Event
            {
                Id = 1,
                Title = "Test Event",
                Description = "Description",
                Date = DateTime.UtcNow.AddDays(1),
                Location = "Location",
                City = "City",
                CreatorId = 1,
                Category = EventCategory.Kultura,
                MaxParticipants = 10,
                IsPrivate = false,
                Creator = creator
            });
            await context.SaveChangesAsync();

            var controller = GetController(context);

            // Act
            var result = await controller.GetEvents(null, null, null, null, 1, 10);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        // Tworzenie nowego wydarzenia i sprawdzenie, czy zwracany jest kod sukcesu 200.
        [Fact]
        public async Task CreateEvent_ReturnsCreated_WhenValid()
        {
            // Arrange
            using var context = GetDatabaseContext();
            var controller = GetController(context);
            var dto = new CreateEventDto
            {
                Title = "New Event",
                Description = "New Description",
                Date = DateTime.UtcNow.AddDays(5),
                Location = "Test Loc",
                City = "Test City",
                Category = EventCategory.Edukacja,
                MaxParticipants = 50,
                IsPrivate = false
            };

            // Act
            var result = await controller.CreateEvent(dto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(200, okResult.StatusCode);
        }

        // Próba usunięcia wydarzenia przez osobę nieuprawnioną (nie twórcę/nie admina) kończy się odmową (Forbid).
        [Fact]
        public async Task DeleteEvent_ReturnsForbid_WhenNotCreatorOrAdmin()
        {
             // Arrange
            using var context = GetDatabaseContext();
            var creator = new User { Id = 2, Username = "other", Email = "other@example.com", PasswordHash = "hash", Role = "User" };
            context.Users.Add(creator);
            context.Events.Add(new Event
            {
                Id = 1,
                Title = "Other Event",
                Description = "Desc",
                Date = DateTime.UtcNow.AddDays(1),
                Location = "Loc",
                City = "City",
                CreatorId = 2, 
                Creator = creator
            });
            await context.SaveChangesAsync();

            // Controller acts as User 1
            var controller = GetController(context, userId: 1);

            // Act
            var result = await controller.DeleteEvent(1);

            // Assert
            Assert.IsType<ForbidResult>(result);
        }

        // Testuje poprawne usunięcie wydarzenia przez jego twórcę.
        [Fact]
        public async Task DeleteEvent_ReturnsOk_WhenCreator()
        {
             // Arrange
            using var context = GetDatabaseContext();
            var creator = new User { Id = 1, Username = "me", Email = "me@example.com", PasswordHash = "hash", Role = "User" };
            context.Users.Add(creator);
            context.Events.Add(new Event
            {
                Id = 1,
                Title = "My Event",
                Description = "Desc",
                Date = DateTime.UtcNow.AddDays(1),
                Location = "Loc",
                City = "City",
                CreatorId = 1, 
                Creator = creator
            });
            await context.SaveChangesAsync();

            var controller = GetController(context, userId: 1);

            // Act
            var result = await controller.DeleteEvent(1);

            // Assert
            Assert.IsType<OkObjectResult>(result);
            Assert.Null(await context.Events.FindAsync(1));
        }
    }
}
