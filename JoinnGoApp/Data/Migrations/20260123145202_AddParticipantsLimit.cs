using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JoinnGoApp.Migrations
{
    /// <inheritdoc />
    public partial class AddParticipantsLimit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaxParticipants",
                table: "Events",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxParticipants",
                table: "Events");
        }
    }
}
