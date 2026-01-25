using System.Collections.Generic;

namespace JoinnGoApp.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public string? Username { get; set; }

        public string Role { get; set; } = "User";

        public bool EmailConfirmed { get; set; } = false;
        public string? EmailConfirmationToken { get; set; }
        public DateTime? EmailConfirmationTokenExpiry { get; set; }

        public List<EventParticipant> EventParticipants { get; set; } = new List<EventParticipant>();
        public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    }
}
