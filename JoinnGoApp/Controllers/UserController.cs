using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using JoinnGoApp.Data;
using JoinnGoApp.Models;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly MyDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly PasswordHasher<User> _passwordHasher;
    private readonly JoinnGoApp.Services.IEmailService _emailService;

    public UserController(MyDbContext context, IConfiguration configuration, JoinnGoApp.Services.IEmailService emailService)
    {
        _context = context;
        _configuration = configuration;
        _passwordHasher = new PasswordHasher<User>();
        _emailService = emailService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            return BadRequest("Email already exists");

        var user = new User
        {
            Email = dto.Email,
            Role = "User",
            EmailConfirmed = false,
            EmailConfirmationToken = Guid.NewGuid().ToString(),
            EmailConfirmationTokenExpiry = DateTime.UtcNow.AddHours(24)
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        try
        {
            await _emailService.SendEmailConfirmationAsync(user.Email, user.EmailConfirmationToken);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to send email: {ex.Message}");
        }

        return Ok("Registration successful. Please check your email to confirm your account.");
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var user = await _context.Users.SingleOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null) return Unauthorized("Invalid email or password");

        var verify = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
        bool isPasswordValid = false;

        if (verify == PasswordVerificationResult.Success || verify == PasswordVerificationResult.SuccessRehashNeeded)
        {
            isPasswordValid = true;
            if (verify == PasswordVerificationResult.SuccessRehashNeeded)
            {
                user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);
                await _context.SaveChangesAsync();
            }
        }
        else 
        {
            var sha = HashSha256(dto.Password);
            if (sha == user.PasswordHash)
            {
                isPasswordValid = true;
                user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);
                await _context.SaveChangesAsync();
            }
        }

        if (!isPasswordValid)
    {
        return Unauthorized("Invalid email or password");
    }

    if (!user.EmailConfirmed)
    {
        return Unauthorized("Email not confirmed. Please check your inbox and confirm your email address.");
    }

    var token = GenerateJwtToken(user);

        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddMinutes(60)
        };

        Response.Cookies.Append("jwt", token, cookieOptions);

        return Ok(new { message = "Login successful", role = user.Role });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("jwt");
        return Ok(new { message = "Logged out" });
    }

    [HttpGet("confirm-email")]
    public async Task<IActionResult> ConfirmEmail([FromQuery] string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return BadRequest("Invalid token");
        }

        Console.WriteLine($"[DEBUG] ConfirmEmail endpoint called with token: '{token}'");

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.EmailConfirmationToken == token);

        if (user == null)
        {
            Console.WriteLine($"[DEBUG] ERROR: User NOT found for token: '{token}'");
            
            // Print all tokens in DB to allow comparison (for debugging purposes only)
            var existingTokens = await _context.Users
                .Where(u => u.EmailConfirmationToken != null)
                .Select(u => $"{u.Email}:{u.EmailConfirmationToken}")
                .ToListAsync();
            
            Console.WriteLine($"[DEBUG] Available tokens in DB ({existingTokens.Count}):");
            foreach(var t in existingTokens) Console.WriteLine($" - {t}");

            return BadRequest("Invalid or expired confirmation token");
        }
        
        Console.WriteLine($"[DEBUG] User found: {user.Email}, ID: {user.Id}");

        if (user.EmailConfirmed)
        {
            return Ok("Email potwierdzony. Możesz się zalogować.");
        }

        if (user.EmailConfirmationTokenExpiry == null || 
            user.EmailConfirmationTokenExpiry < DateTime.UtcNow)
        {
            return BadRequest("Token wygasł. Poproszę o ponowne potwierdzenie.");
        }

        user.EmailConfirmed = true;
        // We do NOT clear the token here to allow for idempotent checks (double clicks, browser pre-fetching)
        // user.EmailConfirmationToken = null; 
        // user.EmailConfirmationTokenExpiry = null;

        await _context.SaveChangesAsync();

        return Ok("Email potwierdzony. Możesz się zalogować.");
    }

    private string GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]);

        var tokenHandler = new JwtSecurityTokenHandler();
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Role, user.Role ?? "User")
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["ExpiresInMinutes"])),
            Issuer = jwtSettings["Issuer"],
            Audience = jwtSettings["Audience"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private string HashSha256(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(password);
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToBase64String(hash);
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized("Nie można odczytać danych użytkownika z tokena.");

        var userId = int.Parse(userIdClaim.Value);
        var user = await _context.Users.FindAsync(userId);

        if (user == null) return NotFound("Użytkownik nie istnieje.");

        return Ok(new
        {
            Id = userId.ToString(),
            Email = user.Email,
            Role = user.Role,
            Username = user.Username
        });
    }

    [Authorize]
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateMyProfileDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound("User not found");

        if (!string.IsNullOrWhiteSpace(dto.Username))
        {
             // Check uniqueness if desired, enforcing specific username rules
             if (await _context.Users.AnyAsync(u => u.Username == dto.Username && u.Id != userId))
             {
                 return BadRequest("Ta nazwa użytkownika jest już zajęta.");
             }
             user.Username = dto.Username;
        }
        
        await _context.SaveChangesAsync();

        return Ok(new { message = "Profile updated successfully", username = user.Username });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("all")]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _context.Users
            .Select(u => new { u.Id, u.Email, u.Role, u.Username })
            .ToListAsync();
        return Ok(users);
    }


    [Authorize(Roles = "Admin")]
    [HttpPost("setrole")]
    public async Task<IActionResult> SetUserRole([FromBody] SetRoleDto dto)
    {
        var user = await _context.Users.SingleOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null) return NotFound("User not found");

        user.Role = dto.Role;
        await _context.SaveChangesAsync();
        return Ok($"User {user.Email} role changed to {user.Role}");
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (currentUserIdClaim == null) return Unauthorized();

        int currentUserId = int.Parse(currentUserIdClaim.Value);

        if (id == currentUserId)
        {
            return BadRequest("Nie możesz usunąć własnego konta administratora.");
        }

        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound("User not found");

        var userEvents = _context.Events.Where(e => e.CreatorId == id);
        _context.Events.RemoveRange(userEvents);

        var userParticipations = _context.EventParticipants.Where(ep => ep.UserId == id);
        _context.EventParticipants.RemoveRange(userParticipations);

        var userComments = _context.Comments.Where(c => c.UserId == id);
        _context.Comments.RemoveRange(userComments);

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return Ok($"User {user.Email} deleted");
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();

        int userId = int.Parse(userIdClaim.Value);
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound("User not found");

        var verify = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.CurrentPassword);
        bool isCurrentPasswordValid = false;

        if (verify == PasswordVerificationResult.Success || verify == PasswordVerificationResult.SuccessRehashNeeded)
        {
            isCurrentPasswordValid = true;
        }
        else 
        {
            var sha = HashSha256(dto.CurrentPassword);
            if (sha == user.PasswordHash)
            {
                isCurrentPasswordValid = true;
            }
        }

        if (!isCurrentPasswordValid)
        {
            return BadRequest(new { message = "Current password is incorrect" });
        }

        user.PasswordHash = _passwordHasher.HashPassword(user, dto.NewPassword);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Password changed successfully" });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (currentUserIdClaim == null) return Unauthorized();

        int currentUserId = int.Parse(currentUserIdClaim.Value);

        if (id == currentUserId)
        {
            return BadRequest("Nie możesz edytować własnego konta z poziomu panelu admina.");
        }

        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound("User not found");

        if (await _context.Users.AnyAsync(u => u.Email == dto.Email && u.Id != id))
        {
            return BadRequest("Email jest już zajęty przez innego użytkownika.");
        }

        user.Email = dto.Email;
        await _context.SaveChangesAsync();

        return Ok(new { Id = user.Id, Email = user.Email, Role = user.Role });
    }
}

public class ChangePasswordDto
{
    [Required]
    public string CurrentPassword { get; set; }

    [Required]
    [MinLength(6)]
    public string NewPassword { get; set; }
}

public class UpdateMyProfileDto
{
    [Required]
    [MinLength(3)]
    public string Username { get; set; }
}

public class UpdateUserDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; }
}

public class SetRoleDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; }
    [Required]
    public string Role { get; set; }
}

public class RegisterDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; }
    [Required]
    [MinLength(6)]
    public string Password { get; set; }
}

public class LoginDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; }
    [Required]
    public string Password { get; set; }
}
