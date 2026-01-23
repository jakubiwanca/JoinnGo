using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using JoinnGoApp.Models;

namespace JoinnGoApp.Services
{
    public class RecurrenceService
    {
        private const int MaxMonthsAhead = 3;

        public List<DateTime> GenerateOccurrences(RecurrenceGroup recurrenceGroup)
        {
            var occurrences = new List<DateTime>();
            var currentDate = recurrenceGroup.StartDate.Date;
            var endDate = CalculateEndDate(recurrenceGroup);
            var maxDate = DateTime.UtcNow.AddMonths(MaxMonthsAhead).Date;

            var effectiveEndDate = endDate.HasValue && endDate.Value < maxDate 
                ? endDate.Value 
                : maxDate;

            int count = 0;

            while (currentDate <= effectiveEndDate)
            {
                if (recurrenceGroup.MaxOccurrences.HasValue && count >= recurrenceGroup.MaxOccurrences.Value)
                {
                    break;
                }

                if (ShouldIncludeDate(currentDate, recurrenceGroup))
                {
                    occurrences.Add(currentDate);
                    count++;
                }

                currentDate = GetNextDate(currentDate, recurrenceGroup);
            }

            return occurrences;
        }

        private DateTime? CalculateEndDate(RecurrenceGroup recurrenceGroup)
        {
            if (recurrenceGroup.EndDate.HasValue)
            {
                return recurrenceGroup.EndDate.Value.Date;
            }

            return null;
        }

        private bool ShouldIncludeDate(DateTime date, RecurrenceGroup recurrenceGroup)
        {
            if (recurrenceGroup.Type == RecurrenceType.Weekly)
            {
                if (string.IsNullOrEmpty(recurrenceGroup.DaysOfWeek))
                {
                    return false;
                }

                var daysArray = JsonSerializer.Deserialize<int[]>(recurrenceGroup.DaysOfWeek);
                if (daysArray == null || daysArray.Length == 0)
                {
                    return false;
                }

                // DayOfWeek: Sunday = 0, Monday = 1, ..., Saturday = 6
                var dayOfWeek = (int)date.DayOfWeek;
                return daysArray.Contains(dayOfWeek);
            }
            else if (recurrenceGroup.Type == RecurrenceType.Monthly)
            {
                return date.Day == recurrenceGroup.StartDate.Day;
            }

            return false;
        }

        private DateTime GetNextDate(DateTime currentDate, RecurrenceGroup recurrenceGroup)
        {
            if (recurrenceGroup.Type == RecurrenceType.Weekly)
            {
                return currentDate.AddDays(1);
            }
            else if (recurrenceGroup.Type == RecurrenceType.Monthly)
            {
                return currentDate.AddMonths(recurrenceGroup.Interval);
            }

            return currentDate.AddDays(1);
        }

        public List<Event> CreateEventInstances(
            RecurrenceGroup recurrenceGroup,
            Event templateEvent,
            int creatorId)
        {
            var occurrences = GenerateOccurrences(recurrenceGroup);
            var events = new List<Event>();

            var templateTime = templateEvent.Date.TimeOfDay;

            foreach (var occurrenceDate in occurrences)
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
                    CreatorId = creatorId,
                    RecurrenceGroupId = recurrenceGroup.Id,
                    RecurrenceException = false
                };

                events.Add(newEvent);
            }

            return events;
        }
    }
}
