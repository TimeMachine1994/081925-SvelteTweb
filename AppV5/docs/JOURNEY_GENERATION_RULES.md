# Journey Generation Rules

**Version**: 1.0  
**Purpose**: Guide AI agents in analyzing codebases and generating journey documentation files that can be parsed by the Journey Dashboard application.

---

## 1. Journey Definition

A **Journey** is a complete user experience flow through the application, from entry point to outcome. It represents a cohesive narrative of how a specific user persona interacts with the system.

### Root Journeys (Personas)

Your application should define 3-5 root journeys based on user personas:

- **Guest**: Unauthenticated users (browsing → signup → first use)
- **Admin**: Administrative users (login → management tasks → analysis)
- **Creator**: Content creators (dashboard → create → publish)

Each journey **must have exactly 3 sections**:
- **Beginning**: Entry points, discovery, initial interaction, authentication
- **Middle**: Core functionality, transformations, key actions, main workflows
- **End**: Outcomes, completions, next steps, transitions to other journeys

---

## 2. Part of the Journey (POTJ)

A **POTJ** (Part of the Journey) is a discrete, meaningful step in the user's journey. Each POTJ represents a distinct moment or phase in the user experience.

### POTJ Criteria

✅ **INCLUDE a POTJ if it is**:
- A user-facing route or page (`/routes/**/*.svelte`)
- A critical component users directly interact with
- Represents a meaningful state change in user experience
- Has clear "before" and "after" states for the user
- A decision point or branching in the user flow

❌ **EXCLUDE from POTJ if it is**:
- Pure utility functions (unless critical to understanding journey)
- Internal API endpoints (document as dependencies instead)
- Generic layout files (unless journey-specific)
- Reusable UI components (list as dependencies)
- Configuration or constants files

### POTJ Composition

Each POTJ should contain:
1. **Unique ID**: `{journey-id}-{section-letter}-{number}` (e.g., `guest-b-1`)
2. **Title**: Clear, user-focused name (e.g., "Sign Up Flow")
3. **File Reference**: Primary file implementing this step
4. **Description**: 2-3 sentences explaining user experience
5. **Key Behavior**: Bullet points of what happens
6. **Code Reference**: 5-15 lines of critical code
7. **Dependencies**: Direct imports and what they do
8. **Tags**: 2-5 relevant taxonomy tags
9. **Notes**: Optional design decisions or TODOs

---

## 3. Classification Rules

### Level System (L1-L4)

Use the 4-level hierarchy to classify files:

| Level | Name | What to Include | Example Files |
|-------|------|-----------------|---------------|
| **L1** | Journey Container | Top-level route folders that define journey boundaries | `/routes/admin/`, `/routes/creator/` |
| **L2** | Structural Layout | Journey-specific layouts that wrap multiple pages | `/routes/admin/+layout.svelte` |
| **L3** | Logic Connector | Pages, server logic, guards, route-specific components | `/routes/admin/users/+page.svelte`, `/routes/auth/+page.server.ts` |
| **L4** | Atomic Module | Utilities, shared APIs, reusable components, helpers | `/lib/utils/formatDate.ts`, `/lib/components/Button.svelte` |

### Section Classification (Beginning/Middle/End)

Use these guidelines to assign POTJs to sections:

#### Beginning (Entry Phase) 🟢
- First touchpoint in the journey
- Discovery and orientation screens
- Authentication/authorization gates
- Initial data loading or setup
- **Examples**: Landing pages, login forms, onboarding wizards, welcome screens

**Pattern Recognition**:
```
/routes/+page.svelte → Beginning
/routes/login/** → Beginning
/routes/signup/** → Beginning (for Guest)
/routes/onboarding/** → Beginning
```

#### Middle (Action Phase) 🟡
- Core functionality execution
- User performs main tasks and interactions
- CRUD operations, content manipulation
- Search, filtering, configuration
- **Examples**: Editors, dashboards, forms, search interfaces, settings

**Pattern Recognition**:
```
/routes/dashboard/** → Middle
/routes/editor/** → Middle
/routes/settings/** → Middle
/routes/search/** → Middle
/routes/*/edit/** → Middle
```

#### End (Outcome Phase) 🔴
- Completion or success states
- Results, confirmations, and feedback
- Analytics or summary views
- Transition points to next journey
- **Examples**: Success pages, confirmation screens, analytics dashboards, logout

**Pattern Recognition**:
```
/routes/success/** → End
/routes/confirmation/** → End
/routes/complete/** → End
/routes/analytics/** → End
/routes/logout/** → End
```

---

## 4. Codebase Analysis Process

### Step 1: Identify Entry Points

Start from route files in `/src/routes/` directory:

```typescript
// Entry Point Analysis
/routes/+page.svelte               → Guest Beginning
/routes/auth/login/+page.svelte    → Guest/Admin Beginning
/routes/dashboard/+page.svelte     → Guest End / Admin Beginning
/routes/creator/+page.svelte       → Creator Beginning
```

Look for:
- Root `+page.svelte` files
- Authentication routes
- First screens after login
- Landing pages

### Step 2: Follow Import Chains

For each entry point, track its imports to understand dependencies:

```typescript
// Example: +page.svelte
import Hero from '$lib/components/Hero.svelte'
import { fetchUserData } from '$lib/api/users.ts'
import { formatDate } from '$lib/utils/date.ts'

// These become:
// - "Uses @/lib/components/Hero.svelte - Main hero section display"
// - "Calls @/lib/api/users.ts - Fetches authenticated user data"
// - "Uses @/lib/utils/date.ts - Date formatting utility"
```

**Dependency Rules**:
- Only include **direct imports** (not transitive)
- Filter out framework imports (`svelte`, `@sveltejs/*`)
- Skip CSS/style imports
- Focus on components, APIs, and utilities

### Step 3: Determine Journey Membership

Use multiple signals to assign files to journeys:

1. **File Path Analysis**:
   - `/routes/admin/**` → Admin journey
   - `/routes/creator/**` → Creator journey
   - `/routes/` (root) → Guest journey

2. **Authentication Requirements**:
   - `requireAuth()` check → Not Guest journey
   - No auth guard → Likely Guest journey
   - Role checks → Specific journey (Admin, Creator)

3. **Import Relationships**:
   - If only admin pages import it → Admin journey
   - Imported by multiple journeys → Shared (L4)

4. **Metadata Files**:
   - Check for `.meta.md` files with `journey: admin` field
   - Respect explicit journey declarations

5. **Ambiguous Cases**:
   - Shared components → L4 level, no specific journey
   - Used across journeys → Document in multiple journeys

### Step 4: Classify Section (Beginning/Middle/End)

Analyze file purpose and user flow:

```typescript
// Decision Tree
if (isEntryPoint || hasAuthGate) {
  section = "beginning"
} else if (hasFormSubmission || hasCRUD || isMainFeature) {
  section = "middle"
} else if (isConfirmation || showsResults || redirectsToNewJourney) {
  section = "end"
} else {
  section = "middle" // Default fallback
}
```

**Additional Heuristics**:
- Route depth: Deeper routes often = Middle
- Has `+page.server.ts` with actions → Middle
- Redirects to another journey → End
- Shows analytics/summary data → End

### Step 5: Extract Code Context

For each POTJ, identify the most important code to reference:

**Priority Code to Extract**:
1. **Authentication/Authorization logic** (5-10 lines)
2. **Form validation or submission** (10-15 lines)
3. **State management** (5-10 lines)
4. **API calls or data fetching** (5-10 lines)
5. **Key business logic** (10-15 lines)

**Extraction Guidelines**:
- Keep snippets under 15 lines
- Include surrounding context (1-2 lines before/after)
- Preserve function signatures
- Add brief inline comments if logic is complex
- Use actual line numbers from the file

---

## 5. Output Format

### File Naming Convention

```
/journeys/{journey-id}.journey.md
```

Examples:
- `/journeys/guest.journey.md`
- `/journeys/admin.journey.md`
- `/journeys/creator.journey.md`

### Markdown Structure Template

```markdown
---
type: journey
id: {journey-id}
name: {Journey Display Name}
generated: {ISO 8601 timestamp}
generator: windsurf-ai
version: 1.0
---

# {Journey Name}

{1-2 sentence overview describing the complete journey from start to finish}

**User Persona**: {Brief description of who this journey is for}

**Journey Goal**: {What the user aims to accomplish}

---

## 🟢 Beginning

### [POTJ:{journey-id}-b-{number}] {POTJ Title}
**File**: `@{file-path-from-src}`  
**Level**: L{1-4}  
**Tags**: #{tag1} #{tag2} #{tag3}

{2-3 sentence description of what the user experiences at this step. Focus on user actions and system responses, not implementation details.}

**Key Behavior**:
- {User action or system behavior 1}
- {User action or system behavior 2}
- {User action or system behavior 3}

**Code Reference** `@{file-path}:{start-line}-{end-line}`:
```{language}
{actual code excerpt with critical logic}
```

**Dependencies**:
- Uses `@{file-path}` - {brief description of what it provides}
- Calls `@{file-path}` - {brief description of what it does}

**Notes**:
> {Important considerations, design decisions, or TODOs. Optional field.}

---

### [POTJ:{journey-id}-b-{number}] {Next POTJ}
{...repeat structure...}

---

## 🟡 Middle

### [POTJ:{journey-id}-m-{number}] {POTJ Title}
{...same structure as Beginning...}

---

## 🔴 End

### [POTJ:{journey-id}-e-{number}] {POTJ Title}
{...same structure as Beginning...}

---

## Journey Metadata

**Total POTJs**: {count}  
**Files Analyzed**: {count}  
**Last Updated**: {timestamp}
```

---

## 6. Writing Style Guidelines

### Descriptions (User-Focused)

- **Active voice**: "Displays user dashboard" not "User dashboard is displayed"
- **Present tense**: "Validates email" not "Will validate email"
- **User perspective**: Describe what USER experiences, not what code does
- **Concise**: 2-3 sentences maximum per description
- **Avoid jargon**: Use plain language, explain technical terms

**Examples**:

❌ Bad: "This component renders a form with validation handlers"  
✅ Good: "User enters email and password. System validates in real-time and shows helpful error messages."

❌ Bad: "The API endpoint processes the POST request"  
✅ Good: "User submits the form. System creates new account and sends confirmation email."

### Code References (Context-Rich)

- **Include only critical logic**: Authentication, validation, state changes, API calls
- **5-15 lines max**: Enough to understand behavior, not overwhelming
- **Add context**: Brief comment explaining what the snippet shows
- **Complete units**: Don't cut mid-function if possible
- **Actual lines**: Use real line numbers from the file

**Example**:
```typescript
// Email validation before signup
function validateEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(email)) {
    showError('Please enter a valid email');
    return false;
  }
  return true;
}
```

### Tags (Consistent Taxonomy)

Use standardized, lowercase, hyphenated tags from these categories:

**Function Tags**:
- `#authentication`, `#authorization`, `#crud`, `#search`, `#filter`
- `#upload`, `#download`, `#validation`, `#submission`

**UI Tags**:
- `#forms`, `#modal`, `#dashboard`, `#editor`, `#table`
- `#navigation`, `#menu`, `#sidebar`, `#header`

**Data Tags**:
- `#api`, `#database`, `#cache`, `#storage`, `#fetch`

**UX Tags**:
- `#onboarding`, `#tutorial`, `#feedback`, `#loading`, `#error-handling`

**Domain Tags**:
- `#user-management`, `#content-creation`, `#analytics`, `#settings`

---

## 7. AI Agent Workflow

Follow this sequence when generating journey documentation:

```
INPUT: Codebase path + Target journey name (e.g., "guest")

1. SCAN
   → Read /src/routes/ directory structure
   → Identify all .svelte and .ts route files
   → Build file tree of the project

2. FILTER
   → Apply journey membership rules (path, auth, imports)
   → Collect files belonging to target journey
   → Separate into route files (L1-L3) and utilities (L4)

3. CLASSIFY
   → Assign each file to Beginning/Middle/End section
   → Determine level (L1-L4) based on file type and path
   → Order files by user flow sequence

4. ANALYZE
   → Read file contents for each POTJ
   → Extract imports and build dependency list
   → Identify critical code snippets (validation, API calls, state)
   → Generate user-focused descriptions

5. GENERATE
   → Create journey markdown file following template
   → Ensure unique POTJ IDs across all sections
   → Validate all file paths exist
   → Check line numbers for code references

6. VALIDATE
   → All [POTJ:id] references are unique
   → File paths use @/ prefix and exist
   → Code references include valid line numbers
   → Each section has 1-5 POTJs (not empty or overcrowded)
   → Tags follow taxonomy

7. OUTPUT
   → Save to /journeys/{journey-id}.journey.md
   → Log summary statistics
   → Report any warnings or ambiguities

ERROR HANDLING:
- If ambiguous: Add note for human review
- If missing file: Skip and log warning
- If cannot classify: Default to Middle section
```

---

## 8. Pattern Matching Examples

### Route to Section Mapping

```typescript
// BEGINNING PATTERNS
/routes/+page.svelte                    → Guest Beginning
/routes/login/+page.svelte              → Guest/Admin Beginning
/routes/signup/+page.svelte             → Guest Beginning
/routes/onboarding/+page.svelte         → Guest Beginning (End for signup flow)
/routes/welcome/+page.svelte            → Beginning

// MIDDLE PATTERNS
/routes/dashboard/+page.svelte          → Middle (or End for Guest)
/routes/editor/+page.svelte             → Creator Middle
/routes/settings/+page.svelte           → Any journey Middle
/routes/search/+page.svelte             → Middle
/routes/users/+page.svelte              → Admin Middle
/routes/content/edit/+page.svelte       → Creator Middle

// END PATTERNS
/routes/success/+page.svelte            → End
/routes/confirmation/+page.svelte       → End
/routes/complete/+page.svelte           → End
/routes/analytics/+page.svelte          → Admin End
/routes/published/+page.svelte          → Creator End
/routes/logout/+page.svelte             → End
```

### Import to Dependency Mapping

```typescript
// FILE: /routes/dashboard/+page.svelte
import Header from '$lib/components/Header.svelte'
import { getUser } from '$lib/api/users.ts'
import { formatDate } from '$lib/utils/date.ts'

// BECOMES IN JOURNEY FILE:
**Dependencies**:
- Uses `@/lib/components/Header.svelte` - Navigation and user menu
- Calls `@/lib/api/users.ts` - Fetches authenticated user profile
- Uses `@/lib/utils/date.ts` - Formats timestamps for display
```

### Code Extraction Examples

```typescript
// EXAMPLE 1: Authentication Check
**Code Reference** `@/routes/dashboard/+page.server.ts:15-22`:
```typescript
export async function load({ locals }) {
  if (!locals.user) {
    throw redirect(303, '/login');
  }
  return {
    user: locals.user
  };
}
```

// EXAMPLE 2: Form Validation
**Code Reference** `@/routes/signup/+page.svelte:45-58`:
```typescript
async function handleSubmit() {
  if (!validateEmail(email)) {
    error = 'Invalid email format';
    return;
  }
  if (password.length < 8) {
    error = 'Password must be at least 8 characters';
    return;
  }
  await signup({ email, password });
}
```

// EXAMPLE 3: API Call
**Code Reference** `@/routes/content/+page.svelte:32-38`:
```typescript
onMount(async () => {
  loading = true;
  const response = await fetch('/api/content');
  content = await response.json();
  loading = false;
});
```
```

---

## 9. Quality Checklist

Before finalizing and outputting the journey file, verify:

### Structure
- [ ] YAML frontmatter includes all required fields
- [ ] Journey has exactly 3 sections (Beginning, Middle, End)
- [ ] Each section has 1-5 POTJs (not empty, not overcrowded)
- [ ] Section ordering makes logical sense for user flow

### POTJ Content
- [ ] Each POTJ has unique ID following pattern: `{journey}-{section}-{number}`
- [ ] File paths use `@/` prefix relative to src directory
- [ ] File paths have been verified to exist in codebase
- [ ] Level (L1-L4) is appropriate for file type
- [ ] Tags are lowercase, hyphenated, from taxonomy

### Code References
- [ ] Code snippets are 5-15 lines
- [ ] Line numbers are accurate and match file content
- [ ] Language identifier is correct (typescript, svelte, javascript)
- [ ] Code compiles and is syntactically valid
- [ ] Snippets show meaningful logic (not imports or styling)

### Dependencies
- [ ] Only direct imports are listed
- [ ] Framework imports excluded (svelte, sveltekit)
- [ ] Each dependency has brief description
- [ ] File paths are correct and exist

### Writing Quality
- [ ] Descriptions are user-focused and clear
- [ ] Present tense, active voice used consistently
- [ ] Technical jargon explained or avoided
- [ ] 2-3 sentences per description (not paragraphs)
- [ ] No duplicate content across POTJs

### Validation
- [ ] No duplicate POTJ IDs
- [ ] All cross-references are valid
- [ ] Markdown renders correctly
- [ ] No broken file paths or line numbers
- [ ] Total POTJ count is reasonable (5-15 per journey)

---

## 10. Error Handling and Edge Cases

### Ambiguous Journey Membership

**Problem**: File could belong to multiple journeys (e.g., shared dashboard)

**Solution**:
1. Assign to most specific journey (Admin over Guest if role-gated)
2. Add `#shared` tag to indicate multi-journey usage
3. Add note: `> This component is shared across Admin and Creator journeys`
4. Consider creating separate POTJ entries in each journey if behavior differs

### Cannot Determine Section

**Problem**: Unclear if file belongs to Beginning, Middle, or End

**Solution**:
1. Default to Middle section (safest choice)
2. Add `#needs-review` tag
3. Add note: `> Section classification needs human review - file could be Beginning or Middle`

### No Clear Entry Point

**Problem**: Orphaned file with no route importing it

**Solution**:
1. Skip from journey documentation (it's likely unused)
2. Log warning for human review
3. If confirmed as utility, add to Level 4 dependencies only

### File Path Doesn't Exist

**Problem**: Import references file that's not found

**Solution**:
1. Log error with file path
2. Skip the dependency reference
3. Add note: `> Warning: Referenced file not found during generation`

### Code Extract Too Long

**Problem**: Critical logic spans 30+ lines

**Solution**:
1. Extract most important 15 lines (function signature + key logic)
2. Add ellipsis `// ...` to indicate omitted code
3. Add note: `> See full implementation in file for complete logic`

### Circular Dependencies

**Problem**: Files import each other

**Solution**:
1. Document both as dependencies
2. Add note explaining the relationship
3. Suggest refactoring if it indicates design issue

---

## 11. Example Output

Here's a minimal but complete example:

```markdown
---
type: journey
id: guest
name: Guest Journey
generated: 2025-12-23T19:30:00Z
generator: windsurf-ai
version: 1.0
---

# Guest Journey

New visitors explore the platform, discover value, and create their first account.

**User Persona**: Unauthenticated visitor exploring the platform for the first time

**Journey Goal**: Learn about features and successfully create an account

---

## 🟢 Beginning

### [POTJ:guest-b-1] Landing Page
**File**: `@/routes/+page.svelte`  
**Level**: L3  
**Tags**: #marketing #ui #entry-point

User arrives at homepage and sees value proposition, features, and call-to-action. Hero section highlights main benefits while feature cards showcase capabilities.

**Key Behavior**:
- Displays animated hero section with primary CTA
- Shows three feature cards with icons and descriptions
- Tracks page visit analytics
- Provides navigation to signup or browse content

**Code Reference** `@/routes/+page.svelte:15-23`:
```typescript
const features = [
  { icon: '🎯', title: 'Smart Organization', desc: 'Keep track of everything' },
  { icon: '⚡', title: 'Lightning Fast', desc: 'Optimized performance' },
  { icon: '🔒', title: 'Secure', desc: 'Your data is protected' }
];
```

**Dependencies**:
- Uses `@/lib/components/Hero.svelte` - Main hero section with CTA
- Uses `@/lib/components/FeatureCard.svelte` - Feature display cards
- Calls `@/lib/api/analytics.ts` - Tracks visitor metrics

**Notes**:
> Mobile-first design. CTA button should be above the fold on all devices.

---

## 🟡 Middle

### [POTJ:guest-m-1] Sign Up Flow
**File**: `@/routes/auth/signup/+page.svelte`  
**Level**: L3  
**Tags**: #authentication #forms #validation

User completes registration form with email and password. System validates input in real-time and creates account upon submission.

**Key Behavior**:
- Validates email format as user types
- Enforces password requirements (8+ characters)
- Shows helpful error messages
- Creates account and sends verification email

**Code Reference** `@/routes/auth/signup/+page.svelte:45-58`:
```typescript
async function handleSubmit() {
  if (!validateEmail(email)) {
    error = 'Please enter a valid email address';
    return;
  }
  if (password.length < 8) {
    error = 'Password must be at least 8 characters';
    return;
  }
  await createAccount({ email, password });
  goto('/dashboard');
}
```

**Dependencies**:
- Calls `@/lib/api/auth.ts` - Account creation API
- Uses `@/lib/utils/validation.ts` - Email validation logic
- Uses `@/lib/components/FormInput.svelte` - Styled input fields

---

## 🔴 End

### [POTJ:guest-e-1] Welcome Dashboard
**File**: `@/routes/dashboard/+page.svelte`  
**Level**: L3  
**Tags**: #dashboard #onboarding #success

User sees their new dashboard for the first time with welcome message and getting started guide. System displays empty state prompts to encourage first actions.

**Key Behavior**:
- Shows personalized welcome message with user's name
- Displays "Getting Started" checklist
- Provides quick action buttons for common tasks
- Tracks onboarding completion

**Code Reference** `@/routes/dashboard/+page.svelte:28-35`:
```typescript
export async function load({ locals }) {
  const user = locals.user;
  const tasks = await getOnboardingTasks(user.id);
  return {
    user,
    isNewUser: user.createdAt > Date.now() - 86400000
  };
}
```

**Dependencies**:
- Uses `@/lib/components/WelcomeBanner.svelte` - Welcome message display
- Uses `@/lib/components/TaskChecklist.svelte` - Onboarding task list
- Calls `@/lib/api/onboarding.ts` - Fetches onboarding status

**Notes**:
> This marks transition from Guest to authenticated User journey.

---

## Journey Metadata

**Total POTJs**: 3  
**Files Analyzed**: 12  
**Last Updated**: 2025-12-23T19:30:00Z
```

---

## 12. Usage Instructions

### For AI Agents

When generating journey documentation:

```bash
# Command line usage
windsurf-agent generate-journey \
  --project /path/to/project \
  --journey guest \
  --rules ./docs/JOURNEY_GENERATION_RULES.md \
  --output ./journeys/guest.journey.md
```

The agent should:
1. Load and parse this rules file
2. Apply classification and analysis logic
3. Generate structured markdown following templates
4. Validate output against quality checklist
5. Save to specified output path

### For Human Reviewers

After AI generation:
1. Review POTJ classifications (Beginning/Middle/End make sense?)
2. Verify code references are meaningful and accurate
3. Check that descriptions are user-focused
4. Ensure journey tells a coherent story
5. Add any missing notes or design decisions
6. Update file manually as codebase evolves

### For Dashboard Application

The generated `.journey.md` files should be:
1. Placed in `/journeys/` directory
2. Scanned by dashboard on startup
3. Parsed using frontmatter parser (gray-matter)
4. Converted to `RootJourney` type structure
5. Displayed in the journey dashboard UI

---

## Version History

- **v1.0** (2025-12-23): Initial rules specification
