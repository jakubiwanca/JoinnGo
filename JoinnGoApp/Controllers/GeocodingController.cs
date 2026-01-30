using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using Microsoft.AspNetCore.Authorization;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class GeocodingController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;

    public GeocodingController(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string q)
    {
        if (string.IsNullOrEmpty(q)) return BadRequest("Query is required");

        var client = _httpClientFactory.CreateClient();
        
        client.DefaultRequestHeaders.UserAgent.Clear();
        client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 JoinnGoApp/1.0");
        client.DefaultRequestHeaders.Add("Accept", "application/json");
        client.DefaultRequestHeaders.Add("Referer", "https://github.com/jakubiwanca/JoinnGo");
        client.DefaultRequestHeaders.AcceptLanguage.Add(new StringWithQualityHeaderValue("pl"));

        var url = $"https://nominatim.openstreetmap.org/search?format=json&q={Uri.EscapeDataString(q)}&addressdetails=1&limit=10&countrycodes=pl";

        try
        {
            var response = await client.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                return StatusCode((int)response.StatusCode, $"Error from Nominatim: {errorContent}");
            }

            var content = await response.Content.ReadAsStringAsync();
            return Content(content, "application/json");
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
}
