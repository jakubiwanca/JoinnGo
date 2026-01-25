using System.Net;
using System.Net.Mail;

namespace JoinnGoApp.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailConfirmationAsync(string toEmail, string confirmationToken)
        {
            var smtpHost = _configuration["Email:SmtpHost"] ?? "smtp.gmail.com";
            var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
            var smtpUsername = _configuration["Email:SmtpUsername"];
            var smtpPassword = _configuration["Email:SmtpPassword"];
            var senderEmail = _configuration["Email:SenderEmail"] ?? smtpUsername;
            var senderName = _configuration["Email:SenderName"] ?? "Join'nGo";

            var frontendUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:3000";
            var confirmationLink = $"{frontendUrl}/confirm-email?token={confirmationToken}";

            var subject = "Potwierdź swój adres email - Join'nGo";
            
            var htmlContent = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                        .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
                        .button {{ display: inline-block; padding: 12px 30px; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }}
                        .footer {{ margin-top: 20px; font-size: 12px; color: #6b7280; text-align: center; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h1>🎉 Witaj w Join'nGo!</h1>
                        </div>
                        <div class='content'>
                            <p>Dziękujemy za rejestrację!</p>
                            <p>Aby aktywować swoje konto, kliknij w poniższy przycisk:</p>
                            <div style='text-align: center;'>
                                <a href='{confirmationLink}' class='button' style='display: inline-block; padding: 12px 30px; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold;'>
                                    <span style='color: #ffffff !important;'>Potwierdź adres email</span>
                                </a>
                            </div>
                            <p style='color: #6b7280; font-size: 14px;'>
                                Jeśli nie zakładałeś konta w Join'nGo, zignoruj ten email.
                            </p>
                            <p style='color: #6b7280; font-size: 12px; margin-top: 20px;'>
                                Link jest ważny przez 24 godziny.
                            </p>
                        </div>
                        <div class='footer'>
                            <p>© 2026 Join'nGo. Wszystkie prawa zastrzeżone.</p>
                        </div>
                    </div>
                </body>
                </html>
            ";

            var plainTextContent = $@"
Witaj w Join'nGo!

Dziękujemy za rejestrację!

Aby aktywować swoje konto, odwiedź poniższy link:
{confirmationLink}

Link jest ważny przez 24 godziny.

Jeśli nie zakładałeś konta w Join'nGo, zignoruj ten email.

© 2026 Join'nGo. Wszystkie prawa zastrzeżone.
            ";

            try
            {
                using var smtpClient = new SmtpClient(smtpHost, smtpPort)
                {
                    EnableSsl = true,
                    Credentials = new NetworkCredential(smtpUsername, smtpPassword)
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(senderEmail, senderName),
                    Subject = subject,
                    Body = htmlContent,
                    IsBodyHtml = true
                };

                mailMessage.To.Add(toEmail);

                await smtpClient.SendMailAsync(mailMessage);
                _logger.LogInformation($"Email confirmation sent successfully to {toEmail}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending email confirmation to {toEmail}");
                throw;
            }
        }
    }
}
