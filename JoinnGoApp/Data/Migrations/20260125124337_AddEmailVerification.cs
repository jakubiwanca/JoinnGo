using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JoinnGoApp.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailVerification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EmailConfirmationToken",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EmailConfirmationTokenExpiry",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EmailConfirmed",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.Sql(@"
                DELETE FROM ""EventParticipants"" 
                WHERE ""UserId"" IN (SELECT ""Id"" FROM ""Users"" WHERE ""Email"" != 'admin@example.com');
            ");
            
            migrationBuilder.Sql(@"
                DELETE FROM ""Comments"" 
                WHERE ""UserId"" IN (SELECT ""Id"" FROM ""Users"" WHERE ""Email"" != 'admin@example.com');
            ");
            
            migrationBuilder.Sql(@"
                DELETE FROM ""Events"" 
                WHERE ""CreatorId"" IN (SELECT ""Id"" FROM ""Users"" WHERE ""Email"" != 'admin@example.com');
            ");
            
            migrationBuilder.Sql(@"
                DELETE FROM ""Users"" 
                WHERE ""Email"" != 'admin@example.com';
            ");

            migrationBuilder.Sql(@"
                UPDATE ""Users"" 
                SET ""EmailConfirmed"" = true 
                WHERE ""Email"" = 'admin@example.com';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmailConfirmationToken",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "EmailConfirmationTokenExpiry",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "EmailConfirmed",
                table: "Users");
        }
    }
}
