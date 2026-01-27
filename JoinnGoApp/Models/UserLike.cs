using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JoinnGoApp.Models
{
    public class UserLike
    {
        public int ObserverId { get; set; }
        public User Observer { get; set; }

        public int TargetId { get; set; }
        public User Target { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
