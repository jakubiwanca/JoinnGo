using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JoinnGoApp.Migrations
{
    /// <inheritdoc />
    public partial class AddCityToEvents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "Events",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "City",
                table: "Events");
        }
    }
}
