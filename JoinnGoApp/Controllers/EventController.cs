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
    private readonly JoinnGoApp.Services.RecurrenceService _recurrenceService;

    public EventController(MyDbContext context, JoinnGoApp.Services.RecurrenceService recurrenceService)
    {
        _context = context;
        _recurrenceService = recurrenceService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateEvent([FromBody] CreateEventDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();
        var eventDate = DateTime.SpecifyKind(dto.Date, DateTimeKind.Utc);
        var userId = int.Parse(userIdClaim.Value);

        // czy wydarzenie cykliczne
        if (dto.Recurrence != null && dto.Recurrence.Type > 0)
        {
            // stworz grupe cykliczna
            var recurrenceGroup = new RecurrenceGroup
            {
                CreatorId = userId,
                Type = (RecurrenceType)dto.Recurrence.Type,
                Interval = dto.Recurrence.Interval,
                DaysOfWeek = dto.Recurrence.DaysOfWeek != null 
                    ? System.Text.Json.JsonSerializer.Serialize(dto.Recurrence.DaysOfWeek)
                    : null,
                StartDate = eventDate.Date,
                EndDate = dto.Recurrence.EndDate,
                MaxOccurrences = dto.Recurrence.MaxOccurrences
            };

            _context.RecurrenceGroups.Add(recurrenceGroup);
            await _context.SaveChangesAsync();

            var templateEvent = new Event
            {
                Title = dto.Title,
                Description = dto.Description,
                Date = eventDate,
                Location = dto.Location,
                City = dto.City,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                IsPrivate = dto.IsPrivate,
                Category = dto.Category,
                MaxParticipants = dto.MaxParticipants
            };

            // Validation for recurrence
            if (!recurrenceGroup.EndDate.HasValue && !recurrenceGroup.MaxOccurrences.HasValue)
            {
                return BadRequest("Musisz podać datę końcową lub liczbę powtórzeń dla wydarzenia cyklicznego.");
            }

            if (recurrenceGroup.Type == RecurrenceType.Weekly)
            {
                // dto.Recurrence.DaysOfWeek is the source, checking that
                if (dto.Recurrence.DaysOfWeek == null || dto.Recurrence.DaysOfWeek.Length == 0)
                {
                    return BadRequest("Dla powtarzania co tydzień musisz wybrać przynajmniej jeden dzień tygodnia.");
                }
            }

            var eventInstances = _recurrenceService.CreateEventInstances(
                recurrenceGroup,
                templateEvent,
                userId
            );

            _context.Events.AddRange(eventInstances);

            foreach (var eventInstance in eventInstances)
            {
                var participant = new EventParticipant
                {
                    UserId = userId,
                    Event = eventInstance,
                    Status = ParticipantStatus.Confirmed
                };
                _context.EventParticipants.Add(participant);
            }

            await _context.SaveChangesAsync();

            return Ok(new { 
                Message = $"Created {eventInstances.Count} recurring events", 
                Count = eventInstances.Count,
                RecurrenceGroupId = recurrenceGroup.Id
            });
        }
        else
        {
            var newEvent = new Event
            {
                Title = dto.Title,
                Description = dto.Description,
                Date = eventDate,
                Location = dto.Location,
                City = dto.City,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                IsPrivate = dto.IsPrivate,
                Category = dto.Category,
                MaxParticipants = dto.MaxParticipants,
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

        if (eventItem.MaxParticipants > 0)
        {
            var confirmedCount = await _context.EventParticipants
                .CountAsync(ep => ep.EventId == eventId && ep.Status == ParticipantStatus.Confirmed);

            if (confirmedCount >= eventItem.MaxParticipants)
            {
                return BadRequest("Wydarzenie osiągnęło limit miejsc.");
            }
        }

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

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateEvent(int id, [FromBody] UpdateEventDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();
        var userId = int.Parse(userIdClaim.Value);

        var eventItem = await _context.Events.FindAsync(id);
        if (eventItem == null) return NotFound("Wydarzenie nie istnieje.");

        bool isAdmin = User.IsInRole("Admin");

        if (eventItem.CreatorId != userId && !isAdmin)
        {
            return Forbid("Nie masz uprawnień do edycji tego wydarzenia.");
        }

        eventItem.Title = dto.Title;
        eventItem.Description = dto.Description;
        eventItem.Date = DateTime.SpecifyKind(dto.Date, DateTimeKind.Utc);
        eventItem.Location = dto.Location;
        eventItem.City = dto.City;
        eventItem.Latitude = dto.Latitude;
        eventItem.Longitude = dto.Longitude;
        eventItem.IsPrivate = dto.IsPrivate;
        eventItem.Category = dto.Category;
        eventItem.MaxParticipants = dto.MaxParticipants;

        // Handle recurrence logic (Update, Create, or Remove)
        
        // 1. If event was already recurring, remove old recurrence data (reset to single)
        if (eventItem.RecurrenceGroupId != null)
        {
            var oldGroupId = eventItem.RecurrenceGroupId;
            
            // Unlink this event
            eventItem.RecurrenceGroupId = null;

            // Find other events in the group
            var otherEvents = _context.Events.Where(e => e.RecurrenceGroupId == oldGroupId && e.Id != id);
            _context.Events.RemoveRange(otherEvents);

            // Remove the group itself
            var oldGroup = await _context.RecurrenceGroups.FindAsync(oldGroupId);
            if (oldGroup != null)
            {
                _context.RecurrenceGroups.Remove(oldGroup);
            }
        }

        // 2. If new recurrence is requested, create it (treat as new recurrence starting from this event)
        if (dto.Recurrence != null && dto.Recurrence.Type > 0)
        {
            var recurrenceGroup = new RecurrenceGroup
            {
                CreatorId = userId,
                Type = (RecurrenceType)dto.Recurrence.Type,
                Interval = dto.Recurrence.Interval,
                DaysOfWeek = dto.Recurrence.DaysOfWeek != null 
                    ? System.Text.Json.JsonSerializer.Serialize(dto.Recurrence.DaysOfWeek)
                    : null,
                StartDate = eventItem.Date.Date,
                EndDate = dto.Recurrence.EndDate,
                MaxOccurrences = dto.Recurrence.MaxOccurrences
            };

            _context.RecurrenceGroups.Add(recurrenceGroup);
            await _context.SaveChangesAsync();

            // Link current event to group
            eventItem.RecurrenceGroupId = recurrenceGroup.Id;

            // Generate additional instances
            var templateEvent = new Event
            {
                Title = eventItem.Title,
                Description = eventItem.Description,
                Date = eventItem.Date,
                Location = eventItem.Location,
                City = eventItem.City,
                Latitude = eventItem.Latitude,
                Longitude = eventItem.Longitude,
                IsPrivate = eventItem.IsPrivate,
                Category = eventItem.Category,
                MaxParticipants = eventItem.MaxParticipants
            };

            // Validation for recurrence
            if (!recurrenceGroup.EndDate.HasValue && !recurrenceGroup.MaxOccurrences.HasValue)
            {
                return BadRequest("Musisz podać datę końcową lub liczbę powtórzeń dla wydarzenia cyklicznego.");
            }

            if (recurrenceGroup.Type == RecurrenceType.Weekly)
            {
                // dto.Recurrence.DaysOfWeek is the source, checking that
                if (dto.Recurrence.DaysOfWeek == null || dto.Recurrence.DaysOfWeek.Length == 0)
                {
                    return BadRequest("Dla powtarzania co tydzień musisz wybrać przynajmniej jeden dzień tygodnia.");
                }
            }

            var eventInstances = _recurrenceService.CreateEventInstances(
                recurrenceGroup,
                templateEvent,
                userId
            );

            // Remove the first instance if it matches the current event date
            var firstInstance = eventInstances.FirstOrDefault(e => e.Date.Date == eventItem.Date.Date);
            if (firstInstance != null)
            {
                eventInstances.Remove(firstInstance);
            }

            if (eventInstances.Any())
            {
                _context.Events.AddRange(eventInstances);

                foreach (var instance in eventInstances)
                {
                    var participant = new EventParticipant
                    {
                        UserId = userId,
                        Event = instance,
                        Status = ParticipantStatus.Confirmed
                    };
                    _context.EventParticipants.Add(participant);
                }
            }
        }

        await _context.SaveChangesAsync();

        return Ok("Wydarzenie zaktualizowane pomyślnie.");
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
            return Forbid("Nie masz uprawnień do usunięcia tego wydarzenia.");
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

    [HttpDelete("{eventId}/participants/{participantId}")]
    public async Task<IActionResult> RemoveParticipant(int eventId, int participantId)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();
        var currentUserId = int.Parse(userIdClaim.Value);

        var eventItem = await _context.Events.FindAsync(eventId);
        if (eventItem == null) return NotFound("Wydarzenie nie istnieje.");

        bool isAdmin = User.IsInRole("Admin");
        if (eventItem.CreatorId != currentUserId && !isAdmin)
        {
            return Forbid("Nie masz uprawnień do usuwania uczestników z tego wydarzenia.");
        }

        var participant = await _context.EventParticipants
            .FirstOrDefaultAsync(ep => ep.EventId == eventId && ep.UserId == participantId);

        if (participant == null)
            return NotFound("Uczestnik nie został znaleziony na liście.");

        _context.EventParticipants.Remove(participant);
        await _context.SaveChangesAsync();

        return Ok("Uczestnik został usunięty.");
    }


    [HttpGet("{eventId}/is-participant")]
    public async Task<IActionResult> IsUserParticipant(int eventId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();
        var userId = int.Parse(userIdClaim.Value);

        var participant = await _context.EventParticipants
            .FirstOrDefaultAsync(ep => ep.EventId == eventId && ep.UserId == userId);

        if (participant == null)
        {
            return Ok(new { isParticipant = false, status = "" });
        }

        return Ok(new { isParticipant = true, status = participant.Status.ToString() });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetEvent(int id)
    {
        var eventItem = await _context.Events
            .Include(e => e.Creator)
            .Include(e => e.EventParticipants)
                .ThenInclude(ep => ep.User)
            .Include(e => e.RecurrenceGroup)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (eventItem == null) return NotFound("Wydarzenie nie istnieje.");

        return Ok(new
        {
            eventItem.Id,
            eventItem.Title,
            eventItem.Description,
            eventItem.Date,
            eventItem.Location,
            eventItem.City,
            eventItem.Latitude,
            eventItem.Longitude,
            eventItem.IsPrivate,
            eventItem.MaxParticipants,
            Category = eventItem.Category.ToString(),
            eventItem.CreatorId,
            Creator = eventItem.Creator != null ? new { eventItem.Creator.Email } : null,
            Participants = eventItem.EventParticipants.Select(ep => new
            {
                ep.UserId,
                Email = ep.User?.Email,
                Status = ep.Status.ToString()
            }).ToList(),
            ParticipantsCount = eventItem.EventParticipants.Count(ep => ep.Status == ParticipantStatus.Confirmed),
            Recurrence = eventItem.RecurrenceGroup == null ? null : new
            {
                eventItem.RecurrenceGroup.Type,
                eventItem.RecurrenceGroup.Interval,
                DaysOfWeek = eventItem.RecurrenceGroup.DaysOfWeek != null
                    ? System.Text.Json.JsonSerializer.Deserialize<int[]>(eventItem.RecurrenceGroup.DaysOfWeek)
                    : null,
                eventItem.RecurrenceGroup.EndDate,
                eventItem.RecurrenceGroup.MaxOccurrences
            },
            PendingRequestsCount = eventItem.EventParticipants.Count(ep => ep.Status == ParticipantStatus.Interested)
        });
    }

    [HttpGet("my-created")]
    public async Task<IActionResult> GetMyCreatedEvents()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();
        var userId = int.Parse(userIdClaim.Value);

        var now = DateTime.UtcNow;

        var events = await _context.Events
            .Include(e => e.RecurrenceGroup)
            .Include(e => e.EventParticipants)
            .Where(e => e.CreatorId == userId)
            .Where(e =>
                e.RecurrenceGroupId == null ||
                e.Id == (_context.Events
                    .Where(sub => sub.RecurrenceGroupId == e.RecurrenceGroupId && sub.Date >= now)
                    .OrderBy(sub => sub.Date)
                    .Select(sub => sub.Id)
                    .FirstOrDefault())
            )
            .OrderByDescending(e => e.Date)
            .ToListAsync();

        var result = events.Select(e => new
        {
            e.Id,
            e.Title,
            e.CreatorId, // Add this line
            e.Description,
            e.Date,
            e.Location,
            e.City,
            e.Latitude,
            e.Longitude,
            e.IsPrivate,
            e.MaxParticipants,
            Category = e.Category.ToString(),
            ParticipantsCount = e.EventParticipants.Count(ep => ep.Status == ParticipantStatus.Confirmed),
            PendingRequestsCount = e.EventParticipants.Count(ep => ep.Status == ParticipantStatus.Interested),
            IsRecurring = e.RecurrenceGroupId != null,
            Recurrence = e.RecurrenceGroup == null ? null : new
            {
                e.RecurrenceGroup.Type,
                e.RecurrenceGroup.Interval,
                DaysOfWeek = e.RecurrenceGroup.DaysOfWeek != null
                    ? System.Text.Json.JsonSerializer.Deserialize<int[]>(e.RecurrenceGroup.DaysOfWeek)
                    : null,
                e.RecurrenceGroup.EndDate,
                e.RecurrenceGroup.MaxOccurrences
            }
        });

        return Ok(result);
    }

    [HttpGet("my-joined")]
    public async Task<IActionResult> GetMyJoinedEvents()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();
        var userId = int.Parse(userIdClaim.Value);

        var events = await _context.Events
            .Where(e => e.CreatorId != userId && e.EventParticipants.Any(ep => ep.UserId == userId))
            .Include(e => e.Creator)
            .OrderByDescending(e => e.Date)
            .Select(e => new
            {
                e.Id,
                e.Title,
                e.Description,
                e.Date,
                e.Location,
                e.City,
                e.Latitude,
                e.Longitude,
                e.IsPrivate,
                MaxParticipants = e.MaxParticipants,
                Category = e.Category.ToString(),
                CreatorId = e.CreatorId,
                CreatorEmail = e.Creator != null ? e.Creator.Email : null,
                MyStatus = e.EventParticipants
                    .Where(ep => ep.UserId == userId)
                    .Select(ep => ep.Status.ToString())
                    .FirstOrDefault(),
                ParticipantsCount = e.EventParticipants.Count(ep => ep.Status == ParticipantStatus.Confirmed),
                IsRecurring = e.RecurrenceGroupId != null
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

        if (!date.HasValue)
        {
            var now = DateTime.UtcNow;
            query = query.Where(e =>
                e.RecurrenceGroupId == null ||
                e.Id == (_context.Events
                    .Where(sub => sub.RecurrenceGroupId == e.RecurrenceGroupId && sub.Date >= now)
                    .OrderBy(sub => sub.Date)
                    .Select(sub => sub.Id)
                    .FirstOrDefault())
            );
        }

        if (!string.IsNullOrEmpty(search))
        {
            search = search.ToLower();
            query = query.Where(e => e.Title.ToLower().Contains(search) ||
                                     e.Description.ToLower().Contains(search));
        }

        if (!string.IsNullOrEmpty(location))
        {
            location = location.ToLower();
            query = query.Where(e => e.City.ToLower().Contains(location));
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
                e.Latitude,
                e.Longitude,
                e.IsPrivate,
                e.MaxParticipants,
                Category = e.Category.ToString(),
                e.CreatorId,
                Creator = e.Creator != null ? new { e.Creator.Email } : null,
                Participants = e.EventParticipants.Select(ep => new { ep.UserId, Status = ep.Status.ToString() }).ToList(),
                ParticipantsCount = e.EventParticipants.Count(ep => ep.Status == ParticipantStatus.Confirmed),
                PendingRequestsCount = e.EventParticipants.Count(ep => ep.Status == ParticipantStatus.Interested),
                IsRecurring = e.RecurrenceGroupId != null
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

    [HttpGet("{eventId}/comments")]
    public async Task<IActionResult> GetComments(int eventId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();
        var userId = int.Parse(userIdClaim.Value);

        var isParticipant = await _context.EventParticipants
            .AnyAsync(ep => ep.EventId == eventId && ep.UserId == userId);

        if (!isParticipant)
        {
            return Forbid("Tylko uczestnicy mogą przeglądać komentarze.");
        }

        var comments = await _context.Comments
            .Where(c => c.EventId == eventId)
            .Include(c => c.User)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new
            {
                c.Id,
                c.Content,
                c.CreatedAt,
                c.UserId,
                UserEmail = c.User != null ? c.User.Email : "Użytkownik usunięty"
            })
            .ToListAsync();

        return Ok(comments);
    }

    [HttpPost("{eventId}/comments")]
    public async Task<IActionResult> PostComment(int eventId, [FromBody] CommentDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();
        var userId = int.Parse(userIdClaim.Value);

        var participant = await _context.EventParticipants
            .FirstOrDefaultAsync(ep => ep.EventId == eventId && ep.UserId == userId);

        if (participant == null || participant.Status != ParticipantStatus.Confirmed)
        {
            return Forbid("Tylko potwierdzeni uczestnicy mogą dodawać komentarze.");
        }

        var comment = new Comment
        {
            Content = dto.Content,
            EventId = eventId,
            UserId = userId
        };

        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        var commentToReturn = new
        {
            comment.Id,
            comment.Content,
            comment.CreatedAt,
            comment.UserId,
            UserEmail = (await _context.Users.FindAsync(userId))?.Email
        };

        return CreatedAtAction(nameof(GetComments), new { eventId = eventId }, commentToReturn);
    }

    [HttpPut("comments/{commentId}")]
    public async Task<IActionResult> UpdateComment(int commentId, [FromBody] UpdateCommentDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();
        var userId = int.Parse(userIdClaim.Value);

        var comment = await _context.Comments.FindAsync(commentId);
        if (comment == null) return NotFound("Komentarz nie istnieje.");

        if (comment.UserId != userId)
        {
            return Forbid("Nie możesz edytować cudzych komentarzy.");
        }

        comment.Content = dto.Content;
        await _context.SaveChangesAsync();

        return Ok(new { comment.Id, comment.Content, comment.CreatedAt, comment.UserId });
    }

    [HttpDelete("comments/{commentId}")]
    public async Task<IActionResult> DeleteComment(int commentId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();
        var userId = int.Parse(userIdClaim.Value);

        var comment = await _context.Comments.FindAsync(commentId);
        if (comment == null) return NotFound("Komentarz nie istnieje.");

        if (comment.UserId != userId)
        {
            return Forbid("Nie możesz usunąć cudzych komentarzy.");
        }

        _context.Comments.Remove(comment);
        await _context.SaveChangesAsync();

        return Ok("Komentarz usunięty.");
    }
}

public class CommentDto
{
    public string Content { get; set; }
}

public class UpdateCommentDto
{
    public string Content { get; set; }
}

public class CreateEventDto
{
    public string Title { get; set; }
    public string Description { get; set; }
    public DateTime Date { get; set; }
    public string Location { get; set; }
    public string City { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public bool IsPrivate { get; set; }
    public int MaxParticipants { get; set; }
    public EventCategory Category { get; set; }
    public RecurrenceDto? Recurrence { get; set; }
}

public class UpdateEventDto
{
    public string Title { get; set; }
    public string Description { get; set; }
    public DateTime Date { get; set; }
    public string Location { get; set; }
    public string City { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public bool IsPrivate { get; set; }
    public int MaxParticipants { get; set; }
    public EventCategory Category { get; set; }
    public RecurrenceDto? Recurrence { get; set; }
}

public class RecurrenceDto
{
    public int Type { get; set; }
    public int Interval { get; set; }
    public int[]? DaysOfWeek { get; set; }
    public DateTime? EndDate { get; set; }
    public int? MaxOccurrences { get; set; }
}

