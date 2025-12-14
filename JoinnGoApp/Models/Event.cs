public class Event
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public DateTime Date { get; set; }
    public string Location { get; set; }
    public string City { get; set; }
    public bool IsPrivate { get; set; }
    public int CreatorId { get; set; }
    public User Creator { get; set; }

    public List<EventParticipant> EventParticipants { get; set; }
}
