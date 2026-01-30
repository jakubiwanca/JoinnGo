using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using Microsoft.AspNetCore.Authorization;

[ApiController]
[Route("api/[controller]")]
[Authorize]
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
        
        client.DefaultRequestHeaders.UserAgent.ParseAdd("JoinnGoApp/1.0 (contact: [EMAIL_ADDRESS])");
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
