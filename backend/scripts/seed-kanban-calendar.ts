#!/usr/bin/env ts-node

/**
 * Kanban & Calendar Seeding Script
 *
 * Seeds the database with realistic maintenance requests and calendar events
 * for testing the Kanban board and Calendar functionality.
 *
 * Usage:
 *   npm run seed:kanban-calendar
 *   npm run seed:kanban-calendar -- --stage test
 *   npm run seed:kanban-calendar -- --clear
 */

import { dynamodb } from '../src/shared/clients/dynamodb';
import { logger } from '../src/shared/logger';
import { execSync } from 'child_process';

// =============================================================================
// AWS CREDENTIALS SETUP
// =============================================================================

/**
 * Assume DevRole for AWS access (same as deploy.sh)
 */
async function setupAWSCredentials(): Promise<void> {
  // Check if running in CI environment
  if (process.env.CI || process.env.GITHUB_ACTIONS) {
    logger.info('🔍 Running in CI environment - using existing credentials');
    return;
  }

  // Local development - assume DevRole
  const AWS_PROFILE = process.env.AWS_PROFILE || 'heetvakharia';
  const DEV_ROLE_ARN = 'arn:aws:iam::739689500485:role/DevRole';

  logger.info('🔐 Assuming DevRole for AWS access...');
  logger.info(`Using AWS Profile: ${AWS_PROFILE}`);

  try {
    // Assume role and get temporary credentials
    const assumeRoleCommand = `aws sts assume-role --role-arn "${DEV_ROLE_ARN}" --role-session-name "seed-script-$(date +%s)" --profile "${AWS_PROFILE}" --output json`;
    const assumeRoleOutput = execSync(assumeRoleCommand, { encoding: 'utf8' });
    const credentials = JSON.parse(assumeRoleOutput);

    // Set environment variables for AWS SDK
    process.env.AWS_ACCESS_KEY_ID = credentials.Credentials.AccessKeyId;
    process.env.AWS_SECRET_ACCESS_KEY = credentials.Credentials.SecretAccessKey;
    process.env.AWS_SESSION_TOKEN = credentials.Credentials.SessionToken;

    // Unset AWS_PROFILE to ensure we use the exported credentials
    delete process.env.AWS_PROFILE;

    // Verify credentials work
    const callerIdentity = execSync('aws sts get-caller-identity --output json', {
      encoding: 'utf8',
    });
    const identity = JSON.parse(callerIdentity);

    logger.info('✅ Successfully assumed DevRole');
    logger.info(`Verified credentials: ${identity.Arn}`);
  } catch (error) {
    logger.error('❌ Failed to assume DevRole:', error);
    throw new Error('Failed to setup AWS credentials');
  }
}

// =============================================================================
// CONFIGURATION
// =============================================================================

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

// =============================================================================
// SAMPLE DATA
// =============================================================================

const EQUIPMENT_DATA = [
  { name: 'Hydraulic Press #1', category: 'Manufacturing', location: 'Factory Floor A' },
  { name: 'CNC Machine #3', category: 'Manufacturing', location: 'Factory Floor B' },
  { name: 'Conveyor Belt System', category: 'Material Handling', location: 'Warehouse' },
  { name: 'Industrial Boiler', category: 'HVAC', location: 'Utility Room' },
  { name: 'Air Compressor Unit', category: 'Pneumatic', location: 'Compressor Room' },
  { name: 'Packaging Machine #2', category: 'Packaging', location: 'Packaging Line' },
  { name: 'Forklift #7', category: 'Material Handling', location: 'Warehouse' },
  { name: 'Generator Backup Unit', category: 'Electrical', location: 'Power Room' },
  { name: 'Cooling Tower', category: 'HVAC', location: 'Rooftop' },
  { name: 'Welding Station #4', category: 'Manufacturing', location: 'Welding Bay' },
  { name: 'Quality Control Scanner', category: 'Testing', location: 'QC Lab' },
  { name: 'Robotic Arm #2', category: 'Automation', location: 'Assembly Line' },
];

const TECHNICIANS = [
  { id: 'tech-001', name: 'John Martinez', team: 'Mechanical Team', avatar: null },
  { id: 'tech-002', name: 'Sarah Chen', team: 'Electrical Team', avatar: null },
  { id: 'tech-003', name: 'Mike Johnson', team: 'HVAC Team', avatar: null },
  { id: 'tech-004', name: 'Lisa Rodriguez', team: 'Mechanical Team', avatar: null },
  { id: 'tech-005', name: 'David Kim', team: 'Automation Team', avatar: null },
  { id: 'tech-006', name: 'Emma Wilson', team: 'Quality Team', avatar: null },
];

const TEAMS = [
  'Mechanical Team',
  'Electrical Team',
  'HVAC Team',
  'Automation Team',
  'Quality Team',
];

const REQUEST_SUBJECTS = [
  'Hydraulic leak detected',
  'Unusual noise during operation',
  'Temperature sensor malfunction',
  'Belt replacement required',
  'Calibration needed',
  'Safety guard damaged',
  'Motor overheating',
  'Pressure readings abnormal',
  'Scheduled maintenance due',
  'Emergency repair needed',
  'Performance degradation',
  'Electrical fault detected',
  'Vibration levels high',
  'Filter replacement',
  'Lubrication service',
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
const STATUSES = ['New', 'In Progress', 'Repaired', 'Scrap'] as const;
const EVENT_TYPES = ['Preventive', 'Scheduled', 'Meeting', 'Deadline', 'Emergency'] as const;
const EVENT_STATUSES = ['Scheduled', 'InProgress', 'Completed', 'Cancelled'] as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate a random date within a range
 */
function randomDate(startDays: number, endDays: number): Date {
  const now = new Date();
  const start = new Date(now.getTime() + startDays * 24 * 60 * 60 * 1000);
  const end = new Date(now.getTime() + endDays * 24 * 60 * 60 * 1000);

  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Generate a random UUID-like string
 */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get random item from array
 */
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get random items from array
 */
function randomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Generate random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// =============================================================================
// DATA GENERATORS
// =============================================================================

/**
 * Generate a maintenance request
 */
function generateMaintenanceRequest(): any {
  const equipment = randomItem(EQUIPMENT_DATA);
  const technician = Math.random() > 0.3 ? randomItem(TECHNICIANS) : null; // 70% chance of assignment
  const createdAt = randomDate(SEED_CONFIG.requestDateRange.startDays, -1);
  const scheduledDate =
    Math.random() > 0.4 ? randomDate(-1, SEED_CONFIG.requestDateRange.endDays) : null;
  const priority = randomItem(PRIORITIES);
  const status = randomItem(STATUSES);

  // Generate realistic descriptions based on equipment and subject
  const subject = randomItem(REQUEST_SUBJECTS);
  const descriptions = [
    `${equipment.name} in ${equipment.location} requires attention. ${subject.toLowerCase()}.`,
    `Maintenance team reported issues with ${equipment.name}. Immediate inspection recommended.`,
    `Routine inspection revealed potential problems with ${equipment.name}. Please investigate.`,
    `${subject} on ${equipment.name}. Equipment currently operational but monitoring required.`,
  ];

  const id = generateId();

  return {
    PK: `REQUEST#${id}`,
    SK: 'DETAILS',
    GSI1PK: `STATUS#${status}`,
    GSI1SK: `CREATED#${createdAt.toISOString()}`,
    GSI2PK: `EQUIPMENT#${equipment.category}`,
    GSI2SK: `PRIORITY#${priority}`,

    // Request details
    id,
    subject,
    description: randomItem(descriptions),
    equipmentName: equipment.name,
    equipmentCategory: equipment.category,
    equipmentLocation: equipment.location,
    priority,
    status,

    // Assignment
    assignedTechnician: technician?.id,
    assignedTechnicianName: technician?.name,
    assignedTeam: technician?.team || randomItem(TEAMS),

    // Timestamps
    createdAt: createdAt.toISOString(),
    updatedAt: new Date().toISOString(),
    scheduledDate: scheduledDate?.toISOString(),

    // Additional fields
    estimatedHours: randomInt(1, 8),
    hoursSpent: status === 'Repaired' ? randomInt(1, 6) : 0,
    tags: randomItems(
      ['urgent', 'safety', 'routine', 'electrical', 'mechanical', 'preventive'],
      randomInt(0, 3)
    ),
    equipmentHealthScore: randomInt(60, 95),

    // Metadata
    createdBy: 'system-seed',
    updatedBy: technician?.id || 'system',
  };
}

/**
 * Generate a calendar event
 */
function generateCalendarEvent(): any {
  const equipment = Math.random() > 0.4 ? randomItem(EQUIPMENT_DATA) : null; // 60% chance of equipment relation
  const technician = randomItem(TECHNICIANS);
  const eventType = randomItem(EVENT_TYPES);
  const priority = randomItem(PRIORITIES);
  const status = randomItem(EVENT_STATUSES);

  const startTime = randomDate(
    SEED_CONFIG.calendarDateRange.startDays,
    SEED_CONFIG.calendarDateRange.endDays
  );
  const duration = randomInt(30, 240); // 30 minutes to 4 hours
  const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

  // Generate realistic titles and descriptions
  const titles = equipment
    ? [
        `${eventType} Maintenance - ${equipment.name}`,
        `Inspection: ${equipment.name}`,
        `Repair Work: ${equipment.name}`,
        `${eventType} Service - ${equipment.name}`,
      ]
    : [
        `Team Meeting - ${technician.team}`,
        `Training Session - Safety Protocols`,
        `Equipment Review Meeting`,
        `Maintenance Planning Session`,
      ];

  const descriptions = equipment
    ? [
        `Scheduled ${eventType.toLowerCase()} maintenance for ${equipment.name} in ${equipment.location}.`,
        `Routine inspection and service of ${equipment.name}. Expected duration: ${Math.floor(duration / 60)} hours.`,
        `${eventType} maintenance work on ${equipment.name}. Please ensure area is clear.`,
      ]
    : [
        `${technician.team} meeting to discuss ongoing projects and priorities.`,
        `Training session covering safety protocols and best practices.`,
        `Review of equipment status and upcoming maintenance schedules.`,
      ];

  const id = generateId();
  const dateKey = startTime.toISOString().split('T')[0]; // YYYY-MM-DD format

  return {
    PK: `CALENDAR#EVENT#${id}`,
    SK: 'DETAILS',
    GSI1PK: `DATE#${dateKey}`,
    GSI1SK: `EVENT#${id}`,
    GSI2PK: `TYPE#${eventType}`,
    GSI2SK: `START#${startTime.toISOString()}`,

    // Event details
    id,
    title: randomItem(titles),
    description: randomItem(descriptions),
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    eventType,
    priority,
    status,
    isAllDay: false,

    // Assignment
    assignedTeam: technician.team,
    assignedTechnician: technician.id,
    attendees: randomItems(
      TECHNICIANS.map((t) => t.id),
      randomInt(1, 3)
    ),

    // Equipment relation
    equipmentId: equipment
      ? `EQUIPMENT#${equipment.name.replace(/\s+/g, '-').toLowerCase()}`
      : undefined,
    equipmentName: equipment?.name,
    location: equipment?.location || `${technician.team} Office`,

    // Duration
    estimatedDuration: duration,
    actualDuration: status === 'Completed' ? randomInt(duration - 30, duration + 60) : undefined,

    // Timestamps
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    // Metadata
    createdBy: 'system-seed',
  };
}

/**
 * Generate Kanban board configuration
 */
function generateBoardConfiguration(): any {
  const keys = {
    PK: 'KANBAN#BOARD',
    SK: 'CONFIG',
    GSI1PK: 'BOARD_TYPE#MAIN',
    GSI1SK: 'KANBAN#BOARD',
  };

  return {
    ...keys,
    id: 'main-board',
    name: 'Maintenance Requests',
    columns: [
      {
        id: 'new',
        title: 'New',
        status: 'New',
        color: '#3b82f6',
        order: 1,
        limits: { max: 20, warnAt: 15 },
      },
      {
        id: 'in-progress',
        title: 'In Progress',
        status: 'In Progress',
        color: '#f59e0b',
        order: 2,
        limits: { max: 10, warnAt: 8 },
      },
      {
        id: 'repaired',
        title: 'Repaired',
        status: 'Repaired',
        color: '#10b981',
        order: 3,
      },
      {
        id: 'scrap',
        title: 'Scrap',
        status: 'Scrap',
        color: '#ef4444',
        order: 4,
      },
    ],
    rules: {
      allowedTransitions: {
        New: ['In Progress', 'Scrap'],
        'In Progress': ['Repaired', 'Scrap', 'New'],
        Repaired: [],
        Scrap: [],
      },
      autoTransitions: [],
      validationRules: [],
      notificationRules: [],
    },
    lastUpdated: new Date().toISOString(),
  };
}

// =============================================================================
// SEEDING FUNCTIONS
// =============================================================================

/**
 * Check available DynamoDB tables
 */
async function checkAvailableTables(): Promise<void> {
  try {
    logger.info('🔍 Checking available DynamoDB tables...');

    const command = 'aws dynamodb list-tables --region ap-south-1 --output json';
    const output = execSync(command, { encoding: 'utf8' });
    const result = JSON.parse(output);

    if (result.TableNames && result.TableNames.length > 0) {
      logger.info('📋 Available tables:', result.TableNames);

      // Check if our expected table exists
      const expectedTable = process.env.DYNAMODB_TABLE || process.env.MAIN_TABLE_NAME;
      if (expectedTable && result.TableNames.includes(expectedTable)) {
        logger.info(`✅ Expected table found: ${expectedTable}`);
      } else {
        logger.warn(`⚠️  Expected table not found: ${expectedTable}`);
        logger.info('Available tables:', result.TableNames);
      }
    } else {
      logger.warn('⚠️  No DynamoDB tables found in this region');
    }
  } catch (error) {
    logger.error('❌ Failed to check available tables:', error);
    throw error;
  }
}

/**
 * Clear existing data
 */
/**
 * Clear existing data
 */
async function clearData(): Promise<void> {
  logger.info('🧹 Clearing existing Kanban and Calendar data...');

  try {
    // Get all requests
    const result = await dynamodb.scan({
      FilterExpression:
        'begins_with(PK, :requestPK) OR begins_with(PK, :calendarPK) OR begins_with(PK, :kanbanPK)',
      ExpressionAttributeValues: {
        ':requestPK': 'REQUEST#',
        ':calendarPK': 'CALENDAR#',
        ':kanbanPK': 'KANBAN#',
      },
    });

    if (result.items && result.items.length > 0) {
      logger.info(`Found ${result.items.length} items to delete`);

      // Delete in batches using batchWrite
      const batchSize = 25;
      for (let i = 0; i < result.items.length; i += batchSize) {
        const batch = result.items.slice(i, i + batchSize);
        const deleteOperations = batch.map((item: any) => ({
          delete: { PK: item.PK, SK: item.SK },
        }));

        await dynamodb.batchWrite(deleteOperations);
        logger.info(
          `Deleted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(result.items.length / batchSize)}`
        );
      }
    } else {
      logger.info('No existing data found to clear');
    }

    logger.info('✅ Data cleared successfully');
  } catch (error) {
    logger.error('❌ Failed to clear data:', error);
    throw error;
  }
}

/**
 * Seed maintenance requests
 */
async function seedMaintenanceRequests(): Promise<void> {
  logger.info(`📝 Seeding ${SEED_CONFIG.maintenanceRequests} maintenance requests...`);

  const requests = [];
  for (let i = 0; i < SEED_CONFIG.maintenanceRequests; i++) {
    requests.push(generateMaintenanceRequest());
  }

  // Insert in batches using batchWrite
  const batchSize = 25;
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const putOperations = batch.map((request) => ({ put: request }));

    await dynamodb.batchWrite(putOperations);
    logger.info(
      `Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(requests.length / batchSize)}`
    );
  }

  logger.info('✅ Maintenance requests seeded successfully');
}

/**
 * Seed calendar events
 */
async function seedCalendarEvents(): Promise<void> {
  logger.info(`📅 Seeding ${SEED_CONFIG.calendarEvents} calendar events...`);

  const events = [];
  for (let i = 0; i < SEED_CONFIG.calendarEvents; i++) {
    events.push(generateCalendarEvent());
  }

  // Insert in batches using batchWrite
  const batchSize = 25;
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);
    const putOperations = batch.map((event) => ({ put: event }));

    await dynamodb.batchWrite(putOperations);
    logger.info(
      `Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(events.length / batchSize)}`
    );
  }

  logger.info('✅ Calendar events seeded successfully');
}

/**
 * Seed board configuration
 */
async function seedBoardConfiguration(): Promise<void> {
  logger.info('⚙️ Seeding Kanban board configuration...');

  const boardConfig = generateBoardConfiguration();
  await dynamodb.put(boardConfig);

  logger.info('✅ Board configuration seeded successfully');
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear');
  const stage =
    args.find((arg) => arg.startsWith('--stage='))?.split('=')[1] ||
    process.env.STAGE ||
    'dev-heet';

  logger.info('🌱 Starting Kanban & Calendar seeding script');
  logger.info(`📊 Configuration:`, {
    stage,
    maintenanceRequests: SEED_CONFIG.maintenanceRequests,
    calendarEvents: SEED_CONFIG.calendarEvents,
    shouldClear,
  });

  try {
    // Setup AWS credentials first
    await setupAWSCredentials();

    // Check available tables
    await checkAvailableTables();

    if (shouldClear) {
      await clearData();
      logger.info('🏁 Data cleared. Exiting...');
      return;
    }

    // Clear existing data first
    await clearData();

    // Seed new data
    await seedBoardConfiguration();
    await seedMaintenanceRequests();
    await seedCalendarEvents();

    logger.info('🎉 Seeding completed successfully!');
    logger.info('📈 Summary:', {
      boardConfiguration: 1,
      maintenanceRequests: SEED_CONFIG.maintenanceRequests,
      calendarEvents: SEED_CONFIG.calendarEvents,
      totalItems: 1 + SEED_CONFIG.maintenanceRequests + SEED_CONFIG.calendarEvents,
    });
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    logger.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

export { main as seedKanbanCalendar };
