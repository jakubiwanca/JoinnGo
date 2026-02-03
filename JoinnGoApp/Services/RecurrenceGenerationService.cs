using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using JoinnGoApp.Data;
using JoinnGoApp.Models;

namespace JoinnGoApp.Services
{
    public class RecurrenceGenerationService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<RecurrenceGenerationService> _logger;

        public RecurrenceGenerationService(
            IServiceProvider serviceProvider,
            ILogger<RecurrenceGenerationService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("RecurrenceGenerationService started");

            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await GenerateUpcomingInstances();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in RecurrenceGenerationService");
                }

                await Task.Delay(TimeSpan.FromDays(1), stoppingToken);
            }
        }

        private async Task GenerateUpcomingInstances()
        {
            _logger.LogInformation("Starting automatic recurrence instance generation");

            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MyDbContext>();
            var recurrenceService = scope.ServiceProvider.GetRequiredService<RecurrenceService>();

            var activeGroups = await context.RecurrenceGroups
                .Where(g => !g.EndDate.HasValue || g.EndDate.Value > DateTime.UtcNow)
                .ToListAsync();

            _logger.LogInformation("Found {Count} active recurrence groups", activeGroups.Count);

            int totalGenerated = 0;

            foreach (var group in activeGroups)
            {
                try
                {
                    var existingDates = await context.Events
                        .Where(e => e.RecurrenceGroupId == group.Id)
                        .Select(e => e.Date.Date)
                        .ToListAsync();
                    var templateEvent = await context.Events
                        .Where(e => e.RecurrenceGroupId == group.Id)
                        .OrderBy(e => e.Date)
                        .FirstOrDefaultAsync();

                    if (templateEvent == null)
                    {
                        _logger.LogWarning($"No template event found for RecurrenceGroup {group.Id}");
                        continue;
                    }

                    // generuj wystapienia na nastepne 2 tygodnie
                    var potentialOccurrences = recurrenceService.GenerateOccurrences(group);

                    // usuń wystapienia które już istnieją
                    var newOccurrences = potentialOccurrences
                        .Where(date => !existingDates.Contains(date.Date))
                        .ToList();

                    if (newOccurrences.Count == 0)
                    {
                        continue; // No new instances needed
                    }

                    var templateTime = templateEvent.Date.TimeOfDay;

                    foreach (var occurrenceDate in newOccurrences)
                    {
                        var eventDate = DateTime.SpecifyKind(
                            occurrenceDate.Add(templateTime),
                            DateTimeKind.Utc
                        );

                        var newEvent = new Event
                        {
                            Title = templateEvent.Title,
                            Description = templateEvent.Description,
                            Date = eventDate,
                            Location = templateEvent.Location,
                            City = templateEvent.City,
                            Latitude = templateEvent.Latitude,
                            Longitude = templateEvent.Longitude,
                            IsPrivate = templateEvent.IsPrivate,
                            Category = templateEvent.Category,
                            MaxParticipants = templateEvent.MaxParticipants,
                            CreatorId = group.CreatorId,
                            RecurrenceGroupId = group.Id,
                            RecurrenceException = false
                        };

                        context.Events.Add(newEvent);
                        totalGenerated++;
                    }

                    _logger.LogInformation($"Generated {newOccurrences.Count} new instances for RecurrenceGroup {group.Id}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error generating instances for RecurrenceGroup {group.Id}");
                }
            }

            if (totalGenerated > 0)
            {
                await context.SaveChangesAsync();
                _logger.LogInformation($"Successfully generated {totalGenerated} total new event instances");
            }
            else
            {
                _logger.LogInformation("No new instances needed");
            }
        }
    }
}
