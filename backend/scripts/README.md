# Backend Scripts

This directory contains utility scripts for the backend application.

## Kanban & Calendar Seeding Script

The `seed-kanban-calendar.ts` script populates the database with realistic test data for the Kanban board and Calendar functionality.

### Features

- **Maintenance Requests**: Creates realistic maintenance requests with various statuses, priorities, and assignments
- **Calendar Events**: Generates calendar events for scheduled maintenance, meetings, and deadlines
- **Board Configuration**: Sets up the Kanban board with proper columns and workflow rules
- **Realistic Data**: Uses equipment names, technician assignments, and realistic scenarios
- **Configurable**: Easy to adjust the number of items and date ranges

### Usage

```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already done)
bun install

# Seed with default configuration (25 requests, 15 events)
bun run seed:kanban-calendar

# Clear all existing data
bun run seed:clear

# Run with specific stage
bun run seed:kanban-calendar -- --stage=test

# Clear data for specific stage
bun run seed:clear -- --stage=test
```

### Generated Data

#### Maintenance Requests (25 items)

- **Equipment**: Various industrial equipment (hydraulic presses, CNC machines, conveyor belts, etc.)
- **Statuses**: Distributed across New, In Progress, Repaired, and Scrap
- **Priorities**: Low, Medium, High, Critical
- **Assignments**: Realistic technician and team assignments
- **Dates**: Spread over the last 30 days to next 7 days
- **Details**: Realistic subjects, descriptions, and metadata

#### Calendar Events (15 items)

- **Event Types**: Preventive, Scheduled, Meeting, Deadline, Emergency
- **Durations**: 30 minutes to 4 hours
- **Assignments**: Technician and team assignments
- **Equipment Relations**: 60% of events are equipment-related
- **Dates**: Spread over the last 7 days to next 30 days
- **Attendees**: Multiple technicians per event

#### Board Configuration

- **Columns**: New, In Progress, Repaired, Scrap
- **Limits**: Configurable limits per column
- **Workflow Rules**: Proper status transition rules
- **Colors**: Visual color coding for each status

### Sample Data Examples

#### Equipment Types

- Hydraulic Press #1 (Manufacturing)
- CNC Machine #3 (Manufacturing)
- Conveyor Belt System (Material Handling)
- Industrial Boiler (HVAC)
- Air Compressor Unit (Pneumatic)
- Packaging Machine #2 (Packaging)
- Forklift #7 (Material Handling)
- Generator Backup Unit (Electrical)

#### Technician Teams

- Mechanical Team
- Electrical Team
- HVAC Team
- Automation Team
- Quality Team

#### Request Examples

- "Hydraulic leak detected on Hydraulic Press #1"
- "Temperature sensor malfunction in Industrial Boiler"
- "Belt replacement required for Conveyor Belt System"
- "Calibration needed for Quality Control Scanner"

### Configuration

You can modify the `SEED_CONFIG` object in the script to adjust:

```typescript
const SEED_CONFIG = {
  // Number of items to create
  maintenanceRequests: 25,
  calendarEvents: 15,

  // Date ranges
  requestDateRange: {
    startDays: -30, // 30 days ago
    endDays: 7, // 7 days from now
  },

  calendarDateRange: {
    startDays: -7, // 7 days ago
    endDays: 30, // 30 days from now
  },
};
```

### Database Schema

The script creates items following the single-table design pattern:

#### Maintenance Requests

- **PK**: `REQUEST#{id}`
- **SK**: `DETAILS`
- **GSI1PK**: `STATUS#{status}`
- **GSI1SK**: `CREATED#{timestamp}`
- **GSI2PK**: `EQUIPMENT#{category}`
- **GSI2SK**: `PRIORITY#{priority}`

#### Calendar Events

- **PK**: `CALENDAR#EVENT#{id}`
- **SK**: `DETAILS`
- **GSI1PK**: `DATE#{date}`
- **GSI1SK**: `EVENT#{id}`
- **GSI2PK**: `TYPE#{eventType}`
- **GSI2SK**: `START#{startTime}`

#### Board Configuration

- **PK**: `KANBAN#BOARD`
- **SK**: `CONFIG`
- **GSI1PK**: `BOARD_TYPE#MAIN`
- **GSI1SK**: `KANBAN#BOARD`

### Testing the Data

After seeding, you can test the Kanban and Calendar functionality:

1. **Kanban Board**: Visit the dashboard to see requests organized by status
2. **Calendar View**: Check the calendar for scheduled events
3. **Drag & Drop**: Test moving requests between columns
4. **Filtering**: Test various filters (team, priority, date range)
5. **Statistics**: Verify board statistics are calculated correctly

### Troubleshooting

#### Permission Errors

Make sure your AWS credentials have DynamoDB permissions:

```bash
aws sts get-caller-identity  # Verify credentials
```

#### Table Not Found

Ensure the DynamoDB table exists and the `DYNAMODB_TABLE` environment variable is set correctly.

#### TypeScript Errors

Make sure all dependencies are installed:

```bash
bun install
```

### Clean Up

To remove all seeded data:

```bash
bun run seed:clear
```

This will remove all maintenance requests, calendar events, and board configuration from the database.
