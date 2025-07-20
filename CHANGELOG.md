# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2025-07-20

### Added
- Goal progress reporting with `/r` command
- Autocomplete functionality for goal selection
- Support for completion type reports (yes/no + notes)
- Support for numeric type reports (value + notes)
- Goal reports database table with proper indexing
- Multiple daily reports support for the same goal

## [0.2.0] - 2025-07-20

### Added
- Goal types support (completion and numeric types)
- Custom units for numeric goals
- Proper database migration system with version tracking
- Interactive Modal forms for goal creation
- Goal type display in all goal listing commands

### Changed
- Redesigned goal creation flow to prevent Discord interaction timeouts
- Modified `/create goal` command to show type selection buttons first
- Updated goal display format to include type information
- Improved database connection handling with connection pooling

### Fixed
- Discord API timeout errors during goal creation
- Inconsistent goal type display between different commands
- Database schema management with proper migrations

## [0.1.0] - 2025-07-20

### Added
- Initial Discord bot setup with slash command support
- Basic goal creation with `/create goal` command
- Goal listing with `/show goals` command with pagination
- PostgreSQL database integration
- Environment configuration support
- Command deployment scripts for guild and global deployment

### Infrastructure
- Discord.js v14 implementation
- PostgreSQL database with connection pooling
- Modular command structure
- Error handling and logging
- Project documentation (CLAUDE.md, PROJECT_STATUS.md)

---

## Backlog

### Phase 2 - Goal Reporting
- [ ] Implement `/r` command with goal autocomplete
- [ ] Add progress tracking for completion goals (yes/no reports)
- [ ] Add progress tracking for numeric goals (value + optional note)
- [ ] Create goal_reports table for storing progress data
- [ ] Add report history viewing functionality

### Future Enhancements
- [ ] Goal editing functionality
- [ ] Goal deletion with confirmation
- [ ] Goal statistics and analytics
- [ ] Weekly/monthly progress summaries
- [ ] Goal sharing between users
- [ ] Reminder system for inactive goals
- [ ] Goal templates and categories
- [ ] Data export functionality
- [ ] Goal achievement badges/rewards