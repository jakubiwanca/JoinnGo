using System.Text;
using System.Text.Json;

namespace JoinnGoApp.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;
        private readonly HttpClient _httpClient;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger, IHttpClientFactory httpClientFactory)
        {
            _configuration = configuration;
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient();
        }

        public async Task SendEmailConfirmationAsync(string toEmail, string confirmationToken)
        {
            var frontendUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:3000";
            var confirmationLink = $"{frontendUrl}/confirm-email?token={confirmationToken}";

            _logger.LogInformation($"Sending confirmation email to {toEmail} with frontend URL: {frontendUrl}");

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

            await SendEmailAsync(toEmail, subject, htmlContent, plainTextContent);
            _logger.LogInformation($"Email confirmation sent successfully to {toEmail}");
        }


        public async Task SendPasswordResetAsync(string toEmail, string resetToken)
        {
            var frontendUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:3000";
            var resetLink = $"{frontendUrl}/reset-password?token={resetToken}";

            var subject = "Resetowanie hasła - Join'nGo";
            
            var htmlContent = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background-color: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                        .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
                        .button {{ display: inline-block; padding: 12px 30px; background-color: #ef4444; color: #ffffff !important; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }}
                        .footer {{ margin-top: 20px; font-size: 12px; color: #6b7280; text-align: center; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h1>🔑 Resetowanie hasła</h1>
                        </div>
                        <div class='content'>
                            <p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w Join'nGo.</p>
                            <p>Aby ustawić nowe hasło, kliknij w poniższy przycisk:</p>
                            <div style='text-align: center;'>
                                <a href='{resetLink}' class='button' style='display: inline-block; padding: 12px 30px; background-color: #ef4444; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold;'>
                                    <span style='color: #ffffff !important;'>Zresetuj hasło</span>
                                </a>
                            </div>
                            <p style='color: #6b7280; font-size: 14px;'>
                                Jeśli to nie Ty prosiłeś o reset hasła, możesz bezpiecznie zignorować tę wiadomość.
                                Twoje hasło pozostanie bez zmian.
                            </p>
                            <p style='color: #6b7280; font-size: 12px; margin-top: 20px;'>
                                Link jest ważny przez 1 godzinę.
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
Resetowanie hasła - Join'nGo

Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w Join'nGo.
Aby ustawić nowe hasło, odwiedź poniższy link:
{resetLink}

Link jest ważny przez 1 godzinę.

Jeśli to nie Ty prosiłeś o reset hasła, możesz bezpiecznie zignorować tę wiadomość.

© 2026 Join'nGo. Wszystkie prawa zastrzeżone.
            ";

            await SendEmailAsync(toEmail, subject, htmlContent, plainTextContent);
            _logger.LogInformation($"Password reset email sent successfully to {toEmail}");
        }

        private async Task SendEmailAsync(string to, string subject, string htmlBody, string textBody)
        {
            var apiKey = _configuration["Brevo:ApiKey"];
            var senderEmail = _configuration["Email:SenderEmail"];
            var senderName = _configuration["Email:SenderName"] ?? "Join'nGo";

            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogError("Brevo API Key is not configured");
                throw new InvalidOperationException("Brevo API Key is missing");
            }

            var payload = new
            {
                sender = new { name = senderName, email = senderEmail },
                to = new[] { new { email = to } },
                subject = subject,
                htmlContent = htmlBody,
                textContent = textBody
            };

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("api-key", apiKey);
            _httpClient.DefaultRequestHeaders.Add("accept", "application/json");

            try
            {
                var response = await _httpClient.PostAsync("https://api.brevo.com/v3/smtp/email", content);
                
                if (!response.IsSuccessStatusCode)
                {
                    var errorBody = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Brevo API error: {response.StatusCode} - {errorBody}");
                    throw new HttpRequestException($"Failed to send email via Brevo: {response.StatusCode}");
                }

                _logger.LogInformation($"Email sent successfully to {to} via Brevo API");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending email to {to} via Brevo API");
                throw;
            }
        }
    }
}
