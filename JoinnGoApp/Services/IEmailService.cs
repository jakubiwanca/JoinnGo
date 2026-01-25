namespace JoinnGoApp.Services
{
    public interface IEmailService
    {
        Task SendEmailConfirmationAsync(string toEmail, string confirmationToken);
        Task SendPasswordResetAsync(string toEmail, string resetToken);
    }
}
