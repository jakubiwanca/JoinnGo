public class User
{
    public int Id { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }

    public string Role { get; set; } = "User";


    public List<EventParticipant> EventParticipants { get; set; } = new List<EventParticipant>();
}
