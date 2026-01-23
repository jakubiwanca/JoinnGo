using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace JoinnGoApp.Migrations
{
    /// <inheritdoc />
    public partial class AddRecurringEvents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "RecurrenceException",
                table: "Events",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "RecurrenceGroupId",
                table: "Events",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "RecurrenceGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CreatorId = table.Column<int>(type: "integer", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Interval = table.Column<int>(type: "integer", nullable: false),
                    DaysOfWeek = table.Column<string>(type: "text", nullable: true),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    MaxOccurrences = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecurrenceGroups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RecurrenceGroups_Users_CreatorId",
                        column: x => x.CreatorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Events_RecurrenceGroupId",
                table: "Events",
                column: "RecurrenceGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_RecurrenceGroups_CreatorId",
                table: "RecurrenceGroups",
                column: "CreatorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Events_RecurrenceGroups_RecurrenceGroupId",
                table: "Events",
                column: "RecurrenceGroupId",
                principalTable: "RecurrenceGroups",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Events_RecurrenceGroups_RecurrenceGroupId",
                table: "Events");

            migrationBuilder.DropTable(
                name: "RecurrenceGroups");

            migrationBuilder.DropIndex(
                name: "IX_Events_RecurrenceGroupId",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "RecurrenceException",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "RecurrenceGroupId",
                table: "Events");
        }
    }
}
