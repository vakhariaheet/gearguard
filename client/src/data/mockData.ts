/**
 * Mock Data for Development
 *
 * Dummy data for Kanban board and Calendar events
 */

import type {
  KanbanBoard,
  RequestCard,
  CalendarEvent,
  KanbanColumn,
  BoardStats,
} from '../types/kanban';

// =============================================================================
// MOCK CALENDAR EVENTS
// =============================================================================

export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: 'event_1',
    title: 'Preventive Maintenance - Conveyor Belt A1',
    description: 'Monthly inspection and lubrication of conveyor belt system',
    startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // Tomorrow + 2 hours
    eventType: 'Preventive',
    equipmentId: 'eq_001',
    equipmentName: 'Conveyor Belt A1',
    assignedTeam: 'Mechanical Team',
    assignedTechnician: 'John Smith',
    location: 'Production Floor A',
    priority: 'Medium',
    status: 'Scheduled',
    isAllDay: false,
    attendees: ['john.smith@company.com', 'mike.johnson@company.com'],
    estimatedDuration: 120,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'event_2',
    title: 'Emergency Repair - Hydraulic Press B2',
    description: 'Urgent repair of hydraulic system leak',
    startTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // In 3 hours
    endTime: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(), // In 7 hours
    eventType: 'Emergency',
    equipmentId: 'eq_002',
    equipmentName: 'Hydraulic Press B2',
    assignedTeam: 'Hydraulics Team',
    assignedTechnician: 'Sarah Wilson',
    location: 'Production Floor B',
    priority: 'Critical',
    status: 'In Progress',
    isAllDay: false,
    attendees: ['sarah.wilson@company.com', 'david.brown@company.com'],
    relatedRequestId: 'req_005',
    estimatedDuration: 240,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'event_3',
    title: 'Team Meeting - Weekly Maintenance Review',
    description: 'Weekly review of maintenance activities and planning',
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(), // Day after tomorrow at 9 AM
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(), // Day after tomorrow at 10 AM
    eventType: 'Meeting',
    assignedTeam: 'All Teams',
    location: 'Conference Room A',
    priority: 'Medium',
    status: 'Scheduled',
    isAllDay: false,
    attendees: [
      'john.smith@company.com',
      'sarah.wilson@company.com',
      'mike.johnson@company.com',
      'david.brown@company.com',
      'lisa.garcia@company.com',
    ],
    estimatedDuration: 60,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'event_4',
    title: 'Scheduled Maintenance - HVAC System',
    description: 'Quarterly maintenance of HVAC system including filter replacement',
    startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(), // In 5 days at 8 AM
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000).toISOString(), // In 5 days at 12 PM
    eventType: 'Scheduled',
    equipmentId: 'eq_003',
    equipmentName: 'HVAC System - Building A',
    assignedTeam: 'HVAC Team',
    assignedTechnician: 'Mike Johnson',
    location: 'Rooftop - Building A',
    priority: 'High',
    status: 'Scheduled',
    isAllDay: false,
    recurrence: {
      type: 'Monthly',
      interval: 3,
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
    },
    attendees: ['mike.johnson@company.com'],
    estimatedDuration: 240,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'event_5',
    title: 'Safety Inspection Deadline',
    description: 'Annual safety inspection must be completed by this date',
    startTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // In 10 days
    endTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // Same day
    eventType: 'Deadline',
    equipmentId: 'eq_004',
    equipmentName: 'All Production Equipment',
    assignedTeam: 'Safety Team',
    assignedTechnician: 'Lisa Garcia',
    location: 'All Locations',
    priority: 'High',
    status: 'Scheduled',
    isAllDay: true,
    attendees: ['lisa.garcia@company.com', 'safety@company.com'],
    estimatedDuration: 480,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// =============================================================================
// MOCK KANBAN REQUESTS
// =============================================================================

export const mockKanbanRequests: RequestCard[] = [
  {
    id: 'req_001',
    subject: 'Conveyor Belt Motor Replacement',
    description: 'Motor showing signs of wear, needs replacement before failure',
    equipmentId: 'eq_001',
    equipmentName: 'Conveyor Belt A1',
    equipmentLocation: 'Production Floor A',
    equipmentCategory: 'Conveyor Systems',
    priority: 'High',
    status: 'New',
    requestType: 'Repair',
    urgency: 'Medium',
    assignedTechnician: {
      id: 'tech_001',
      name: 'John Smith',
      email: 'john.smith@company.com',
    },
    assignedTeam: 'Mechanical Team',
    reportedBy: {
      id: 'user_001',
      name: 'Alice Johnson',
      email: 'alice.johnson@company.com',
    },
    estimatedHours: 4,
    actualHours: 0,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['motor', 'conveyor', 'replacement'],
    attachments: [],
    comments: [
      {
        id: 'comment_001',
        author: 'John Smith',
        content: 'Inspected the motor, confirmed replacement needed',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'req_002',
    subject: 'Hydraulic System Pressure Check',
    description: 'Routine pressure check and calibration of hydraulic system',
    equipmentId: 'eq_002',
    equipmentName: 'Hydraulic Press B2',
    equipmentLocation: 'Production Floor B',
    equipmentCategory: 'Hydraulic Systems',
    priority: 'Medium',
    status: 'In Progress',
    requestType: 'Maintenance',
    urgency: 'Low',
    assignedTechnician: {
      id: 'tech_002',
      name: 'Sarah Wilson',
      email: 'sarah.wilson@company.com',
    },
    assignedTeam: 'Hydraulics Team',
    reportedBy: {
      id: 'user_002',
      name: 'Bob Martinez',
      email: 'bob.martinez@company.com',
    },
    estimatedHours: 2,
    actualHours: 1.5,
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    tags: ['hydraulic', 'pressure', 'calibration'],
    attachments: [
      {
        id: 'att_001',
        name: 'pressure_readings.pdf',
        url: '/attachments/pressure_readings.pdf',
        type: 'application/pdf',
        size: 245760,
      },
    ],
    comments: [
      {
        id: 'comment_002',
        author: 'Sarah Wilson',
        content: 'Started pressure check, readings look normal so far',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'req_003',
    subject: 'HVAC Filter Replacement',
    description: 'Monthly filter replacement for HVAC system',
    equipmentId: 'eq_003',
    equipmentName: 'HVAC System - Building A',
    equipmentLocation: 'Rooftop - Building A',
    equipmentCategory: 'HVAC Systems',
    priority: 'Low',
    status: 'New',
    requestType: 'Maintenance',
    urgency: 'Low',
    assignedTechnician: {
      id: 'tech_003',
      name: 'Mike Johnson',
      email: 'mike.johnson@company.com',
    },
    assignedTeam: 'HVAC Team',
    reportedBy: {
      id: 'user_003',
      name: 'Carol Davis',
      email: 'carol.davis@company.com',
    },
    estimatedHours: 1,
    actualHours: 0,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['hvac', 'filter', 'routine'],
    attachments: [],
    comments: [],
  },
  {
    id: 'req_004',
    subject: 'Electrical Panel Inspection',
    description: 'Annual electrical panel inspection and testing',
    equipmentId: 'eq_005',
    equipmentName: 'Main Electrical Panel',
    equipmentLocation: 'Electrical Room',
    equipmentCategory: 'Electrical Systems',
    priority: 'High',
    status: 'Repaired',
    requestType: 'Inspection',
    urgency: 'Medium',
    assignedTechnician: {
      id: 'tech_004',
      name: 'David Brown',
      email: 'david.brown@company.com',
    },
    assignedTeam: 'Electrical Team',
    reportedBy: {
      id: 'user_004',
      name: 'Eva Rodriguez',
      email: 'eva.rodriguez@company.com',
    },
    estimatedHours: 3,
    actualHours: 2.5,
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    tags: ['electrical', 'inspection', 'annual'],
    attachments: [
      {
        id: 'att_002',
        name: 'inspection_report.pdf',
        url: '/attachments/inspection_report.pdf',
        type: 'application/pdf',
        size: 512000,
      },
    ],
    comments: [
      {
        id: 'comment_003',
        author: 'David Brown',
        content: 'Inspection completed successfully, all systems normal',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'req_005',
    subject: 'Emergency Hydraulic Leak Repair',
    description: 'Critical hydraulic fluid leak detected, immediate repair required',
    equipmentId: 'eq_002',
    equipmentName: 'Hydraulic Press B2',
    equipmentLocation: 'Production Floor B',
    equipmentCategory: 'Hydraulic Systems',
    priority: 'Critical',
    status: 'In Progress',
    requestType: 'Emergency',
    urgency: 'Critical',
    assignedTechnician: {
      id: 'tech_002',
      name: 'Sarah Wilson',
      email: 'sarah.wilson@company.com',
    },
    assignedTeam: 'Hydraulics Team',
    reportedBy: {
      id: 'user_005',
      name: 'Frank Wilson',
      email: 'frank.wilson@company.com',
    },
    estimatedHours: 6,
    actualHours: 3,
    dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    tags: ['hydraulic', 'leak', 'emergency', 'critical'],
    attachments: [
      {
        id: 'att_003',
        name: 'leak_photo.jpg',
        url: '/attachments/leak_photo.jpg',
        type: 'image/jpeg',
        size: 1024000,
      },
    ],
    comments: [
      {
        id: 'comment_004',
        author: 'Sarah Wilson',
        content: 'Located the leak source, ordering replacement seals',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'comment_005',
        author: 'Frank Wilson',
        content: 'Production line stopped until repair is complete',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
];

// =============================================================================
// MOCK KANBAN COLUMNS
// =============================================================================

export const mockKanbanColumns: KanbanColumn[] = [
  {
    id: 'col_new',
    title: 'New',
    status: 'New',
    color: '#3B82F6',
    requests: mockKanbanRequests.filter((req) => req.status === 'New'),
    limits: { max: 10 },
    order: 0,
  },
  {
    id: 'col_progress',
    title: 'In Progress',
    status: 'In Progress',
    color: '#8B5CF6',
    requests: mockKanbanRequests.filter((req) => req.status === 'In Progress'),
    limits: { max: 8 },
    order: 1,
  },
  {
    id: 'col_repaired',
    title: 'Repaired',
    status: 'Repaired',
    color: '#10B981',
    requests: mockKanbanRequests.filter((req) => req.status === 'Repaired'),
    limits: {},
    order: 2,
  },
  {
    id: 'col_scrap',
    title: 'Scrap',
    status: 'Scrap',
    color: '#EF4444',
    requests: mockKanbanRequests.filter((req) => req.status === 'Scrap'),
    limits: {},
    order: 3,
  },
];

// =============================================================================
// MOCK KANBAN BOARD
// =============================================================================

export const mockKanbanBoard: KanbanBoard = {
  id: 'board_main',
  name: 'Maintenance Requests',
  columns: mockKanbanColumns,
  rules: {
    allowedTransitions: {
      New: ['In Progress', 'Scrap'], // Allow direct scrap from new
      'In Progress': ['Repaired', 'Scrap'], // Allow scrap from in progress
      Repaired: ['Scrap'], // Allow scrap from repaired (for defective repairs)
      Scrap: [], // Terminal state
    },
    autoAssignRules: {
      Emergency: 'Immediate',
      Critical: 'Within 1 hour',
      High: 'Within 4 hours',
      Medium: 'Within 24 hours',
      Low: 'Within 72 hours',
    },
  },
  filters: {},
  lastUpdated: new Date().toISOString(),
};

// =============================================================================
// MOCK BOARD STATS
// =============================================================================

export const mockBoardStats: BoardStats = {
  totalRequests: mockKanbanRequests.length,
  byStatus: {
    New: mockKanbanRequests.filter((req) => req.status === 'New').length,
    'In Progress': mockKanbanRequests.filter((req) => req.status === 'In Progress').length,
    Repaired: mockKanbanRequests.filter((req) => req.status === 'Repaired').length,
    Scrap: mockKanbanRequests.filter((req) => req.status === 'Scrap').length,
  },
  byPriority: {
    Critical: mockKanbanRequests.filter((req) => req.priority === 'Critical').length,
    High: mockKanbanRequests.filter((req) => req.priority === 'High').length,
    Medium: mockKanbanRequests.filter((req) => req.priority === 'Medium').length,
    Low: mockKanbanRequests.filter((req) => req.priority === 'Low').length,
  },
  overdueCount: mockKanbanRequests.filter(
    (req) => new Date(req.dueDate) < new Date() && req.status !== 'Repaired'
  ).length,
  averageAge: 2.5, // days
};

// =============================================================================
// MOCK DATA STATE MANAGEMENT
// =============================================================================

// Create a mutable copy of mock data for state persistence
let mutableMockRequests = [...mockKanbanRequests];

/**
 * Update mock request status (for persistent state in mock mode)
 */
export const updateMockRequestStatus = (
  requestId: string,
  newStatus: 'New' | 'In Progress' | 'Repaired' | 'Scrap'
) => {
  const requestIndex = mutableMockRequests.findIndex((req) => req.id === requestId);
  if (requestIndex !== -1) {
    mutableMockRequests[requestIndex] = {
      ...mutableMockRequests[requestIndex],
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
  }
};

/**
 * Get current mock requests (with any updates)
 */
export const getCurrentMockRequests = () => [...mutableMockRequests];

/**
 * Reset mock data to original state
 */
export const resetMockData = () => {
  mutableMockRequests = [...mockKanbanRequests];
};

/**
 * Get mock calendar events with optional filtering
 */
export const getMockCalendarEvents = (
  startDate: string,
  endDate: string,
  filters?: {
    eventType?: string;
    assignedTeam?: string;
    assignedTechnician?: string;
  }
): CalendarEvent[] => {
  let filteredEvents = mockCalendarEvents.filter((event) => {
    const eventDate = new Date(event.startTime);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return eventDate >= start && eventDate <= end;
  });

  if (filters?.eventType) {
    filteredEvents = filteredEvents.filter((event) => event.eventType === filters.eventType);
  }

  if (filters?.assignedTeam) {
    filteredEvents = filteredEvents.filter((event) =>
      event.assignedTeam?.toLowerCase().includes(filters.assignedTeam!.toLowerCase())
    );
  }

  if (filters?.assignedTechnician) {
    filteredEvents = filteredEvents.filter((event) =>
      event.assignedTechnician?.toLowerCase().includes(filters.assignedTechnician!.toLowerCase())
    );
  }

  return filteredEvents.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
};

/**
 * Get mock kanban board with optional filtering
 */
export const getMockKanbanBoard = (filters?: {
  teams?: string[];
  priorities?: string[];
  showOverdueOnly?: boolean;
  showMyRequestsOnly?: boolean;
  assignedTechnician?: string;
}): { board: KanbanBoard; stats: BoardStats } => {
  // Use current mutable requests instead of static mock data
  let filteredRequests = getCurrentMockRequests();

  if (filters?.teams && filters.teams.length > 0) {
    filteredRequests = filteredRequests.filter((req) => filters.teams!.includes(req.assignedTeam));
  }

  if (filters?.priorities && filters.priorities.length > 0) {
    filteredRequests = filteredRequests.filter((req) => filters.priorities!.includes(req.priority));
  }

  if (filters?.showOverdueOnly) {
    filteredRequests = filteredRequests.filter(
      (req) => new Date(req.dueDate) < new Date() && req.status !== 'Repaired'
    );
  }

  if (filters?.assignedTechnician) {
    filteredRequests = filteredRequests.filter((req) =>
      req.assignedTechnician?.name.toLowerCase().includes(filters.assignedTechnician!.toLowerCase())
    );
  }

  // Create columns with current filtered requests
  const dynamicColumns: KanbanColumn[] = [
    {
      id: 'col_new',
      title: 'New',
      status: 'New',
      color: '#3B82F6',
      requests: filteredRequests.filter((req) => req.status === 'New'),
      limits: { max: 10 },
      order: 0,
    },
    {
      id: 'col_progress',
      title: 'In Progress',
      status: 'In Progress',
      color: '#8B5CF6',
      requests: filteredRequests.filter((req) => req.status === 'In Progress'),
      limits: { max: 8 },
      order: 1,
    },
    {
      id: 'col_repaired',
      title: 'Repaired',
      status: 'Repaired',
      color: '#10B981',
      requests: filteredRequests.filter((req) => req.status === 'Repaired'),
      limits: {},
      order: 2,
    },
    {
      id: 'col_scrap',
      title: 'Scrap',
      status: 'Scrap',
      color: '#EF4444',
      requests: filteredRequests.filter((req) => req.status === 'Scrap'),
      limits: {},
      order: 3,
    },
  ];

  const filteredBoard: KanbanBoard = {
    ...mockKanbanBoard,
    columns: dynamicColumns,
    filters: filters || {},
    lastUpdated: new Date().toISOString(),
  };

  // Calculate stats for filtered data
  const filteredStats: BoardStats = {
    totalRequests: filteredRequests.length,
    byStatus: {
      New: filteredRequests.filter((req) => req.status === 'New').length,
      'In Progress': filteredRequests.filter((req) => req.status === 'In Progress').length,
      Repaired: filteredRequests.filter((req) => req.status === 'Repaired').length,
      Scrap: filteredRequests.filter((req) => req.status === 'Scrap').length,
    },
    byPriority: {
      Critical: filteredRequests.filter((req) => req.priority === 'Critical').length,
      High: filteredRequests.filter((req) => req.priority === 'High').length,
      Medium: filteredRequests.filter((req) => req.priority === 'Medium').length,
      Low: filteredRequests.filter((req) => req.priority === 'Low').length,
    },
    overdueCount: filteredRequests.filter(
      (req) => new Date(req.dueDate) < new Date() && req.status !== 'Repaired'
    ).length,
    averageAge: 2.5,
  };

  return { board: filteredBoard, stats: filteredStats };
};
