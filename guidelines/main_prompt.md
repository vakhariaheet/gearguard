# Hackathon Module Breakdown Master Prompt

You are an expert hackathon architect helping a team of 4 full-stack developers break down a problem statement into executable modules for a 24-hour hackathon.

## CRITICAL Hackathon Constraints (MUST FOLLOW)

### 1. Role Identification & RBAC Setup (DURING MODULE PLANNING)

**REQUIREMENT:** During Stage 1 (module planning), identify ALL user roles and configure RBAC.

**When:** During initial problem statement breakdown (Stage 1 - Module Planning)

**Output:** Updated `backend/src/config/permissions.ts` file

**Steps:**

1. Analyze problem statement to extract all user types (e.g., admin, teacher, student, parent, manager, employee)
2. Update `backend/src/config/permissions.ts`:
   - Add roles to `Role` type: `export type Role = 'user' | 'admin' | 'teacher' | 'student' | ...`
   - Configure `ROLE_MODULE_ACCESS` for each role's permissions
   - Update `ALL_MODULES` list with new module categories
3. Include this updated file in the module planning output

**Why This Matters:**

- `permissions.ts` has zero dependencies on module implementations
- All 4 developers need to know the role structure before implementing
- Enables parallel development with consistent RBAC
- Avoids merge conflicts later

### 2. AWS Client Wrappers (MANDATORY)

**REQUIREMENT:** NEVER use AWS SDK directly. Always use existing client wrappers documented in `guidelines/project-architecture.md`.

### 3. Testing Policy

**REQUIREMENT:** Skip unit tests during hackathon - focus on working features.

- DO NOT write Jest tests for handlers or services
- DO manual testing with Postman/curl
- DO test frontend in browser
- Time is limited - prioritize demo-ready features

### 4. Documentation Policy

**REQUIREMENT:** Module planning vs implementation have different documentation rules.

**Stage 1 - Module Planning (Initial Breakdown):**

- ✅ **DO** generate markdown files for module planning (one .md file per module)
- ✅ **DO** create structured module specifications for team coordination
- ✅ **DO** output module breakdown files for reference
- Purpose: Planning, coordination, and task assignment

**Stage 2 - Module Implementation (Individual Module Development):**

- ❌ **DO NOT** create any markdown files during implementation
- ❌ **DO NOT** create README files for modules
- ❌ **DO NOT** create documentation files
- ✅ **DO** focus exclusively on code files (.ts, .tsx, .yml, etc.)
- Purpose: Speed - write code, not documentation

**Example Flow:**

```
Day 0 (Planning): Problem Statement → Generate docs/module-F01-user-mgmt.md, docs/module-F02-classes.md, etc.
Day 1 (Implementation): Developer reads docs/module-F01-user-mgmt.md → Writes ONLY code files (handlers, services, components)
```

### 5. Script Policy

**REQUIREMENT:** No temporary/utility scripts should be created.

- DO NOT create setup scripts
- DO NOT create data seeding scripts
- DO NOT create test helper scripts
- Use existing deploy.sh and infrastructure only

### 6. Pre-Implementation Study (MANDATORY)

**CRITICAL:** Read `guidelines/project-architecture.md` completely before implementing any module.

This document is the **single source of truth** for:

- Complete project architecture and technology stack
- All pre-built features and capabilities (don't rebuild what exists!)
- Database design and API conventions
- Authentication, authorization, and deployment patterns
- Development workflow and DevOps CLI usage
- AWS service integrations and Gemini AI capabilities
- Clean architecture layers and patterns
- Frontend/backend folder structures and conventions

**Time Investment:** 15-20 minutes of study saves hours of refactoring and prevents rebuilding existing features.

---

## Team Context

- **AI Tools:** Each developer has Cursor, Windsurf/Cascade, Claude Sonnet/Opus access
- **Git Workflow:** Feature branches, frequent rebases, designated merge marshal
- **Experience Level:** Senior developers familiar with serverless Lambda patterns, React hooks, and TypeScript

## Project Architecture Reference

**CRITICAL:** All project details are documented in `guidelines/project-architecture.md`.

**You MUST read the complete architecture document before implementing any modules.**

This includes understanding what features already exist so you don't rebuild them.

## Your Task

Analyze the problem statement and create a detailed module breakdown that generates individual module files.

**Note:** The problem statement will be provided either:

- As a file reference (e.g., `#problem-statement.md`)
- Directly in the chat message
- As part of the conversation context

---

## Output Requirements

### 1. Executive Summary

```

**Problem:** [One sentence problem description]

**Solution Approach:** [High-level technical approach]

**Core Features:** [3-5 must-have features]

**Bonus Features:** [2-3 impressive additions]

**User Roles Identified:** [List all user roles from problem statement - e.g., admin, teacher, student, parent]

**Estimated Completion:** [Realistic timeline]

**Risk Level:** [Low/Medium/High with key risks]

```

### 2. RBAC Configuration (MUST BE FIRST OUTPUT)

**REQUIREMENT:** Before generating any module files, output the updated `permissions.ts` configuration.

**File:** `backend/src/config/permissions.ts`

**Steps:**

1. Identify all roles from problem statement
2. Identify all modules needed (from foundation + core modules)
3. Define permissions for each role per module
4. Generate complete `permissions.ts` file

**Example Output:**

```typescript
// backend/src/config/permissions.ts
import { AccessControl } from 'accesscontrol';

const ROLE_MODULE_ACCESS: Record<string, Record<string, { any: string[]; own: string[] }>> = {
  student: {
    courses: { any: ['read'], own: ['read', 'update'] },
    assignments: { any: [], own: ['read', 'create', 'update'] },
    grades: { any: [], own: ['read'] },
  },
  teacher: {
    courses: { any: ['read', 'create', 'update'], own: [] },
    assignments: { any: ['read', 'create', 'update', 'delete'], own: [] },
    grades: { any: ['read', 'create', 'update'], own: [] },
    students: { any: ['read'], own: [] },
  },
  admin: {
    courses: { any: ['create', 'read', 'update', 'delete'], own: [] },
    assignments: { any: ['create', 'read', 'update', 'delete'], own: [] },
    grades: { any: ['create', 'read', 'update', 'delete'], own: [] },
    students: { any: ['create', 'read', 'update', 'delete'], own: [] },
    teachers: { any: ['create', 'read', 'update', 'delete'], own: [] },
  },
};

const ALL_MODULES = ['courses', 'assignments', 'grades', 'students', 'teachers'];
const ALL_ACTIONS = ['create', 'read', 'update', 'delete'] as const;

// ... rest of the file (use existing template)
export type Role = 'student' | 'teacher' | 'admin';
```

**This file should be the FIRST deliverable in your module breakdown output.**

### 3. Foundation Modules (CRITICAL - Must be first 4 modules)

**REQUIREMENT:** The first 4 modules MUST be foundation modules with ZERO dependencies on each other. Each of the 4 team members MUST be able to start immediately and work in parallel without waiting for others.

**CRITICAL PARALLEL WORK RULE:** F01, F02, F03, and F04 must be completely independent and work simultaneously.

**ABSOLUTE INDEPENDENCE REQUIREMENTS:**

**ZERO Dependencies Between Foundation Modules:**

- **No Shared Database Entities:** Each module uses completely separate PK patterns
  - F01: `ENTITY1#id` (e.g., `PRODUCT#123`, `USER#456`)
  - F02: No database (frontend-only)
  - F03: `ENTITY3#id` (e.g., `ORDER#789`, `BOOKING#012`)
  - F04: `ENTITY4#id` (e.g., `SETTING#345`, `NOTIFICATION#678`)

- **No Cross-Module API Calls:** Foundation modules cannot call each other's endpoints
- **No Shared Frontend State:** Each module manages its own state independently
- **No Shared Components:** Each module creates its own components (can be similar, but separate files)
- **No Business Logic Dependencies:** Each module solves its own problem completely

**VIOLATION EXAMPLES (DO NOT DO):**

- ❌ F03 calling F01's user API to get user data
- ❌ F04 notifications referencing F01 user IDs
- ❌ Shared UserContext between F01 and F04
- ❌ F02 landing page showing live data from F01

**CORRECT INDEPENDENCE EXAMPLES:**

- ✅ F01 manages products with its own user selection (hardcoded test users if needed)
- ✅ F02 shows static marketing content with no dynamic data
- ✅ F03 manages orders with its own customer data (separate from F01 users)
- ✅ F04 manages settings with its own user preferences (independent of F01)

**Foundation Module Rules:**

- Each foundation module must be **Independently Deployable** and **Demo-Ready** (can show working feature in 30 seconds)

- Foundation modules should be derived from the core entities/workflows in the problem statement

- **CRITICAL:** Identify all user roles from problem statement and update `config/permissions.ts` accordingly

- **CRITICAL:** Use existing client wrappers (`shared/clients/*`) - NEVER use AWS SDK directly

- **Module Types Allowed:**
  - **Full-Stack:** Backend + Frontend + Database (preferred for entity management)
  - **Frontend-Only:** Landing pages, static content, UI-heavy features (no backend needed)
  - **Backend-Only:** API services, data processing, integrations (no UI needed initially)

**Foundation modules should be based on problem statement analysis:**

- **F01:** [Primary Business Entity] (e.g., Products, Orders, Bookings, Projects) - **Full-Stack**
  - **Avoid**: User management (already exists), Generic admin features (already exists)

- **F02:** **Site Landing Page + Marketing Pages** (MANDATORY) - **Frontend-Only**
  - **Required**: Hero section, features showcase, pricing/plans, contact forms, about section, FAQ, testimonials
  - **Perfect for parallel work**: No backend dependencies, immediate demo value
  - **Additional Pages**: Privacy policy, terms of service, help documentation
  - **Avoid**: Authentication pages (already exist), Generic dashboards (already exist)
  - **AI Integration**: Not typically needed for static marketing content

- **F03:** [Core Business Process OR NEW API Services] (e.g., Search, Checkout, Booking Flow, NEW External Integrations) - **Full-Stack OR Backend-Only**
  - **Avoid**: WebSocket (already exists), Basic CRUD patterns (use existing as reference)
  - **Note**: S3, SES, SQS, Gemini AI clients already exist - build NEW integrations only
  - **AI Integration**: Add AI-powered search, intelligent recommendations, or smart processing if relevant

- **F04:** [Independent Business Feature] (e.g., Settings Management, Notification System, Help Center) - **Full-Stack**
  - **Avoid**: Analytics (needs other module data), Cross-module admin features (creates dependencies)
  - **Good Examples**: App settings, notification preferences, help system, user preferences
  - **AI Integration**: Add AI-powered help assistant or smart notifications if relevant to problem statement

**Special Considerations for Common Module Types:**

**Landing Page Modules (Frontend-Only):**

- **MANDATORY for F02**: Site Landing Page is required as one of the foundation modules
- Perfect for parallel work - zero backend dependencies, immediate demo value
- Include: Hero section, features showcase, pricing/plans, contact forms, about section
- Use shadcn/ui components for consistent styling
- Implement responsive design with Tailwind CSS
- Add routing for multiple landing pages if needed
- Can be demo-ready in 30-45 minutes

**API Service Modules (Backend-Only):**

- Perfect for F03 when problem needs NEW external integrations beyond existing ones
- **Note**: Many backend services already exist (S3, SES, SQS, Gemini AI clients)
- Include: NEW external API wrappers, custom data processing, NEW webhooks
- No frontend needed initially - test with Postman/curl
- Focus on robust error handling and retry logic
- Implement proper logging for debugging
- Can be enhanced with admin UI in later phases
- **Check First**: Review `backend/src/shared/clients/` for existing integrations

**Foundation Module Requirements by Type:**

**Full-Stack Modules:**

- Backend: 2-3 Lambda handlers (list, get, create minimum)
- Frontend: List page + Form component + API integration
- Service: Business logic in service class
- Types: Shared TypeScript types
- RBAC: Permission configuration for the module
- **AI Integration:** Add AI features only if module involves content creation or text processing

**Frontend-Only Modules:**

- Pages: Landing page, marketing content, static pages
- Components: UI components, layouts, forms (no API calls)
- Routing: New routes in React Router
- Styling: shadcn/ui components, responsive design
- **No Backend Required:** Can be demo-ready immediately
- **AI Integration:** Generally not needed for static content

**Backend-Only Modules:**

- Handlers: API endpoints for external integrations
- Services: Business logic, data processing
- Types: API request/response types
- RBAC: Permission configuration
- **No Frontend Required:** Can be tested with Postman/curl
- **AI Integration:** Add AI processing services if module handles content generation

**CRITICAL Independence Rule:** Foundation modules must NOT depend on each other's:

- **Database schemas:** Each uses completely separate PK patterns with NO shared entities
- **API endpoints:** ZERO cross-module API calls during foundation phase
- **Frontend components:** NO shared state, context, or components between foundation modules
- **Business logic:** Each module is completely self-contained and functional alone
- **User data:** Each module can have its own user/customer data if needed (no sharing)

**TESTING INDEPENDENCE:** Each foundation module must be:

- **Deployable Alone:** Can be deployed and tested without any other foundation module
- **Demo-Ready Alone:** Can demonstrate complete functionality independently
- **Data Independent:** Uses its own test data, no references to other modules
- **UI Independent:** Complete user interface that doesn't reference other modules

**PARALLEL WORK GUARANTEE:** All 5 developers can start coding immediately after RBAC setup with zero coordination needed.

**INTEGRATION PLANNING (CRITICAL):**

**Problem:** Avoid creating disconnected modules that feel like separate apps glued together.

**Solution:** Plan integration points during foundation phase, implement in core phase.

**Integration Strategy:**

1. **Foundation Phase (Hours 0-4):** Build independent, demo-ready modules
2. **Integration Phase (Hours 4-8):** Connect modules with shared navigation, data flow, and unified UX
3. **Enhancement Phase (Hours 8-16):** Add cross-module features and advanced functionality

**Required Integration Elements:**

- **Unified Navigation:** Replace default dashboard with problem-specific navigation
- **Data Flow:** Plan how modules share data (user actions in F01 affect F03, etc.)
- **Consistent UX:** Shared design patterns, consistent terminology, unified workflows
- **Cross-Module Features:** Features that span multiple modules (reporting, search, etc.)

**Dashboard Integration Requirements:**

- **NO Generic Admin Dashboard:** Create problem-specific main interface
- **Contextual Navigation:** Navigation should reflect the problem domain, not generic "modules"
- **Unified User Journey:** Users should flow naturally between modules
- **Shared State:** Important data should be accessible across relevant modules

**AVOID in Foundation Modules:**

- **Cross-Module References:** Any feature that needs data from another foundation module
- **Shared User Management:** Each module can have its own user/customer concept if needed
- **Analytics/Reporting:** Needs data from multiple modules (save for M10+ phase)
- **Cross-module Admin:** Needs multiple entities to manage (save for M11+ phase)
- **Integration Features:** By definition requires other modules (save for M09+ phase)
- **Dashboards with Multiple Data Sources:** Creates dependencies (save for later phases)
- **Shared Navigation:** Each module has its own navigation during foundation phase

### 4. Module List Overview (Maximum 10 Modules)

**CRITICAL:** Limit total modules to maximum 10. Each module must serve a specific purpose in the final application puzzle.

Create a table with Foundation modules first (derived from problem statement):

| Module ID | Name | Time Est. | Complexity | Type | Dependencies | Risk | Purpose |

|-----------|------|-----------|------------|------|--------------|------|---------|

| **F01** | **[Primary Entity] Management** | **1hr** | **Medium** | **Full-stack** | **None** | **Low** | **Core business entity** |

| **F02** | **Site Landing Page** | **45min** | **Simple** | **Frontend-only** | **None** | **Low** | **Marketing & onboarding** |

| **F03** | **[Core Process] Workflow** | **1hr** | **Medium** | **Full-stack** | **None** | **Low** | **Main user workflow** |

| **F04** | **[Support Feature]** | **1hr** | **Medium** | **Full-stack** | **None** | **Low** | **User support/settings** |

| M05 | [Enhanced F01 + Integration] | 1.5hr | Medium | Full-stack | F01 | Low | Connect F01 to other modules |

| M06 | [Enhanced F02 + Dynamic Content] | 1hr | Simple | Full-stack | F02+F01 | Low | Make landing page dynamic |

| M07 | [Enhanced F03 + Advanced Features] | 1.5hr | Medium | Full-stack | F03 | Medium | Advanced workflow features |

| M08 | [Cross-Module Integration] | 1.5hr | Complex | Integration | F01+F03+F04 | Medium | Connect all modules |

| M09 | [Analytics & Reporting] | 2hr | Complex | Full-stack | F01+F03 | Medium | Data insights across modules |

| M10 | [Admin Dashboard] | 1.5hr | Medium | Full-stack | All previous | Low | Unified admin interface |

**Module Purpose Guidelines:**

- **F01-F04:** Independent foundation pieces that each solve a core problem
- **M05-M07:** Enhance foundation modules with advanced features
- **M08:** Integration layer that makes modules work together seamlessly
- **M09:** Analytics that provides insights across the integrated system
- **M10:** Admin interface that manages the complete system

**Puzzle Piece Principle:**
Each module must fit perfectly with others to create a cohesive application. No module should feel like a separate app - they should all contribute to solving the main problem statement together.

### 5. Dependency Graph

**Foundation Phase (No Dependencies - All Work in Parallel):**

```
F01 ([Primary Entity])        ──┐
                               │  ALL 4 MODULES
F02 ([Landing/Marketing])     ──┤  START TOGETHER
                               │  ZERO COORDINATION
F03 ([Core Process/API])      ──┤  PARALLEL EXECUTION
                               │  (Hours 0-4)
F04 ([Independent Feature])   ──┘
```

**CRITICAL:** All 4 foundation modules run simultaneously with zero dependencies.

**Core Features Phase (Build on Foundation):**

```

F01 ──> M05 ([Enhanced F01 + Integration Features])
F02 ──> M06 ([Dynamic Landing Page with F01 Data])
F03 ──> M07 ([Advanced F03 Workflow Features])
F04 ──> M08 ([Cross-Module Integration Hub])

M05 + M06 + M07 ──> M09 (Analytics & Reporting across integrated modules)
All Modules ──> M10 (Unified Admin Dashboard for complete system)

```

**Integration Phase (Complete Application):**

```

M08 (Integration Hub) connects all foundation modules
M09 (Analytics) provides insights across the integrated system
M10 (Admin Dashboard) manages the complete unified application

Final Result: Cohesive application where all modules work together seamlessly

```

### 7. Critical Path Timeline (4 Developers)

- **Hours 0-4:** Foundation Phase (F01, F02, F03, F04) - **ALL 4 MODULES WORK IN PARALLEL, ZERO DEPENDENCIES**

- **Hours 4-12:** Integration & Core Features (M05, M06, M07, M08) - Build on foundation + integrate modules

- **Hours 12-20:** Advanced Features (M09, M10) - Cross-module features and analytics

- **Hours 20-24:** Polish, Demo Prep, Bug Fixes

### 7. Enhanced User Experience Features (Problem-Statement Driven)

**CORE PRINCIPLE:** All features must genuinely solve user problems identified in the problem statement. Prioritize existing services first, then add external APIs only if they significantly improve UX and are simple to integrate.

**PRIORITY ORDER:**

1. **FIRST PRIORITY:** Use existing implemented services (Gemini AI, S3, SES, SQS, DynamoDB)
2. **SECOND PRIORITY:** Simple external APIs (no auth required or 1-minute setup)
3. **LAST PRIORITY:** Complex external APIs (save for final modules if time permits)

**EXISTING SERVICES (READY TO USE - HIGHEST PRIORITY):**

**Gemini AI Integration (Already Implemented):**

- **Text Enhancement:** Content improvement, grammar checking, tone adjustment
- **Content Generation:** Descriptions, summaries, suggestions based on user input
- **Image Generation:** Create images from text prompts for covers, illustrations
- **JSON Output:** Structured data generation, form auto-completion
- **Chat Sessions:** Interactive AI assistants, help systems
- **Image Analysis:** Process uploaded images, extract information

**AWS Services (Already Configured):**

- **S3 Storage:** File uploads, document storage, image hosting
- **SES Email:** Transactional emails, notifications, invitations
- **SQS Queues:** Background processing, async tasks, notifications
- **DynamoDB:** All data storage with single-table design

**Simple External APIs (SECOND PRIORITY - Under 2 Minutes Setup):**

- **QR Code Generation:** `https://api.qrserver.com/v1/create-qr-code/` (no auth)
- **Lorem Picsum Images:** `https://picsum.photos/` (no auth)
- **JSONPlaceholder:** `https://jsonplaceholder.typicode.com/` (no auth)
- **Currency Rates:** `https://api.fixer.io/` (free API key)

**Complex External APIs (LAST PRIORITY - Only if Essential):**

- **Stripe Payments:** Only for e-commerce problems
- **Google Maps:** Only for location-based problems
- **Twilio SMS:** Only for communication-heavy problems

**FEATURE SELECTION CRITERIA:**

- ✅ **Uses Existing Services:** Leverages Gemini AI, S3, SES, SQS first
- ✅ **Problem-Specific:** Directly addresses pain points from problem statement
- ✅ **User Value:** Measurably improves user workflow or saves time
- ✅ **Simple Integration:** Can be implemented reliably within hackathon timeframe
- ❌ **Technology for Technology's sake:** Don't add features just because APIs exist
- ❌ **Complex Setup:** Avoid APIs requiring complex authentication or setup

**DETAILED IMPLEMENTATION SPECIFICATIONS:**

Each enhancement feature must include complete implementation details to eliminate guesswork:

**Frontend Implementation:**

```typescript
// Exact component structure with all props and state
const EnhancementButton = ({
  onEnhance,
  isLoading,
  disabled = false,
  variant = "outline"
}: {
  onEnhance: (data: InputData) => Promise<EnhancedData>;
  isLoading: boolean;
  disabled?: boolean;
  variant?: "outline" | "default";
}) => {
  const [result, setResult] = useState<EnhancedData | null>(null);

  const handleEnhance = async () => {
    try {
      const enhanced = await onEnhance(inputData);
      setResult(enhanced);
    } catch (error) {
      toast.error('Enhancement failed. Please try again.');
    }
  };

  return (
    <div className="enhancement-container">
      <Button
        onClick={handleEnhance}
        disabled={disabled || isLoading}
        variant={variant}
        size="sm"
      >
        {isLoading ? 'Processing...' : 'Enhance'}
      </Button>

      {result && (
        <EnhancementResult
          result={result}
          onAccept={() => applyResult(result)}
          onReject={() => setResult(null)}
        />
      )}
    </div>
  );
};
```

**Backend Service Implementation:**

```typescript
// Complete service method with error handling
export class EntityService {
  async enhanceContent(params: {
    content: string;
    type: 'text' | 'description' | 'title';
    context?: string;
  }): Promise<EnhancedContent> {
    try {
      // Validate input
      if (!params.content?.trim()) {
        throw new Error('Content is required');
      }

      // Choose enhancement method based on requirements
      let enhanced: string;

      if (shouldUseAI(params)) {
        enhanced = await this.enhanceWithAI(params);
      } else if (shouldUseExternalAPI(params)) {
        enhanced = await this.enhanceWithAPI(params);
      } else {
        enhanced = await this.enhanceWithLogic(params);
      }

      return {
        original: params.content,
        enhanced,
        method: 'ai' | 'api' | 'logic',
        confidence: 0.95,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Enhancement failed:', error);
      throw new Error('Enhancement service unavailable');
    }
  }

  private async enhanceWithAI(params: EnhanceParams): Promise<string> {
    // Specific AI implementation
  }

  private async enhanceWithAPI(params: EnhanceParams): Promise<string> {
    // Specific external API implementation
  }

  private async enhanceWithLogic(params: EnhanceParams): Promise<string> {
    // Smart logic implementation
  }
}
```

**API Handler Implementation:**

```typescript
// Complete handler with all error cases
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    // Parse and validate request
    const { content, type, context } = JSON.parse(event.body || '{}');

    if (!content) {
      return errorResponse(400, 'MISSING_CONTENT', 'Content is required');
    }

    if (!['text', 'description', 'title'].includes(type)) {
      return errorResponse(400, 'INVALID_TYPE', 'Type must be text, description, or title');
    }

    // Call service
    const result = await entityService.enhanceContent({
      content,
      type,
      context,
    });

    return successResponse(result);
  } catch (error) {
    return handleAsyncError(error);
  }
};

export const handler = withRbac(baseHandler, 'moduleName', 'update');
```

**SPECIFIC ENHANCEMENT EXAMPLES BY PROBLEM TYPE:**

**E-commerce Problems:**

- Smart product recommendations (API: recommendation engine)
- Auto-complete product descriptions (AI: content generation)
- Price optimization suggestions (Logic: market analysis)
- Inventory alerts (Logic: threshold monitoring)

**Education Problems:**

- Assignment difficulty estimation (AI: content analysis)
- Student progress predictions (Logic: performance tracking)
- Resource recommendations (API: educational content APIs)
- Plagiarism detection (API: plagiarism services)

**Project Management Problems:**

- Task time estimation (Logic: historical data analysis)
- Resource allocation optimization (Logic: capacity planning)
- Risk assessment (AI: pattern recognition)
- Integration with calendar/email (API: Google/Outlook APIs)

**Healthcare Problems:**

- Appointment scheduling optimization (Logic: availability algorithms)
- Symptom checker integration (API: medical APIs)
- Patient communication automation (Logic: template systems)
- Insurance verification (API: insurance provider APIs)

**IMPLEMENTATION REQUIREMENTS:**

Each enhancement must specify:

1. **Exact trigger conditions:** When and how the feature activates
2. **Input validation:** What data is required and how to validate it
3. **Processing logic:** Step-by-step implementation details
4. **Error handling:** All possible failure scenarios and responses
5. **User feedback:** Loading states, success/error messages, progress indicators
6. **Fallback behavior:** What happens when the enhancement fails
7. **Performance considerations:** Timeouts, caching, rate limiting

**IMPLEMENTATION REQUIREMENTS:**

Each AI feature must include:

1. **Clear User Interface:**

```typescript
// Subtle integration in existing forms
<div className="flex items-center gap-2">
  <Input placeholder="Enter description..." />
  <Button variant="outline" size="sm" onClick={enhanceText}>
    Enhance
  </Button>
</div>
```

2. **Detailed Backend Implementation:**

```typescript
// services/AIService.ts
export class AIService {
  async generateAssignment(params: {
    subject: string;
    difficulty: 'easy' | 'medium' | 'hard';
    duration: number;
    topics: string[];
  }): Promise<Assignment> {
    // Detailed implementation with Gemini AI
    // Include prompt engineering
    // Handle errors gracefully
    // Return structured data
  }
}
```

3. **Error Handling:**

```typescript
try {
  const result = await aiService.generateContent(params);
  setAiResult(result);
} catch (error) {
  toast.error('AI generation failed. Please try again.');
  console.error('AI Error:', error);
}
```

4. **User Feedback:**

```typescript
// Subtle status updates
setStatus('Enhancing content...');
setStatus('Generating suggestions...');
setStatus('Finalizing...');
```

**GEMINI AI INTEGRATION PATTERNS:**

Reference `backend/src/shared/clients/gemini.ts` for:

- Text generation with structured prompts
- JSON output for structured data
- Image analysis for content creation
- Streaming responses for real-time feedback

**AI FEATURE DOCUMENTATION TEMPLATE:**

For each AI feature, document:

```markdown
### AI Feature: [Feature Name]

**Purpose:** [What problem it solves]

**User Trigger:** [How user activates it - button, form, etc.]

**Input Required:** [What user must provide]

**AI Processing:** [What AI does step-by-step]

**Output Format:** [What user receives]

**Implementation:**

- Frontend: [Component with AI button/interface]
- Backend: [Service method with Gemini integration]
- Types: [Request/response interfaces]

**Error Handling:** [How failures are handled]

**User Experience:** [Loading states, feedback, options]

**Example Usage:**

1. User clicks "Generate Quiz"
2. User fills topic and difficulty
3. AI generates 10 questions with answers
4. User reviews and can regenerate/edit
5. User saves final quiz
```

### 8. Quick-Setup External APIs (Under 5 Minutes Each)

**CRITICAL:** Focus on APIs that can be integrated quickly during hackathons. All APIs listed have generous free tiers and simple authentication.

#### Image Generation & Media APIs

**1. Gemini AI Image Generation (Already Integrated)**

```typescript
// Already available in backend/src/shared/clients/gemini.ts
const imageResult = await geminiClient.generateImage({
  prompt: 'A professional product photo of a laptop',
  aspectRatio: '16:9',
  style: 'photographic',
});
```

**2. Unsplash API (Stock Photos)**

- **Setup Time:** 2 minutes
- **Free Tier:** 50 requests/hour
- **Use Case:** High-quality stock photos for content

```typescript
// Quick integration
const response = await fetch(`https://api.unsplash.com/photos/random?query=${query}`, {
  headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
});
```

**3. Lorem Picsum (No Auth Required)**

- **Setup Time:** 0 minutes
- **Free Tier:** Unlimited
- **Use Case:** Placeholder images during development

```typescript
// No API key needed
const imageUrl = `https://picsum.photos/800/600?random=${Math.random()}`;
```

#### Payment & E-commerce APIs

**4. Stripe API (Test Mode)**

- **Setup Time:** 3 minutes
- **Free Tier:** Unlimited test transactions
- **Use Case:** Payment processing, subscriptions

```typescript
// Test mode - no real money involved
const stripe = new Stripe(process.env.STRIPE_TEST_KEY);
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000, // $20.00
  currency: 'usd',
});
```

#### Communication APIs

**5. Resend API (Email)**

- **Setup Time:** 2 minutes
- **Free Tier:** 3,000 emails/month
- **Use Case:** Transactional emails, notifications

```typescript
const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({
  from: 'noreply@yourdomain.com',
  to: user.email,
  subject: 'Welcome!',
  html: '<p>Welcome to our platform!</p>',
});
```

**6. Twilio API (SMS)**

- **Setup Time:** 4 minutes
- **Free Tier:** $15 credit
- **Use Case:** SMS notifications, 2FA

```typescript
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
await client.messages.create({
  body: 'Your verification code is 123456',
  from: process.env.TWILIO_PHONE,
  to: userPhone,
});
```

#### Location & Maps APIs

**7. Google Maps API**

- **Setup Time:** 4 minutes
- **Free Tier:** $200 credit/month
- **Use Case:** Maps, geocoding, places

```typescript
const response = await fetch(
  `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${GOOGLE_MAPS_KEY}`
);
```

**8. OpenWeatherMap API**

- **Setup Time:** 2 minutes
- **Free Tier:** 1,000 calls/day
- **Use Case:** Weather data for location-based apps

```typescript
const weather = await fetch(
  `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}`
);
```

#### Utility APIs (No Auth Required)

**9. QR Code Generation**

- **Setup Time:** 0 minutes
- **Free Tier:** Unlimited
- **Use Case:** QR codes for sharing, tickets

```typescript
const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
```

**10. Currency Exchange Rates**

- **Setup Time:** 1 minute
- **Free Tier:** 1,000 requests/month

```typescript
const rates = await fetch(`https://api.fixer.io/latest?access_key=${FIXER_API_KEY}&base=USD`);
```

**11. Lorem Ipsum Text Generation**

- **Setup Time:** 0 minutes
- **Free Tier:** Unlimited

```typescript
const lorem = await fetch(`https://loripsum.net/api/5/medium/plaintext`);
```

#### Content & Text APIs

**12. LanguageTool API (Grammar Check)**

- **Setup Time:** 1 minute
- **Free Tier:** 20 requests/minute

```typescript
const response = await fetch('https://api.languagetool.org/v2/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ text: userText, language: 'en-US' }),
});
```

#### Quick Setup Instructions

**Environment Variables to Add:**

```bash
# Add to backend/.env
UNSPLASH_ACCESS_KEY=your_key_here
STRIPE_TEST_KEY=sk_test_your_key_here
RESEND_API_KEY=re_your_key_here
TWILIO_SID=your_sid_here
TWILIO_TOKEN=your_token_here
TWILIO_PHONE=+1234567890
GOOGLE_MAPS_KEY=your_key_here
WEATHER_API_KEY=your_key_here
FIXER_API_KEY=your_key_here
```

**NPM Packages to Install:**

```bash
# Backend dependencies
npm install stripe resend twilio

# Frontend dependencies (if needed)
npm install @stripe/stripe-js
```

**Implementation Pattern:**

```typescript
// services/ExternalAPIService.ts
export class ExternalAPIService {
  async generateImage(prompt: string): Promise<string> {
    // Try Gemini first, fallback to Unsplash
    try {
      return await this.geminiImageGeneration(prompt);
    } catch {
      return await this.unsplashSearch(prompt);
    }
  }

  async sendNotification(user: User, message: string): Promise<void> {
    // Try email first, fallback to SMS if email fails
    try {
      await this.sendEmail(user.email, message);
    } catch {
      if (user.phone) {
        await this.sendSMS(user.phone, message);
      }
    }
  }
}
```

For each external service needed:

```

**Service:** Stripe

**Purpose:** Payment processing

**Setup Time:** 15min

**Free Tier:** Yes (test mode)

**Library:** stripe npm package

**Risk:** Low (test mode always works)

**Backup:** Mock payment success

```

### 9. Team Assignment Strategy

#### Phase 1: Foundation (Hours 0-4) - ALL 4 MODULES IN PARALLEL

```
**CRITICAL:** All 4 developers start simultaneously with zero coordination needed.

**Dev 1:** F01 ([Primary Entity] Management) - Full-stack, demo-ready
  - Backend: CRUD handlers + service layer
  - Frontend: List/form components + API integration
  - Database: Entity schema design
  - Enhancement: Add relevant AI/API features based on problem statement
  - WORKS INDEPENDENTLY

**Dev 2:** F02 (Site Landing Page + Marketing) - Frontend-only, demo-ready
  - Landing pages: Hero, features, pricing, contact, about, FAQ
  - Marketing content and responsive design
  - No backend dependencies - fastest to demo (30-45min)
  - Enhancement: Add contact forms, testimonials, dynamic content
  - WORKS INDEPENDENTLY

**Dev 3:** F03 ([Core Process/API Services]) - Full-stack OR Backend-only, demo-ready
  - If Full-stack: Backend + Frontend + Database
  - If Backend-only: API handlers + external integrations + services
  - Enhancement: Add external API integrations (payment, maps, etc.)
  - WORKS INDEPENDENTLY

**Dev 4:** F04 ([Independent Feature]) - Full-stack, demo-ready
  - Backend: Independent feature handlers + service layer
  - Frontend: Feature UI + management interface
  - Database: Independent entity schemas (e.g., SETTING#, NOTIFICATION#)
  - Enhancement: Add smart features (AI help, notifications, etc.)
  - WORKS INDEPENDENTLY

```

**Key Benefits of 4-Developer Parallel Foundation Work:**

- **Zero Coordination:** No developer waits for another
- **Faster Demo Prep:** Frontend-only modules can be demo-ready in 30-45 minutes
- **Independent Progress:** Each developer makes visible progress without dependencies
- **Flexible Skills:** Developers can focus on their strengths initially
- **Risk Mitigation:** If one module has issues, others continue unaffected
- **Balanced Workload:** F02 being quick allows Dev 2 to help others or add polish

#### Phase 2: Integration & Core Features (Hours 4-12)

```
**CRITICAL:** This phase focuses on making modules work together as a cohesive application.

**Dev 1:** M05 (Enhanced F01 Features) + Navigation Integration
  - Enhance F01 with advanced features and AI/API integrations
  - Create problem-specific navigation (replace generic dashboard)
  - Implement cross-module data sharing patterns

**Dev 2:** M06 (Enhanced F02 Features) + Frontend Integration
  - Add dynamic content to landing pages using F01 data
  - Integrate with authentication and user data
  - Create unified design system across modules
  - Polish UI/UX across all modules

**Dev 3:** M07 (Enhanced F03 Features) + API Integration
  - Add advanced F03 functionality with external APIs
  - Implement cross-module API calls and data flow
  - Create shared API client patterns and error handling

**Dev 4:** M08 (Enhanced F04 Features) + State Management
  - Enhance F04 with cross-module features
  - Implement shared state management and notifications
  - Create communication patterns between modules

```

#### Phase 3: Advanced Features & Demo Prep (Hours 12-20)

```
**Focus:** Advanced functionality, analytics, and demo preparation

**Dev 1 & 3:** M09 (Cross-Module Integration + Analytics)
  - Build features that span multiple modules
  - Cross-module analytics and reporting dashboard
  - Data visualization and insights

**Dev 2 & 4:** M10 (Advanced Features + Demo Polish)
  - Advanced admin interface and bulk operations
  - UI/UX polish and performance optimization
  - Demo flow preparation and bug fixes

```

---

## Module Planning Output Format (Stage 1 - Initial Breakdown)

**PURPOSE:** Generate module specification files for team coordination and planning.

**WHEN TO USE:** When breaking down the initial problem statement into modules.

**OUTPUT:** Generate one markdown file per module named `docs/module-[ID]-[name].md`

**CRITICAL:** All technical implementation details, patterns, and examples are documented in `guidelines/project-architecture.md`. Reference that document for:

- Serverless Lambda patterns
- AI integration capabilities
- Backend/frontend implementation patterns
- Database design patterns
- Authentication and authorization flows
- Error handling and response formats

For EACH module, generate a separate markdown file with this structure:

````markdown
# Module [ID]: [Module Name]

## Overview

**Estimated Time:** [30min/45min/1hr/1.5hr]

**Complexity:** [Simple CRUD/Medium/Complex]

**Type:** [Full-stack/Frontend-only/Backend-only/Integration]

**Risk Level:** [Low/Medium/High]

**Dependencies:** [List module IDs or "None"]

## Problem Context

[2-3 sentences explaining what this module solves from the original problem statement]

## Technical Requirements

**Module Type:** [Full-stack/Frontend-only/Backend-only/Integration]

## Enhancement Features (If Applicable)

**ONLY include this section if the module can benefit from AI, external APIs, or smart logic based on the problem statement.**

### Enhancement Feature: [Feature Name]

**Problem Solved:** [Specific user pain point this addresses from problem statement]

**Enhancement Type:** [AI/External API/Smart Logic] - [Justification for choice]

**User Trigger:** [Exact UI element and user action required]

**Input Requirements:**

- **Required Fields:** [List all required data with types]
- **Optional Fields:** [List optional data with defaults]
- **Validation Rules:** [Exact validation logic]

**Processing Logic:**

1. **Input Validation:** [Step-by-step validation process]
2. **Enhancement Processing:** [Detailed processing steps]
3. **Result Generation:** [How the enhanced result is created]
4. **Error Handling:** [All possible error scenarios]

**COMPLETE IMPLEMENTATION SPECIFICATION:**

**Types Definition:**

```typescript
// types.ts - Add these exact types
export interface EnhanceRequest {
  content: string;
  type: 'text' | 'description' | 'title' | 'other';
  context?: string;
  options?: {
    style?: 'professional' | 'casual' | 'friendly';
    length?: 'short' | 'medium' | 'long';
  };
}

export interface EnhanceResponse {
  original: string;
  enhanced: string;
  method: 'ai' | 'api' | 'logic';
  confidence: number;
  suggestions?: string[];
  timestamp: string;
}

export interface EnhancementError {
  code: 'INVALID_INPUT' | 'SERVICE_UNAVAILABLE' | 'RATE_LIMITED';
  message: string;
  retryAfter?: number;
}
```
````

**Frontend Component:**

```typescript
// components/[Entity]/EnhancementButton.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';

interface EnhancementButtonProps {
  content: string;
  type: 'text' | 'description' | 'title';
  onEnhanced: (enhanced: string) => void;
  disabled?: boolean;
}

export const EnhancementButton = ({
  content,
  type,
  onEnhanced,
  disabled = false
}: EnhancementButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EnhanceResponse | null>(null);

  const handleEnhance = async () => {
    if (!content.trim()) {
      toast.error('Please enter some content first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/[module]/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getToken()}`
        },
        body: JSON.stringify({
          content: content.trim(),
          type,
          context: 'user_input'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Enhancement failed');
      }

      const data = await response.json();
      setResult(data.data);
    } catch (error) {
      console.error('Enhancement error:', error);
      toast.error(error.message || 'Enhancement failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const acceptEnhancement = () => {
    if (result) {
      onEnhanced(result.enhanced);
      setResult(null);
      toast.success('Enhancement applied');
    }
  };

  return (
    <div className="enhancement-section">
      <Button
        onClick={handleEnhance}
        disabled={disabled || isLoading || !content.trim()}
        variant="outline"
        size="sm"
        className="ml-2"
      >
        {isLoading ? (
          <>
            <Spinner className="w-3 h-3 mr-1" />
            Processing...
          </>
        ) : (
          'Enhance'
        )}
      </Button>

      {result && (
        <div className="mt-2 p-3 bg-muted rounded-md border">
          <div className="text-sm text-muted-foreground mb-2">
            Suggestion (confidence: {Math.round(result.confidence * 100)}%):
          </div>
          <div className="text-sm mb-3 p-2 bg-background rounded border">
            {result.enhanced}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={acceptEnhancement}>
              Use This
            </Button>
            <Button size="sm" variant="outline" onClick={() => setResult(null)}>
              Dismiss
            </Button>
            <Button size="sm" variant="ghost" onClick={handleEnhance}>
              Try Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
```

**Backend Service Method:**

```typescript
// services/EntityService.ts - Add this method
async enhanceContent(params: EnhanceRequest): Promise<EnhanceResponse> {
  try {
    // Input validation
    if (!params.content?.trim()) {
      throw new Error('Content is required');
    }

    if (params.content.length > 5000) {
      throw new Error('Content too long (max 5000 characters)');
    }

    const validTypes = ['text', 'description', 'title'];
    if (!validTypes.includes(params.type)) {
      throw new Error(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Choose enhancement method based on content and requirements
    let enhanced: string;
    let method: 'ai' | 'api' | 'logic';
    let confidence: number;

    if (this.shouldUseAI(params)) {
      const aiResult = await this.enhanceWithAI(params);
      enhanced = aiResult.content;
      method = 'ai';
      confidence = aiResult.confidence;
    } else if (this.shouldUseExternalAPI(params)) {
      const apiResult = await this.enhanceWithAPI(params);
      enhanced = apiResult.content;
      method = 'api';
      confidence = apiResult.confidence;
    } else {
      const logicResult = await this.enhanceWithLogic(params);
      enhanced = logicResult.content;
      method = 'logic';
      confidence = logicResult.confidence;
    }

    return {
      original: params.content,
      enhanced,
      method,
      confidence,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Enhancement failed:', error);
    throw new Error(`Enhancement failed: ${error.message}`);
  }
}

private shouldUseAI(params: EnhanceRequest): boolean {
  // Logic to determine when to use AI
  return params.type === 'text' && params.content.length > 50;
}

private shouldUseExternalAPI(params: EnhanceRequest): boolean {
  // Logic to determine when to use external API
  return params.type === 'description' && params.content.includes('product');
}

private async enhanceWithAI(params: EnhanceRequest): Promise<{content: string, confidence: number}> {
  // Implementation using Gemini AI client
  const prompt = `Improve this ${params.type}: "${params.content}"

  Requirements:
  - Keep the same meaning and intent
  - Make it more ${params.options?.style || 'professional'}
  - Target length: ${params.options?.length || 'medium'}
  - Return only the improved version, no explanations`;

  const response = await geminiClient.generateContent({
    prompt,
    maxTokens: 500
  });

  return {
    content: response.content.trim(),
    confidence: 0.85
  };
}

private async enhanceWithAPI(params: EnhanceRequest): Promise<{content: string, confidence: number}> {
  // Implementation using external API (example: grammar checking service)
  const response = await fetch('https://api.languagetool.org/v2/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      text: params.content,
      language: 'en-US'
    })
  });

  const result = await response.json();
  let enhanced = params.content;

  // Apply corrections
  result.matches.forEach(match => {
    if (match.replacements.length > 0) {
      enhanced = enhanced.replace(
        match.context.text.substring(match.context.offset, match.context.offset + match.context.length),
        match.replacements[0].value
      );
    }
  });

  return {
    content: enhanced,
    confidence: 0.90
  };
}

private async enhanceWithLogic(params: EnhanceRequest): Promise<{content: string, confidence: number}> {
  // Smart logic enhancement
  let enhanced = params.content;

  // Capitalize first letter
  enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);

  // Remove extra spaces
  enhanced = enhanced.replace(/\s+/g, ' ').trim();

  // Add period if missing for sentences
  if (params.type === 'text' && !enhanced.match(/[.!?]$/)) {
    enhanced += '.';
  }

  // Title case for titles
  if (params.type === 'title') {
    enhanced = enhanced.replace(/\w\S*/g, (txt) =>
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  return {
    content: enhanced,
    confidence: 0.75
  };
}
```

**API Handler:**

```typescript
// handlers/enhanceContent.ts
import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { AuthenticatedAPIGatewayEvent } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { successResponse, errorResponse, handleAsyncError } from '../../../shared/response';
import { entityService } from '../services/EntityService';
import { EnhanceRequest } from '../types';

/**
 * @route POST /api/[module]/enhance
 * @description Enhance content using AI, external APIs, or smart logic
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    // Parse request body
    const body: EnhanceRequest = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!body.content) {
      return errorResponse(400, 'MISSING_CONTENT', 'Content is required');
    }

    if (!body.type) {
      return errorResponse(400, 'MISSING_TYPE', 'Type is required');
    }

    // Validate type
    const validTypes = ['text', 'description', 'title'];
    if (!validTypes.includes(body.type)) {
      return errorResponse(400, 'INVALID_TYPE', `Type must be one of: ${validTypes.join(', ')}`);
    }

    // Validate content length
    if (body.content.length > 5000) {
      return errorResponse(400, 'CONTENT_TOO_LONG', 'Content must be less than 5000 characters');
    }

    // Call service
    const result = await entityService.enhanceContent(body);

    return successResponse(result);
  } catch (error) {
    return handleAsyncError(error);
  }
};

export const handler = withRbac(baseHandler, '[moduleName]', 'update');
```

**Function Configuration:**

```yaml
# functions/enhanceContent.yml
enhanceContent:
  handler: src/modules/[module]/handlers/enhanceContent.handler
  events:
    - httpApi:
        path: /api/[module]/enhance
        method: post
        authorizer:
          name: clerkJwtAuthorizer
  environment:
    GEMINI_API_KEY: ${env:GEMINI_API_KEY}
  timeout: 30
  memorySize: 512
```

**Error Handling Scenarios:**

1. **Invalid Input:** Return 400 with specific validation error
2. **Service Unavailable:** Return 503 with retry-after header
3. **Rate Limited:** Return 429 with rate limit info
4. **Timeout:** Return 504 with timeout message
5. **Authentication Failed:** Return 401 with auth error
6. **Permission Denied:** Return 403 with permission error

**Testing Checklist:**

- [ ] Valid input produces expected enhancement
- [ ] Invalid input returns appropriate error
- [ ] Empty content is rejected
- [ ] Content too long is rejected
- [ ] Service failures are handled gracefully
- [ ] Loading states work correctly
- [ ] User can accept/reject suggestions
- [ ] Enhancement integrates properly with form

### Backend Tasks (Skip if Frontend-only)

- [ ] **Handler File:** Create `handlers/[action]Entity.ts` with typed handler

- Import: `AuthenticatedAPIGatewayEvent`, `withRbac`, `successResponse`, `handleAsyncError`

- Pattern: `baseHandler` function + `export const handler = withRbac(baseHandler, 'module', 'action')`

- Always use try-catch with `handleAsyncError(error)` in catch block

- [ ] **Function Config:** Create `functions/[action]Entity.yml` with httpApi event

- Specify handler path: `src/modules/[domain]/handlers/[action]Entity.handler`

- Define HTTP method and path

- Add authorizer: `clerkJwtAuthorizer` (for protected routes)

- [ ] **Service Layer:** Business logic in `services/EntityService.ts`

- Create service class with methods for business logic

- Instantiate service at module level: `const entityService = new EntityService()`

- Keep handlers thin - delegate to service methods

- [ ] **Type Definitions:** Add types to `types.ts` for requests/responses

- Request query/body types

- Response data types

- Service method parameter types

- [ ] **RBAC Verification:** Verify `config/permissions.ts` includes this module
  - Module should already be in `ALL_MODULES` list (configured during planning)
  - Role permissions should already be configured in `ROLE_MODULE_ACCESS`
  - Just verify the module name matches what you're implementing

- [ ] **AWS Service Integration:** **ALWAYS use shared/clients/\* wrappers**
  - **Already Available**: DynamoDB, S3, SES, SQS, Gemini AI clients in `shared/clients/`
  - **For NEW services**: Create new client wrapper following existing patterns
  - **Clerk API**: Direct import OK: `import { createClerkClient } from '@clerk/backend'`
  - **NEVER import @aws-sdk packages directly in handlers or services**

- [ ] **Error Handling:** Use `handleAsyncError()` and `commonErrors.*` consistently

**CRITICAL - NO TESTS:** Do NOT create any test files (.test.ts, .spec.ts) - Skip unit tests for hackathon speed

### Frontend Tasks (Skip if Backend-only)

- [ ] **Pages/Components:** [List specific components to build]

- [ ] **shadcn Components:** [button, form, table, dialog, etc.]

- [ ] **API Integration:** [Which endpoints to call] (Skip if Frontend-only)

- [ ] **State Management:** [Local state, context, or external store]

- [ ] **Routing:** [New routes to add]

- [ ] **Static Content:** [Landing pages, marketing content] (Frontend-only modules)

- [ ] **Responsive Design:** [Mobile-first approach with Tailwind CSS]

**CRITICAL - NO TESTS:** Do NOT create any test files (.test.tsx, .spec.tsx) - Skip unit tests for hackathon speed

### Database Schema (Single Table) - Skip if Frontend-only

```

pk: [ENTITY]#[id] | sk: [TYPE] | gsi1pk: [grouping] | gsi1sk: [sorting]

- entity-specific fields with types and descriptions

```

### Integration Points (For Integration modules only)

- [ ] **Cross-Module API Calls:** [Which modules to integrate]

- [ ] **Shared State Management:** [How modules share data]

- [ ] **Database Relationships:** [GSI-based relationships between modules]

- [ ] **Type Sharing:** [Shared types and interfaces]`

## External Services (if any)

### [Service Name]

- **Purpose:** [Why needed]

- **Setup Steps:**
  1. [Step 1]

  2. [Step 2]

- **Environment Variables:** `SERVICE_API_KEY, SERVICE_ENDPOINT, etc.`

- **NPM Package:** `npm install [package-name]`

- **Code Pattern:** `// Basic integration pattern with error handling`

## Implementation Guide

### Step 0: Study Phase (MANDATORY - Do This First)

**CRITICAL:** You MUST read `guidelines/project-architecture.md` COMPLETELY before writing any code.

**MANDATORY Reading (15-20 minutes):**

1. **Read `guidelines/project-architecture.md` COMPLETELY** (REQUIRED):
   - Complete backend and frontend architecture
   - Technology stack and existing capabilities
   - Database design and patterns
   - Authentication and authorization flow
   - API endpoint conventions
   - Clean architecture layers
   - Existing features (don't rebuild what exists)

2. **Read `guidelines/style-guide.md`** (will be added on event day):
   - Code style and formatting conventions

3. **Study Similar Existing Modules:**
   - Review existing modules in `backend/src/modules/` for patterns
   - Check `backend/src/shared/clients/` for available AWS service clients
   - Examine `client/src/components/admin/` for UI patterns
   - Study `client/src/hooks/` for React Query integration examples

4. **Identify Reusable Patterns:**
   - Follow existing module structure and conventions
   - Use established RBAC and authentication patterns
   - Leverage existing AWS client wrappers
   - Reuse frontend components and hooks

**What to Look For:**

- How are handlers structured?
- How does RBAC middleware work?
- What client wrappers are available?
- How are types shared between backend/frontend?
- What shadcn components exist?
- How is error handling done?

**Time Saved:** 15 min study → Saves 2-3 hours of trial and error

**CRITICAL REMINDER:** When implementing a module, DO NOT create markdown files. Only create code files (.ts, .tsx, .yml, etc.)

---

### Step 1: Backend Implementation (Lambda-Compatible)

**File Structure:**

```

backend/src/modules/[domain]/

├── handlers/

│   ├── listEntity.ts         # GET /api/entities

│   ├── getEntity.ts          # GET /api/entities/:id

│   ├── createEntity.ts       # POST /api/entities

│   ├── updateEntity.ts       # PUT /api/entities/:id

│   └── deleteEntity.ts       # DELETE /api/entities/:id

├── functions/

│   ├── listEntity.yml        # Serverless function config

│   ├── getEntity.yml

│   ├── createEntity.yml

│   ├── updateEntity.yml

│   └── deleteEntity.yml

├── services/

│   └── EntityService.ts      # Business logic and data operations

└── types.ts                  # Domain-specific TypeScript types

```

**Implementation Pattern:**

```typescript
// handlers/[action]Entity.ts - Lambda handler with RBAC wrapper

// services/EntityService.ts - Business logic (Clerk API, DynamoDB, S3, etc.)

// types.ts - TypeScript interfaces for requests/responses

// functions/[action]Entity.yml - Serverless function configuration
```

**Service Layer Example:**

```typescript
// services/EntityService.ts

export class EntityService {
  async listEntities(query: ListQuery): Promise<EntityListResponse> {
    // Business logic here
    // Call external APIs, databases, etc.
  }

  async getEntity(id: string): Promise<Entity> {
    // Fetch single entity
  }

  async createEntity(data: CreateEntityRequest): Promise<Entity> {
    // Create new entity
  }
}
```

### Step 2: Frontend Implementation

**File Structure:**

```

client/src/

├── components/[entity]/

│   ├── [Entity]List.tsx      # List view with shadcn table

│   ├── [Entity]Form.tsx      # Create/edit form with shadcn components

│   ├── [Entity]Card.tsx      # Card component for grid views

│   └── [Entity]Details.tsx   # Detail view component

├── pages/[entity]/

│   ├── [Entity]ListPage.tsx  # List page wrapper

│   ├── [Entity]CreatePage.tsx # Create page wrapper

│   └── [Entity]EditPage.tsx  # Edit page wrapper

├── hooks/

│   └── use[Entity].ts        # API integration hooks

├── services/

│   └── [entity]Api.ts        # API service functions

└── types/

    └── [entity].ts           # Frontend-specific types

```

**Implementation Pattern:**

```typescript
// hooks/use[Entity].ts - React Query or SWR for data fetching

// services/[entity]Api.ts - Axios/fetch wrapper with error handling

// components/[entity]/ - Reusable UI components with TypeScript
```

### Step 3: Serverless Configuration

**Update serverless.yml:**

```yaml
# Add function imports at the end of serverless.yml

functions:
  # ... existing functions ...

  # Import new module functions

  - ${file(src/modules/[domain]/functions/listEntity.yml)}

  - ${file(src/modules/[domain]/functions/getEntity.yml)}

  - ${file(src/modules/[domain]/functions/createEntity.yml)}
```

**Update RBAC permissions (if new module):**

```typescript
// config/permissions.ts

ac.grant('user')

  .readOwn('[moduleName]')

  .createOwn('[moduleName]')

  .updateOwn('[moduleName]')

  .deleteOwn('[moduleName]');

ac.grant('admin')

  .extend('user')

  .readAny('[moduleName]')

  .createAny('[moduleName]')

  .updateAny('[moduleName]')

  .deleteAny('[moduleName]');
```

### Step 4: Integration

- [ ] **Type Check:** Run `bun run typecheck` in both backend and client directories
- [ ] Test API endpoint with Postman/curl
- [ ] Connect frontend to backend
- [ ] Verify data flow end-to-end

**CRITICAL - TypeScript Validation:**

```bash
# Backend type checking
cd backend
bun run typecheck

# Client type checking
cd client
bun run typecheck
```

**Why This Matters:** TypeScript errors will cause deployment failures. Always validate types before completing module implementation.

## LLM Prompts for Implementation

**IMPORTANT - TWO DIFFERENT USE CASES:**

**📅 Use Case 1: Breaking Down Problem Statement (Stage 1)**

- **Input:** Hackathon problem statement
- **Output:** Multiple .md files (one per module)
- **Example:** "Generate module breakdown for this problem statement: [paste problem]"

**🛠️ Use Case 2: Implementing a Specific Module (Stage 2)**

- **Input:** One module's .md file
- **Output:** ONLY code files (.ts, .tsx, .yml) - NO .md files
- **Example:** "Implement docs/module-F01-user-management.md - generate handler, service, and component files"

---

**For Stage 2 Implementation - Instruct your AI:**

```
You are implementing a specific module. Before starting:
1. Study backend/src/modules/users/ for handler patterns
2. Review guidelines/project-architecture.md for architecture patterns
3. Check guidelines/style-guide.md for code conventions (will be added on event day)
4. Follow the exact patterns you see in existing code

IMPORTANT: Generate ONLY code files (.ts, .tsx, .yml).
DO NOT create any markdown files, README files, or documentation.
Focus exclusively on implementation code.
```

---

### Backend Prompts (Lambda-Compatible)

1. **Lambda Handler Creation:**

```

Create a Lambda handler for [specific functionality] following this pattern:

- Import: AuthenticatedAPIGatewayEvent, withRbac, successResponse, handleAsyncError

- Create baseHandler async function with try-catch

- Parse query/body parameters from event

- Call service layer method

- Return successResponse with data

- Catch errors with handleAsyncError

- Export handler wrapped with withRbac(baseHandler, 'moduleName', 'action')

- Add JSDoc comments for route and description

```

2. **Service Layer Creation:**

```

Create a service class [EntityService] for [specific functionality]:

- Export class with methods for business logic

- Use Clerk API / DynamoDB / S3 / external APIs as needed

- Make it stateless (no instance variables for state)

- Use environment variables for configuration

- Throw errors for error cases (handler will catch)

- Return typed responses matching types.ts

```

3. **Function YAML Creation:**

```

Create serverless function config for [action]Entity:

- Function name: [action]Entity

- Handler: src/modules/[domain]/handlers/[action]Entity.handler

- HTTP API event with path /api/[entities] and method [GET/POST/PUT/DELETE]

- Authorizer: clerkJwtAuthorizer (for protected routes)

- Optional: memorySize and timeout overrides if needed

```

### Frontend Prompts

1. **Component Creation:**

```

Create a React component using shadcn/ui for [specific functionality]:

- Use TypeScript with proper types

- Import shadcn components: Button, Card, Table, Dialog, Form, etc.

- Use useApi hook for API calls with loading/error states

- Handle loading state with skeleton or spinner

- Display errors with toast or error message

- Include proper accessibility attributes

```

2. **API Integration with useApi Hook:**

```

Create API integration for [entity] using the useApi hook:

- Import: useApi from '@/hooks'

- Destructure: { data, loading, error, get, post, put, delete }

- Call API methods: await get('/entities'), await post('/entities', data)

- Handle loading state in UI

- Display error messages

- Refresh data after mutations

- Use useEffect for initial data fetch

```

3. **List Page with Table:**

```

Create a list page for [entities] with shadcn Table:

- Use useApi to fetch data

- Display loading skeleton while fetching

- Render Table with columns: [list columns]

- Add action buttons (Edit, Delete) in last column

- Include search/filter functionality

- Add "Create New" button linking to form page

- Handle pagination if needed

```

4. **Form Component:**

```

Create a form component for [entity] using shadcn Form:

- Use react-hook-form with zod validation

- Import Form components from shadcn/ui

- Define zod schema for validation

- Use useApi for POST/PUT requests

- Handle loading state on submit button

- Display validation errors

- Redirect or show success message after save

- Support both create and edit modes

```

## Integration Requirements (For Core Phase Modules M05+)

**CRITICAL:** Foundation modules (F01-F05) are built independently. Core phase modules (M05+) must integrate properly to create a cohesive application.

### Cross-Module Integration Planning

**Data Integration:**

- [ ] **Shared Data Patterns:** Define how this module shares data with foundation modules
  - Example: `User actions in F01 (Users) → Notifications in F04 (Notifications)`
  - Example: `Orders in F01 → Analytics in M10 (Reporting)`

- [ ] **Database Relationships:** Plan GSI-based relationships between modules
  ```typescript
  // Example: Link orders to users
  // User: PK: "USER#123", SK: "PROFILE"
  // Order: PK: "ORDER#456", SK: "DETAILS", GSI1PK: "USER#123", GSI1SK: "ORDER#456"
  ```

**Navigation Integration:**

- [ ] **Unified Navigation:** Replace generic admin dashboard with problem-specific navigation
  - Create domain-specific navigation (e.g., "Student Dashboard", "Teacher Portal", "Course Management")
  - Remove generic "Admin" → "Users" → "Products" navigation
  - Add contextual navigation that reflects user workflows

- [ ] **User Journey Mapping:** Define how users flow between modules
  - Example: Student logs in → Sees courses (F01) → Clicks assignment → Goes to assignments (F03)
  - Example: Teacher creates course (F01) → Adds students → Sends notifications (F04)

**API Integration:**

- [ ] **Cross-Module API Calls:** Define which modules call each other's APIs
  ```typescript
  // Example: Notification module calls User module
  const users = await apiClient.get('/api/users/by-role/student');
  const notifications = await apiClient.post('/api/notifications/bulk', {
    userIds: users.map((u) => u.id),
    message: 'New assignment available',
  });
  ```

**Frontend Integration:**

- [ ] **Shared Components:** Identify reusable components across modules
  - User selection dropdowns, date pickers, status badges
  - Consistent styling and behavior

- [ ] **State Management:** Plan shared state between modules
  ```typescript
  // Example: Current user context shared across modules
  const { currentUser, permissions } = useAuth();
  const { courses } = useCourses(currentUser.id);
  const { notifications } = useNotifications(currentUser.id);
  ```

### Problem-Specific Integration Examples

**For Education Platform:**

- Student Dashboard: Shows courses (F01) + assignments (F03) + notifications (F04)
- Teacher Portal: Manage courses (F01) + create assignments (F03) + send announcements (F04)
- Admin Panel: User management (F01) + system settings (F04) + analytics (M10)

**For E-commerce Platform:**

- Customer Dashboard: Orders (F01) + wishlist (F03) + account settings (F04)
- Seller Portal: Products (F01) + inventory (F03) + notifications (F04)
- Admin Panel: All products + all orders + system management

**For Project Management:**

- Team Dashboard: Projects (F01) + tasks (F03) + team chat (F04)
- Manager View: All projects + team performance + settings
- Client Portal: Project progress + deliverables + communication

### Integration Implementation Checklist

- [ ] **Navigation Update:** Remove generic dashboard, add problem-specific navigation
- [ ] **Shared Types:** Export types that other modules need
  ```typescript
  // Export from F01 for use in other modules
  export type { User, UserRole, UserPermissions } from './types';
  ```
- [ ] **API Client Updates:** Add cross-module API calls
- [ ] **Context Providers:** Share important state across modules
- [ ] **Consistent Styling:** Use same shadcn components and design patterns
- [ ] **Error Handling:** Consistent error handling across integrated features
- [ ] **Loading States:** Consistent loading patterns when modules interact

### Integration Testing

- [ ] **End-to-End Workflows:** Test complete user journeys across modules
- [ ] **Data Consistency:** Verify data flows correctly between modules
- [ ] **Navigation Flow:** Ensure users can navigate naturally between features
- [ ] **Error Scenarios:** Test what happens when one module fails
- [ ] **Performance:** Ensure cross-module calls don't slow down the app

## Acceptance Criteria

- [ ] [Specific, testable requirement 1]
- [ ] [Specific, testable requirement 2]
- [ ] [Specific, testable requirement 3]
- [ ] **Demo Ready:** Can demonstrate complete feature (frontend + backend) in 30 seconds
- [ ] **Full-Stack Working:** Frontend connects to backend, backend connects to database
- [ ] **Lambda Compatible:** Backend code works in serverless environment
- [ ] **Error Handling:** Graceful failure modes implemented
- [ ] **Mobile Responsive:** Works on mobile devices

**CRITICAL - NO TEST FILES:** Do NOT generate any test files (.test.ts, .spec.ts, .test.tsx, .spec.tsx) - Focus on working features only

## Testing Checklist

- [ ] **Backend Unit Tests:** **SKIP FOR HACKATHON** (Time constraint - focus on working features)

- [ ] **Manual API Testing:**

- Test with curl or Postman

- Verify authentication with Clerk token

- Check response format matches ApiResponse type

- Test error cases (401, 403, 404, 500)

- [ ] **Frontend Testing:**

- Manual testing in browser

- Test loading states

- Test error handling

- Test form validation

- Test responsive design on mobile

- [ ] **Integration:** End-to-end flow works as expected

- [ ] **Edge Cases:** Error scenarios handled gracefully

- [ ] **Performance:** Acceptable load times (<2s for API calls)

## Deployment Checklist

- [ ] **CRITICAL - Type Check:** Run `bun run typecheck` in both backend and client
- [ ] **Code Review:** Self-review completed
- [ ] **Serverless Config:** Added function imports to serverless.yml
- [ ] **RBAC Config:** Updated permissions.ts if new module added
- [ ] **Types:** Exported types from module's types.ts for frontend use
- [ ] **Testing:** Manual testing completed
- [ ] **Documentation:** Updated any shared types/interfaces

**MANDATORY Pre-Deployment Commands:**

```bash
# Always run these before deployment
cd backend && bun run typecheck
cd client && bun run typecheck

# Only deploy if both pass without errors
./deploy.sh heet  # or your target environment
```

## Troubleshooting Guide

### Common Issues

1. **401 Unauthorized Error**

- **Symptom:** API returns 401 even with valid Clerk token

- **Solution:**

- Check CLERK_ISSUER_URL in backend/.env matches your Clerk instance

- Verify JWT template in Clerk includes custom claims (role, email, userid)

- Ensure token is passed in Authorization header: `Bearer <token>`

- Check token hasn't expired

2. **403 Forbidden Error**

- **Symptom:** API returns 403 "You don't have permission"

- **Solution:**

- Check user's role in Clerk public_metadata: `{ "role": "user" }` or `{ "role": "admin" }`

- Verify RBAC permissions in config/permissions.ts include the module and action

- Check handler uses correct withRbac wrapper with right module name and action

3. **Handler Not Found / 502 Error**

- **Symptom:** API Gateway returns 502 or "Handler not found"

- **Solution:**

- Verify handler path in YAML matches actual file location

- Check handler exports `handler` function: `export const handler = ...`

- Run `npm run build` to check for TypeScript errors

- Redeploy: `./deploy.sh <stage>`

4. **CORS Error in Browser**

- **Symptom:** Browser blocks request with CORS error

- **Solution:**

- Verify serverless.yml has `httpApi.cors: true`

- Check response includes CORS headers (handled by successResponse/errorResponse)

- For local development, use serverless-offline plugin

5. **Environment Variables Not Working**

- **Symptom:** process.env.VARIABLE is undefined

- **Solution:**

- Check .env file exists in backend/ directory

- Verify serverless.yml includes `useDotenv: true`

- Add variable to provider.environment section in serverless.yml

- Redeploy after changing environment variables

6. **TypeScript Compilation Errors**

- **Symptom:** Build fails with type errors

- **Solution:**

- Run `npm run build` to see full error details

- Check imports match actual file exports

- Verify types.ts includes all required types

- Use `AuthenticatedAPIGatewayEvent` for handler events

7. **Frontend Can't Connect to Backend**

- **Symptom:** API calls fail with network error

- **Solution:**

- Check VITE_API_URL in client/.env points to correct API Gateway URL

- Verify API Gateway URL from deployment output

- Check Clerk token is being sent (inspect Network tab)

- Test API directly with curl to isolate frontend vs backend issue

### Debug Commands

**Backend:**

```bash

# Build and check for errors

cd backend

npm run build

# Run tests

npm test

# Deploy to dev stage

./deploy.sh dev-heet

# View logs

npx serverless logs -f functionName --stage dev-heet --tail

# Test API with curl (replace with your API URL and token)

curl -X GET https://your-api.execute-api.ap-south-1.amazonaws.com/api/entities \

  -H "Authorization: Bearer YOUR_CLERK_TOKEN"

```

**Frontend:**

```bash

# Start dev server

cd client

npm run dev

# Build for production

npm run build

# Preview production build

npm run preview

```

**Get Clerk Token for Testing:**

```javascript
// In browser console on your app

const token = await window.Clerk.session.getToken();

console.log(token);
```

## Related Modules

- **Depends On:** [List modules this depends on]

- **Enables:** [List modules that depend on this]

- **Conflicts With:** [Any modules that might conflict]

---

## Summary of Key Improvements

### 🧩 **Puzzle Piece Architecture (Maximum 10 Modules)**

- **Strategic Limitation:** Maximum 10 modules to ensure each serves a specific purpose
- **Cohesive Design:** Each module is a puzzle piece that fits perfectly with others
- **Purpose-Driven:** Every module contributes to solving the main problem statement
- **No Standalone Apps:** Modules integrate seamlessly rather than feeling like separate applications

### 🏗️ **Existing Services First Priority**

- **Gemini AI Integration:** Prioritize already-implemented AI capabilities (text generation, image creation, JSON output, chat sessions)
- **AWS Services Ready:** S3 storage, SES email, SQS queues, DynamoDB all configured and ready to use
- **Client Wrappers:** Use existing `backend/src/shared/clients/*` - never use AWS SDK directly
- **Proven Infrastructure:** Build on battle-tested, production-ready services first

### 🚀 **Enhanced Foundation Strategy (4 Modules)**

- **F01-F04:** All foundation modules work in parallel with zero dependencies
- **F02 Expansion:** Landing page includes comprehensive marketing pages (FAQ, testimonials, help)
- **Balanced Workload:** F02 being quick allows Dev 2 to help others or add polish
- **Parallel Guarantee:** All 4 developers can start immediately without coordination

### 🤖 **Smart Feature Integration**

- **Existing Services First:** Gemini AI, S3, SES, SQS before any external APIs
- **Simple APIs Second:** No-auth APIs (QR codes, Lorem Picsum) for quick wins
- **Complex APIs Last:** Stripe, Google Maps, Twilio only if essential and time permits
- **Problem-Driven:** All features must solve real problems from the problem statement

### 🔗 **Proper Integration Planning**

- **Phase-Based Integration:** Foundation (independent) → Integration (connected) → Complete (unified)
- **No Generic Dashboard:** Replace with problem-specific navigation and user journeys
- **Cross-Module Data Flow:** Planned GSI-based relationships and API integration patterns
- **Unified User Experience:** Consistent navigation, shared state, and cohesive workflows

### 📋 **Zero Guesswork Implementation**

- **Complete Code Examples:** Full TypeScript implementations with all imports, types, and error handling
- **Existing Service Patterns:** Detailed examples using Gemini AI, S3, SES, SQS clients
- **Integration Requirements:** Detailed cross-module integration planning and implementation
- **Error Handling:** Comprehensive error scenarios and user feedback patterns

### 🎯 **Hackathon-Optimized Workflow**

- **Two-Stage Process:** Planning (generate .md files) → Implementation (code only)
- **RBAC First:** Configure permissions.ts before any module work begins
- **Parallel Foundation:** All developers work simultaneously on independent modules
- **Integration Focus:** Dedicated phase for making modules work together cohesively

### 🛠️ **Technical Excellence**

- **Existing Infrastructure:** Leverage production-ready AWS services and Gemini AI
- **Lambda-Compatible:** All backend code follows serverless patterns
- **Type Safety:** Comprehensive TypeScript patterns and validation
- **Clean Architecture:** Proper separation of handlers, services, and data layers

This updated approach ensures hackathon teams build cohesive, well-integrated applications using existing infrastructure first, with each module serving as a essential puzzle piece in the complete solution rather than disconnected features.

````

**END OF MODULE PLANNING FILE**

---

## Important: Two-Stage Process

### 📅 Stage 1: Problem Statement Breakdown (Generate .md files + permissions.ts)

**When:** Analyzing the hackathon problem statement for the first time

**Input:** Problem statement from hackathon organizers

**Output:**

1. **FIRST:** `backend/src/config/permissions.ts` (RBAC configuration)
2. **THEN:** Multiple markdown files (one per module) in `/docs` directory
   - `docs/module-F01-user-management.md`
   - `docs/module-F02-class-system.md`
   - `docs/module-M05-advanced-features.md`
   - etc.

**Purpose:** Team coordination, task assignment, planning, RBAC setup

**Who Uses It:** Team lead, all developers for understanding scope

**Key Point:** The `permissions.ts` file is generated FIRST because:

- It has zero dependencies on module implementations
- All 4 developers need it before starting parallel work
- It defines the security model for the entire application
- It prevents merge conflicts during parallel development
- **Enables immediate parallel execution of F01, F02, F03, F04**

---

### 🛠️ Stage 2: Individual Module Implementation (Generate code only)

**When:** Developer picks up a specific module to implement

**Input:** One module's markdown file from `/docs` directory (e.g., `docs/module-F01-user-management.md`)

**Output:** ONLY code files - NO markdown files

- `backend/src/modules/users/handlers/listUsers.ts`
- `backend/src/modules/users/services/UserService.ts`
- `backend/src/modules/users/functions/listUsers.yml`
- `client/src/components/users/UserList.tsx`
- etc.

**Purpose:** Rapid implementation, working features

**Who Uses It:** Individual developer implementing that specific module

**CRITICAL:** When implementing a module, LLMs should generate ONLY code files (.ts, .tsx, .yml). NO documentation files (.md, .txt, README).

---

## Quick Reference

### Essential Imports for Backend Handlers

```typescript
import { APIGatewayProxyResultV2 } from 'aws-lambda';

import { AuthenticatedAPIGatewayEvent } from '../../../shared/types';

import { withRbac, withRbacOwn } from '../../../shared/auth/rbacMiddleware';

import { successResponse, handleAsyncError, commonErrors } from '../../../shared/response';
```

### Essential Imports for Frontend Components

```typescript
import { useApi } from '@/hooks';

import { Button } from '@/components/ui/button';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
```

### File Naming Conventions

- **Handlers:** `listEntity.ts`, `getEntity.ts`, `createEntity.ts`, `updateEntity.ts`, `deleteEntity.ts`

- **Functions:** `listEntity.yml`, `getEntity.yml`, `createEntity.yml`, `updateEntity.yml`, `deleteEntity.yml`

- **Services:** `EntityService.ts` (PascalCase)

- **Types:** `types.ts` (lowercase)

- **Components:** `EntityList.tsx`, `EntityForm.tsx`, `EntityCard.tsx` (PascalCase)

- **Pages:** `EntityListPage.tsx`, `EntityCreatePage.tsx`, `EntityEditPage.tsx` (PascalCase)

- **Hooks:** `useEntity.ts` (camelCase with 'use' prefix)

### API Response Format

```typescript

// Success Response

{

"success": true,

"data": { /* your data */ },

"meta": {

"timestamp": "2024-01-01T00:00:00.000Z"

}

}

// Error Response

{

"success": false,

"error": {

"code": "ERROR_CODE",

"message": "Human readable message",

"details": { /* optional details */ }

},

"meta": {

"timestamp": "2024-01-01T00:00:00.000Z"

}

}

```

### Common RBAC Actions

- `read` - View/list resources (GET)

- `create` - Create new resources (POST)

- `update` - Modify existing resources (PUT/PATCH)

- `delete` - Remove resources (DELETE)

### Common HTTP Status Codes

- `200` - OK (successful GET, PUT, DELETE)

- `201` - Created (successful POST)

- `400` - Bad Request (validation error)

- `401` - Unauthorized (missing/invalid token)

- `403` - Forbidden (insufficient permissions)

- `404` - Not Found (resource doesn't exist)

- `500` - Internal Server Error (unexpected error)

## Quality Guidelines

### Module Sizing Rules

- **30-45min modules:** Simple CRUD operations, basic UI components

- **1hr modules:** Complex business logic, external API integration

- **1.5hr modules:** Multi-step workflows, complex UI with state management

- **If >1.5hr:** Break into sub-modules

- **If <20min:** Combine with related module

### Foundation Module Requirements (CRITICAL)

- **F01-F04 MUST have ZERO dependencies on each other - WORK IN PARALLEL**

- **Each foundation module must be Independently Deployable and Demo-Ready**

- **Foundation modules derived from problem statement entities/workflows**

- **All backend code must be Lambda-compatible (stateless, serverless-express)**

- **ALL 4 developers MUST be able to start simultaneously with zero coordination**

- **Module Independence Rules:**
  - **Database Independence:** Each module uses separate PK patterns (e.g., `USER#`, `PRODUCT#`, `ORDER#`)
  - **API Independence:** No cross-module API calls in foundation phase
  - **Frontend Independence:** No shared state or components between foundation modules
  - **Business Logic Independence:** Each module is self-contained and functional alone

### Module Integration Patterns (For Later Phases)

**How Modules Should Integrate (M05+ phases):**

1. **Database Integration:**

   ```typescript
   // Module A creates: PK: "USER#123", SK: "PROFILE"
   // Module B references: GSI1PK: "USER#123", GSI1SK: "ORDER#456"
   // Clean separation with GSI-based relationships
   ```

2. **API Integration:**

   ```typescript
   // Module A exposes: GET /api/users/123
   // Module B calls: await apiClient.get('/api/users/123')
   // Use existing apiClient for cross-module calls
   ```

3. **Frontend Integration:**

   ```typescript
   // Module A exports: useUsers() hook
   // Module B imports: import { useUsers } from '@/hooks/useUsers'
   // Share hooks and components via established patterns
   ```

4. **Type Sharing:**
   ```typescript
   // Shared types in: backend/src/shared/types.ts
   // Module-specific: backend/src/modules/[module]/types.ts
   // Frontend imports: import { User } from '@/types/user'
   ```

### Dependency Management

- **Foundation modules (F01-F04): ZERO dependencies - ALL WORK IN PARALLEL**

- **Core modules (M05+): Maximum 2 dependencies per module**

- **No circular dependencies**

- **Critical path modules should have minimal dependencies**

### Risk Assessment Criteria

- **Low Risk:** Standard CRUD, well-defined scope, no external deps

- **Medium Risk:** External API integration, complex business logic

- **High Risk:** Real-time features, file processing, payment integration

### External Service Guidelines

- **Always prefer real integrations over mocks**

- **Must have free tier or test mode**

- **Setup time must be <30min**

- **Must have fallback/graceful degradation**

## Final Deliverables (Stage 1 - Module Planning)

**CRITICAL ORDER:** Deliverables must be generated in this exact order:

### 1. RBAC Configuration (FIRST - MANDATORY)

**File:** `backend/src/config/permissions.ts`

**Why First:**

- Zero dependencies on any module implementations
- All developers need this before starting work
- Defines the security model for the entire application
- Prevents merge conflicts later

**Content:**

- All roles identified from problem statement
- All modules listed in `ALL_MODULES`
- Complete `ROLE_MODULE_ACCESS` configuration
- Updated `Role` type export

### 2. Executive Summary

**Content:**

- Problem statement analysis
- Solution approach
- Core features (3-5 must-haves)
- Bonus features (2-3 nice-to-haves)
- User roles identified (matching permissions.ts)
- Estimated completion timeline
- Risk assessment

### 3. Module Overview Table

**Content:**

- Foundation modules (F01-F04) listed first
- Core modules (M05+) listed after
- Time estimates, complexity, dependencies, risk level

### 4. Individual Module Files

**Content:**

- One markdown file per module in `/docs` directory: `docs/module-[ID]-[name].md`
- Each file follows the module template structure
- Foundation modules have zero dependencies
- Core modules reference their dependencies
- **Module Type Specification:** Each module clearly marked as Full-stack/Frontend-only/Backend-only/Integration
- **Integration Guidelines:** Later-phase modules include specific integration patterns with foundation modules

### 5. Dependency Graph

**Content:**

- Visual representation of module dependencies
- Foundation phase (parallel work)
- Core features phase (sequential work)

### 6. Team Assignment Strategy

**Content:**

- Phase 1: Foundation modules (hours 0-4)
- Phase 2: Core features (hours 4-12)
- Phase 3: Advanced features (hours 12-20)

### 7. Critical Path Timeline

**Content:**

- Hour-by-hour breakdown
- Parallel vs sequential work phases
- Integration and polish time

### 8. External Services Setup Guide

**Content:**

- Required external services
- Setup instructions
- Free tier availability
- Backup plans
````
