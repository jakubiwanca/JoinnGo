using MimeKit;
using MailKit.Net.Smtp;
using MailKit.Security;

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
            var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "465");
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

            await SendEmailAsync(toEmail, subject, htmlContent, plainTextContent, smtpHost, smtpPort, smtpUsername, smtpPassword, senderEmail, senderName);
            _logger.LogInformation($"Email confirmation sent successfully to {toEmail}");
        }


        public async Task SendPasswordResetAsync(string toEmail, string resetToken)
        {
            var smtpHost = _configuration["Email:SmtpHost"] ?? "smtp.gmail.com";
            var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "465");
            var smtpUsername = _configuration["Email:SmtpUsername"];
            var smtpPassword = _configuration["Email:SmtpPassword"];
            var senderEmail = _configuration["Email:SenderEmail"] ?? smtpUsername;
            var senderName = _configuration["Email:SenderName"] ?? "Join'nGo";

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

            await SendEmailAsync(toEmail, subject, htmlContent, plainTextContent, smtpHost, smtpPort, smtpUsername, smtpPassword, senderEmail, senderName);
            _logger.LogInformation($"Password reset email sent successfully to {toEmail}");
        }

        private async Task SendEmailAsync(string to, string subject, string htmlBody, string textBody, string host, int port, string username, string password, string fromEmail, string fromName)
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, fromEmail));
            message.To.Add(MailboxAddress.Parse(to));
            message.Subject = subject;

            var builder = new BodyBuilder
            {
                HtmlBody = htmlBody,
                TextBody = textBody
            };
            message.Body = builder.ToMessageBody();

            using var client = new SmtpClient();
            try
            {
                var ipAddresses = await System.Net.Dns.GetHostAddressesAsync(host);
                var ipv4Addresses = ipAddresses.Where(ip => ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork).ToList();
                
                if (!ipv4Addresses.Any())
                {
                    ipv4Addresses.Add(System.Net.IPAddress.None); 
                }

                var finalPort = 465;
                var socketOptions = SecureSocketOptions.SslOnConnect;

                client.Timeout = 10000;
                client.CheckCertificateRevocation = false;
                client.ServerCertificateValidationCallback = (s, c, h, e) => true;

                bool connected = false;
                Exception lastException = null;

                foreach (var ip in ipv4Addresses)
                {
                    try
                    {
                        var target = ip.Equals(System.Net.IPAddress.None) ? host : ip.ToString();
                        await client.ConnectAsync(target, finalPort, socketOptions);
                        connected = true;
                        _logger.LogInformation($"Successfully connected to {target}:{finalPort}");
                        break;
                    }
                    catch (Exception ex)
                    {
                        lastException = ex;
                        _logger.LogWarning($"Failed to connect to {ip}:{finalPort}: {ex.Message}");
                        continue;
                    }
                }

                if (!connected)
                {
                    throw lastException ?? new Exception("Failed to connect to any resolved IP address.");
                }
                
                await client.AuthenticateAsync(username, password);

                await client.SendAsync(message);
                await client.DisconnectAsync(true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending email to {to}. Host: {host}");
                throw;
            }
        }
    }
}
