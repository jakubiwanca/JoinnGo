using System;
using System.Collections.Generic;

namespace JoinnGoApp.Models
{
    public enum RecurrenceType
    {
        None = 0,
        Weekly = 1,
        Monthly = 2
    }

    public class RecurrenceGroup
    {
        public int Id { get; set; }
        public int CreatorId { get; set; }
        public User Creator { get; set; }

        public RecurrenceType Type { get; set; }
        public int Interval { get; set; }
        public string? DaysOfWeek { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? MaxOccurrences { get; set; }

        public ICollection<Event> Events { get; set; } = new List<Event>();
    }
}
