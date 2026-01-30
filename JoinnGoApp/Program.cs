using Microsoft.EntityFrameworkCore;
using JoinnGoApp.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using Microsoft.AspNetCore.Identity;
using DotNetEnv;

if (File.Exists(".env"))
{
    Env.Load();
}

var builder = WebApplication.CreateBuilder(args);

string GetEnvVar(string key, string defaultValue = "")
{
    return Environment.GetEnvironmentVariable(key) 
           ?? Env.GetString(key, defaultValue);
}

builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
{
    ["ConnectionStrings:DefaultConnection"] = $"Host={GetEnvVar("DB_HOST", "localhost")};Port={GetEnvVar("DB_PORT", "5432")};Database={GetEnvVar("DB_NAME", "JoinnGoDb")};Username={GetEnvVar("DB_USERNAME", "postgres")};Password={GetEnvVar("DB_PASSWORD", "postgres")}",
    ["Email:SmtpHost"] = GetEnvVar("SMTP_HOST", "smtp.gmail.com"),
    ["Email:SmtpPort"] = GetEnvVar("SMTP_PORT", "587"),
    ["Email:SmtpUsername"] = GetEnvVar("SMTP_USERNAME", ""),
    ["Email:SmtpPassword"] = GetEnvVar("SMTP_PASSWORD", ""),
    ["Email:SenderEmail"] = GetEnvVar("SENDER_EMAIL", ""),
    ["Email:SenderName"] = GetEnvVar("SENDER_NAME", "Join'nGo"),
    ["Jwt:Key"] = GetEnvVar("JWT_KEY", "default_jwt_key_32_characters_min"),
    ["Jwt:Issuer"] = GetEnvVar("JWT_ISSUER", "JoinnGoApp"),
    ["Jwt:Audience"] = GetEnvVar("JWT_AUDIENCE", "JoinnGoAppUsers"),
    ["Jwt:ExpiresInMinutes"] = GetEnvVar("JWT_EXPIRES_MINUTES", "60"),
    ["Frontend:BaseUrl"] = GetEnvVar("FRONTEND_URL", "http://localhost:3000"),
});

builder.Services.AddDbContext<MyDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<JoinnGoApp.Services.RecurrenceService>();
builder.Services.AddTransient<JoinnGoApp.Services.IEmailService, JoinnGoApp.Services.EmailService>();
builder.Services.AddHttpClient();

var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"],
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero,
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var token = context.Request.Cookies["jwt"];
            if (!string.IsNullOrEmpty(token))
            {
                context.Token = token;
            }
            return Task.CompletedTask;
        }
    };
});

var frontendUrl = builder.Configuration["Frontend:BaseUrl"] ?? "http://localhost:3000";
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy => policy
            .WithOrigins(
                frontendUrl, 
                "http://localhost",
                "http://localhost:3000",
                "http://127.0.0.1",
                "http://127.0.0.1:3000"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "JoinnGoApp API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Wprowadź token w formacie: Bearer {twój_token}",
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "JoinnGoApp API v1");
    });
}

app.UseCors("AllowReactApp");

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var context = services.GetRequiredService<MyDbContext>();
        int retries = 5;
        while (retries > 0)
        {
            try 
            {
                JoinnGoApp.Data.DbInitializer.Initialize(context);
                break; 
            }
            catch (Npgsql.PostgresException) 
            {
                retries--;
                if (retries == 0) throw;
                logger.LogWarning($"Database not ready yet. Retrying in 2 seconds... ({5-retries}/5)");
                System.Threading.Thread.Sleep(2000);
            }
            catch (System.Net.Sockets.SocketException) 
            {
                retries--;
                if (retries == 0) throw;
                logger.LogWarning($"Database connection refused. Retrying in 2 seconds... ({5-retries}/5)");
                System.Threading.Thread.Sleep(2000);
            }
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred creating the DB.");
    }
}

app.Run();
