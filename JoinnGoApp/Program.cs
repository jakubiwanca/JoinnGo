using Microsoft.EntityFrameworkCore;
using JoinnGoApp.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using Microsoft.AspNetCore.Identity;
using DotNetEnv;

Env.Load();

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
{
    ["ConnectionStrings:DefaultConnection"] = $"Host={Env.GetString("DB_HOST", "localhost")};Port={Env.GetString("DB_PORT", "5432")};Database={Env.GetString("DB_NAME", "JoinnGoDb")};Username={Env.GetString("DB_USERNAME", "postgres")};Password={Env.GetString("DB_PASSWORD", "postgres")}",
    ["Email:SmtpHost"] = Env.GetString("SMTP_HOST", "smtp.gmail.com"),
    ["Email:SmtpPort"] = Env.GetString("SMTP_PORT", "587"),
    ["Email:SmtpUsername"] = Env.GetString("SMTP_USERNAME", ""),
    ["Email:SmtpPassword"] = Env.GetString("SMTP_PASSWORD", ""),
    ["Email:SenderEmail"] = Env.GetString("SENDER_EMAIL", ""),
    ["Email:SenderName"] = Env.GetString("SENDER_NAME", "Join'nGo"),
    ["Jwt:Key"] = Env.GetString("JWT_KEY", "default_jwt_key_32_characters_min"),
    ["Jwt:Issuer"] = Env.GetString("JWT_ISSUER", "JoinnGoApp"),
    ["Jwt:Audience"] = Env.GetString("JWT_AUDIENCE", "JoinnGoAppUsers"),
    ["Jwt:ExpiresInMinutes"] = Env.GetString("JWT_EXPIRES_MINUTES", "60"),
    ["Frontend:BaseUrl"] = Env.GetString("FRONTEND_URL", "http://localhost:3000"),
});

builder.Services.AddDbContext<MyDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<JoinnGoApp.Services.RecurrenceService>();
builder.Services.AddTransient<JoinnGoApp.Services.IEmailService, JoinnGoApp.Services.EmailService>();

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

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy => policy
            .WithOrigins("http://localhost:3000")
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
    try
    {
        var context = services.GetRequiredService<MyDbContext>();
        JoinnGoApp.Data.DbInitializer.Initialize(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred creating the DB.");
    }
}

app.Run();
