using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using JoinnGoApp.Data;
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

    public UserController(MyDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
        _passwordHasher = new PasswordHasher<User>();
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
            Role = "User"
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok("User registered successfully");
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
    public IActionResult GetProfile()
    {
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (email == null || userId == null)
            return Unauthorized("Nie można odczytać danych użytkownika z tokena.");

        return Ok(new
        {
            Id = userId,
            Email = email,
            Role = User.FindFirst("role")?.Value ?? User.FindFirst(ClaimTypes.Role)?.Value
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("all")]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _context.Users
            .Select(u => new { u.Id, u.Email, u.Role })
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

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return Ok($"User {user.Email} deleted");
    }
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