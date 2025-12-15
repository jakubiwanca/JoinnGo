using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JoinnGoApp.Data;
using JoinnGoApp.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EventController : ControllerBase
{
    private readonly MyDbContext _context;

    public EventController(MyDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> CreateEvent([FromBody] CreateEventDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();
        var eventDate = DateTime.SpecifyKind(dto.Date, DateTimeKind.Utc);
        var userId = int.Parse(userIdClaim.Value);
        
        var newEvent = new Event
        {
            Title = dto.Title,
            Description = dto.Description,
            Date = eventDate,
            Location = dto.Location,
            City = dto.City,
            IsPrivate = dto.IsPrivate,
            Category = dto.Category,
            CreatorId = userId
        };

        var adminParticipant = new EventParticipant
        {
            User = _context.Users.Local.FirstOrDefault(u => u.Id == userId) ?? await _context.Users.FindAsync(userId),
            Event = newEvent,
            Status = ParticipantStatus.Confirmed
        };

        _context.Events.Add(newEvent);
        _context.EventParticipants.Add(adminParticipant);

        await _context.SaveChangesAsync();

        return Ok(newEvent);
    }

    [HttpPost("{eventId}/join")]
    public async Task<IActionResult> JoinEvent(int eventId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();

        var userId = int.Parse(userIdClaim.Value);

        var eventItem = await _context.Events.FindAsync(eventId);
        if (eventItem == null) return NotFound("Wydarzenie nie istnieje.");

        var existingParticipant = await _context.EventParticipants
            .FirstOrDefaultAsync(ep => ep.EventId == eventId && ep.UserId == userId);

        if (existingParticipant != null)
            return BadRequest("Już jesteś zapisany na to wydarzenie.");

        var status = eventItem.IsPrivate ? ParticipantStatus.Interested : ParticipantStatus.Confirmed;

        var participant = new EventParticipant
        {
            UserId = userId,
            EventId = eventId,
            Status = status
        };

        _context.EventParticipants.Add(participant);
        await _context.SaveChangesAsync();

        if (status == ParticipantStatus.Interested)
            return Ok("Wysłano prośbę o dołączenie.");

        return Ok("Dołączono do wydarzenia!");
    }

    [HttpDelete("{eventId}/leave")]
    public async Task<IActionResult> LeaveEvent(int eventId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();
        var userId = int.Parse(userIdClaim.Value);

        var participant = await _context.EventParticipants
            .FirstOrDefaultAsync(ep => ep.EventId == eventId && ep.UserId == userId);

        if (participant == null)
            return NotFound("Nie bierzesz udziału w tym wydarzeniu.");

        _context.EventParticipants.Remove(participant);
        await _context.SaveChangesAsync();

        return Ok("Opuszczono wydarzenie.");
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEvent(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();
        var userId = int.Parse(userIdClaim.Value);

        bool isAdmin = User.IsInRole("Admin");

        if (!isAdmin)
        {
            isAdmin = User.Claims.Any(c =>
                (c.Type == ClaimTypes.Role || c.Type == "role") &&
                c.Value == "Admin");
        }

        var eventItem = await _context.Events.FindAsync(id);
        if (eventItem == null) return NotFound("Wydarzenie nie istnieje.");

        if (eventItem.CreatorId != userId && !isAdmin)
        {
            return Forbid("Nie masz uprawnień do usunięcia tego wydarzenia (Backend: Nie wykryto roli Admin).");
        }

        var participants = _context.EventParticipants.Where(ep => ep.EventId == id);
        _context.EventParticipants.RemoveRange(participants);

        _context.Events.Remove(eventItem);
        await _context.SaveChangesAsync();

        return Ok("Wydarzenie zostało usunięte.");
    }

    [HttpGet("{eventId}/participants")]
    public async Task<IActionResult> GetParticipants(int eventId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();
        var userId = int.Parse(userIdClaim.Value);

        var eventItem = await _context.Events.FindAsync(eventId);
        if (eventItem == null) return NotFound();

        if (eventItem.CreatorId != userId)
            return Forbid();

        var participants = await _context.EventParticipants
            .Where(ep => ep.EventId == eventId)
            .Include(ep => ep.User)
            .Select(ep => new
            {
                ep.UserId,
                Email = ep.User.Email,
                Status = ep.Status.ToString()
            })
            .ToListAsync();

        return Ok(participants);
    }

    [HttpPut("{eventId}/participants/{participantId}/status")]
    public async Task<IActionResult> UpdateParticipantStatus(int eventId, int participantId, [FromBody] string newStatus)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();
        var userId = int.Parse(userIdClaim.Value);

        var eventItem = await _context.Events.FindAsync(eventId);
        if (eventItem == null || eventItem.CreatorId != userId)
            return Forbid("Nie jesteś organizatorem tego wydarzenia.");

        var participant = await _context.EventParticipants
            .FirstOrDefaultAsync(ep => ep.EventId == eventId && ep.UserId == participantId);

        if (participant == null) return NotFound("Uczestnik nie znaleziony.");

        if (Enum.TryParse<ParticipantStatus>(newStatus, true, out var statusEnum))
        {
            participant.Status = statusEnum;
            await _context.SaveChangesAsync();
            return Ok($"Status zmieniony na {newStatus}");
        }

        return BadRequest("Niepoprawny status.");
    }

    [HttpGet("my-created")]
    public async Task<IActionResult> GetMyCreatedEvents()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();
        var userId = int.Parse(userIdClaim.Value);

        var events = await _context.Events
            .Where(e => e.CreatorId == userId)
            .OrderByDescending(e => e.Date)
            .Select(e => new
            {
                e.Id,
                e.Title,
                e.Description,
                e.Date,
                e.Location,
                e.City,
                e.IsPrivate,
                Category = e.Category.ToString(),
                ParticipantsCount = e.EventParticipants.Count
            })
            .ToListAsync();

        return Ok(events);
    }

    [HttpGet("my-joined")]
    public async Task<IActionResult> GetMyJoinedEvents()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();
        var userId = int.Parse(userIdClaim.Value);

        var events = await _context.Events
            .Where(e => e.CreatorId != userId && e.EventParticipants.Any(ep => ep.UserId == userId))
            .OrderByDescending(e => e.Date)
            .Select(e => new
            {
                e.Id,
                e.Title,
                e.Description,
                e.Date,
                e.Location,
                e.City,
                e.IsPrivate,
                Category = e.Category.ToString(),
                CreatorId = e.CreatorId,
                CreatorEmail = e.Creator.Email,
                MyStatus = e.EventParticipants
                    .Where(ep => ep.UserId == userId)
                    .Select(ep => ep.Status.ToString())
                    .FirstOrDefault()
            })
            .ToListAsync();

        return Ok(events);
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetEvents(
        [FromQuery] string? search,
        [FromQuery] string? location,
        [FromQuery] DateTime? date,
        [FromQuery] EventCategory? category,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = _context.Events
            .Include(e => e.Creator)
            .Include(e => e.EventParticipants)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            search = search.ToLower();
            query = query.Where(e => e.Title.ToLower().Contains(search) ||
                                     e.Description.ToLower().Contains(search));
        }

        if (!string.IsNullOrEmpty(location))
        {
            location = location.ToLower();
            query = query.Where(e => e.Location.ToLower().Contains(location));
        }
        
        if (category.HasValue)
        {
            query = query.Where(e => e.Category == category.Value);
        }

        if (date.HasValue)
        {
            var rawDate = date.Value.Date;
            var searchDateUtc = DateTime.SpecifyKind(rawDate, DateTimeKind.Utc);
            var nextDayUtc = searchDateUtc.AddDays(1);
            query = query.Where(e => e.Date >= searchDateUtc && e.Date < nextDayUtc);
        }

        var totalItems = await query.CountAsync();

        query = query.OrderBy(e => e.Date);

        var events = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new
            {
                e.Id,
                e.Title,
                e.Description,
                e.Date,
                e.Location,
                e.City,
                e.IsPrivate,
                Category = e.Category.ToString(),
                e.CreatorId,
                Creator = new { e.Creator.Email },
                Participants = e.EventParticipants.Select(ep => new { ep.UserId, ep.Status }).ToList()
            })
            .ToListAsync();

        return Ok(new
        {
            Data = events,
            TotalItems = totalItems,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)System.Math.Ceiling(totalItems / (double)pageSize)
        });
    }
}

public class CreateEventDto
{
    public string Title { get; set; }
    public string Description { get; set; }
    public DateTime Date { get; set; }
    public string Location { get; set; }
    public string City { get; set; }
    public bool IsPrivate { get; set; }
    public EventCategory Category { get; set; }
}