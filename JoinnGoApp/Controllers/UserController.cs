using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

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

        const string successMessage = "Jeśli podany adres email nie był wcześniej zarejestrowany, wysłaliśmy na niego link aktywacyjny.";

        if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
        {
            await Task.Delay(Random.Shared.Next(500, 1500));
            return Ok(successMessage);
        }

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

        return Ok(successMessage);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var user = await _context.Users.SingleOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null) return Unauthorized("Niepoprawny email lub hasło");

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

        if (!isPasswordValid)
    {
        return Unauthorized("Niepoprawny email lub hasło");
    }

    if (!user.EmailConfirmed)
    {
        return Unauthorized("Email nie został potwierdzony. Sprawdź swoją skrzynkę odbiorczą i potwierdź adres email.");
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
            return BadRequest("Nieprawidłowy token.");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.EmailConfirmationToken == token);

        if (user == null)
        {
            return BadRequest("Token nieprawidłowy lub wygasł.");
        }

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

        await _context.SaveChangesAsync();

        return Ok("Email potwierdzony. Możesz się zalogować.");
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var user = await _context.Users.SingleOrDefaultAsync(u => u.Email == dto.Email);
        
        if (user == null) 
        {
            await Task.Delay(500); 
            return Ok("Jeśli podany email istnieje w naszej bazie, wysłaliśmy na niego instrukcję resetowania hasła.");
        }

        var resetToken = Guid.NewGuid().ToString();
        user.PasswordResetToken = resetToken;
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);

        await _context.SaveChangesAsync();

        try
        {
            await _emailService.SendPasswordResetAsync(user.Email, resetToken);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error sending password reset email: {ex.Message}");
        }

        return Ok("Jeśli podany email istnieje w naszej bazie, wysłaliśmy na niego instrukcję resetowania hasła.");
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var user = await _context.Users.SingleOrDefaultAsync(u => u.PasswordResetToken == dto.Token);

        if (user == null || user.PasswordResetTokenExpiry == null || user.PasswordResetTokenExpiry < DateTime.UtcNow)
        {
            return BadRequest("Token jest nieprawidłowy lub wygasł.");
        }

        user.PasswordHash = _passwordHasher.HashPassword(user, dto.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiry = null;

        await _context.SaveChangesAsync();

        return Ok("Hasło zostało pomyślnie zmienione. Możesz się teraz zalogować.");
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



    [Authorize]
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized("Nie można odczytać danych użytkownika z tokena.");

        var userId = int.Parse(userIdClaim.Value);
        var user = await _context.Users.FindAsync(userId);

        if (user == null) return NotFound("Użytkownik nie istnieje.");

        var followersCount = await _context.UserLikes.CountAsync(ul => ul.TargetId == userId);

        return Ok(new
        {
            Id = userId.ToString(),
            Email = user.Email,
            Role = user.Role,
            Username = user.Username,
            FollowersCount = followersCount
        });
    }

    [Authorize]
    [HttpGet("my-followers")]
    public async Task<IActionResult> GetMyFollowers()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();
        var userId = int.Parse(userIdClaim.Value);

        var followers = await _context.UserLikes
            .Where(ul => ul.TargetId == userId)
            .Include(ul => ul.Observer)
            .Select(ul => new
            {
                ul.Observer.Id,
                ul.Observer.Username,
                ul.Observer.Email
            })
            .ToListAsync();

        return Ok(followers);
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
        if (user == null) return NotFound("Nie znaleziono użytkownika.");

        if (!string.IsNullOrWhiteSpace(dto.Username))
        {
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
    public async Task<IActionResult> GetAllUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var query = _context.Users.AsQueryable();
        var totalItems = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        var users = await query
            .OrderBy(u => u.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new { u.Id, u.Email, u.Role, u.Username, u.EmailConfirmed })
            .ToListAsync();

         return Ok(new
        {
            Data = users,
            TotalItems = totalItems,
            Page = page,
            PageSize = pageSize,
            TotalPages = totalPages
        });
    }


    [Authorize(Roles = "Admin")]
    [HttpPost("setrole")]
    public async Task<IActionResult> SetUserRole([FromBody] SetRoleDto dto)
    {
        var user = await _context.Users.SingleOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null) return NotFound("Nie znaleziono użytkownika.");

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
        if (user == null) return NotFound("Nie znaleziono użytkownika.");

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
        if (user == null) return NotFound("Nie znaleziono użytkownika.");

        var verify = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.CurrentPassword);
        bool isCurrentPasswordValid = false;

        if (verify == PasswordVerificationResult.Success || verify == PasswordVerificationResult.SuccessRehashNeeded)
        {
            isCurrentPasswordValid = true;
        }


        if (!isCurrentPasswordValid)
        {
            return BadRequest(new { message = "Obecne hasło jest nieprawidłowe." });
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
        if (user == null) return NotFound("Nie znaleziono użytkownika.");

        if (await _context.Users.AnyAsync(u => u.Email == dto.Email && u.Id != id))
        {
            return BadRequest("Email jest już zajęty przez innego użytkownika.");
        }

        user.Email = dto.Email;
        await _context.SaveChangesAsync();

        return Ok(new { Id = user.Id, Email = user.Email, Role = user.Role });
    }
    [Authorize]
    [HttpPost("{id}/follow")]
    public async Task<IActionResult> ToggleFollow(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();
        var currentUserId = int.Parse(userIdClaim.Value);

        if (id == currentUserId) return BadRequest("Nie możesz obserwować samego siebie.");

        var targetUser = await _context.Users.FindAsync(id);
        if (targetUser == null) return NotFound("Użytkownik nie istnieje.");

        var existingLike = await _context.UserLikes.FindAsync(currentUserId, id);

        if (existingLike != null)
        {
            _context.UserLikes.Remove(existingLike);
            await _context.SaveChangesAsync();
            return Ok(new { isLeading = false, message = "Przestałeś obserwować tego użytkownika." });
        }
        else
        {
            var like = new UserLike
            {
                ObserverId = currentUserId,
                TargetId = id
            };
            _context.UserLikes.Add(like);
            await _context.SaveChangesAsync();
            return Ok(new { isLeading = true, message = "Zacząłeś obserwować tego użytkownika." });
        }
    }

    [Authorize]
    [HttpGet("{id}/public-profile")]
    public async Task<IActionResult> GetPublicProfile(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();
        var currentUserId = int.Parse(userIdClaim.Value);

        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound("Użytkownik nie istnieje.");

        var followersCount = await _context.UserLikes.CountAsync(ul => ul.TargetId == id);
        var isFollowed = await _context.UserLikes.AnyAsync(ul => ul.ObserverId == currentUserId && ul.TargetId == id);

        return Ok(new
        {
            user.Id,
            user.Username,
            FollowersCount = followersCount,
            IsFollowed = isFollowed
        });
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

public class ForgotPasswordDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; }
}

public class ResetPasswordDto
{
    [Required]
    public string Token { get; set; }
    
    [Required]
    [MinLength(6)]
    public string NewPassword { get; set; }
}
