# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

本專案為 12 週挑戰進度追蹤系統，透過 Discord bot 的 slash commands 提供使用者快速記錄與查詢挑戰進度的功能。

詳細專案狀態請參考 `PROJECT_STATUS.md`。

## Commands

- **Run the bot**: `npm run dev` or `node index.js`
- **Deploy commands to specific guild**: `node deploy-commands.js`
- **Deploy commands globally**: `node deploy-global-commands.js`
- **Install dependencies**: `pnpm install` (uses pnpm as package manager)

## Environment Setup

The bot requires a `.env` file with:
- `DISCORD_TOKEN`: Bot token from Discord Developer Portal
- `CLIENT_ID`: Application ID from Discord Developer Portal
- `GUILD_ID`: Server ID for guild-specific command deployment
- `DATABASE_URL`: PostgreSQL connection string (e.g., `postgresql://user:password@localhost:5432/dbname`)

## Architecture

This is a Discord.js v14 bot with slash command support:

- **Entry point**: `index.js` - Main bot file that sets up the client, loads commands, and handles interactions
- **Command structure**: Commands are organized in `commands/` directory by category (e.g., `utility/`)
- **Command deployment**: Two deployment scripts for different scopes:
  - `deploy-commands.js`: Deploys to a specific guild (faster, for testing)
  - `deploy-global-commands.js`: Deploys globally (takes up to 1 hour to propagate)

### Command System

Commands follow this structure:
- Must export `data` (SlashCommandBuilder) and `execute` (async function)
- Located in `commands/{category}/{command}.js`
- Automatically loaded by the command handler in `index.js`
- Example: `commands/utility/ping.js`

The bot uses a Collection to store commands and dynamically loads all `.js` files from command folders. Error handling is built-in for command execution failures.

### Data Persistence

- **Database**: PostgreSQL for persistent data storage
- **Database module**: `database.js` handles all database operations
- **Tables**: 
  - `goals`: Stores user goals with unique IDs, names, descriptions, and timestamps
- **Connection**: Uses connection pooling for efficient database access

## Project Management

- Use `CHANGELOG.md` to record any feature changes and backlog items
- Update `package.json` version with each update

## Requirements Clarification

- 當需求提出時，根據 @docs/features/_template.md 提問直到釐清需求為止