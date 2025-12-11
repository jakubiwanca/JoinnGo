using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JoinnGoApp.Data;
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
        var userId = int.Parse(userIdClaim.Value);
        var newEvent = new Event
        {
            Title = dto.Title,
            Description = dto.Description,
            Date = dto.Date,
            Location = dto.Location,
            IsPrivate = dto.IsPrivate,
            CreatorId = userId
        };
        var adminParticipant = new EventParticipant
        {
            User = _context.Users.Local.FirstOrDefault(u => u.Id == userId) ?? await _context.Users.FindAsync(userId),
            Event = newEvent,
            Status = ParticipantStatus.Confirmed
        };

        _context.Events.Add(newEvent);
        await _context.SaveChangesAsync();

        return Ok(newEvent);
    }

    // dolacz do wydarzenia
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

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEvent(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();
        var userId = int.Parse(userIdClaim.Value);

        var eventItem = await _context.Events.FindAsync(id);
        if (eventItem == null) return NotFound("Wydarzenie nie istnieje.");

        if (eventItem.CreatorId != userId)
        {
            return Forbid("Nie masz uprawnień do usunięcia tego wydarzenia.");
        }

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
    
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetEvents()
    {
        var events = await _context.Events
            .Include(e => e.Creator) 
            .ToListAsync();
            
        return Ok(events);
    }
}

public class CreateEventDto
{
    public string Title { get; set; }
    public string Description { get; set; }
    public DateTime Date { get; set; }
    public string Location { get; set; }
    public bool IsPrivate { get; set; }
}