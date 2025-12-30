# Data Flow Visualization Specification

> **Status:** Implementation in Progress  
> **Created:** December 29, 2025  
> **Purpose:** Add visual data/props flow tracking to journey maps

---

## Problem Statement

Currently, journey maps show components and their relationships through dependencies, but don't explicitly visualize:
- What props/data flows INTO each component
- What props/data flows OUT to child components
- What events/callbacks are emitted upward
- What global state/stores are accessed

This makes it harder to understand component communication patterns and debug data flow issues.

---

## Solution Overview

Add **Data Flow** metadata to journey POTJs that explicitly documents:
1. **Receives** - Props/data coming IN from parent/API
2. **Provides** - Props/data going OUT to children
3. **Emits** - Events/callbacks sent upward to parent
4. **Stores** - Global state accessed (read/write)

Display this information:
- **In ProfileView** - Structured section showing all data flows
- **In JourneyGrid** - Visual arrows/indicators between POTJs
- **Interactive** - Click props to highlight source/destination

---

## Journey Markdown Format

### Data Flow Section Syntax

Add after existing POTJ fields (Tags, Dependencies, etc.):

```markdown
### [POTJ:developer-m-1] Journey Dashboard View
**Type**: component
**File**: `@/lib/components/JourneyDashboard.svelte`
**Level**: L4
**Tags**: #dashboard #state-management

Component orchestrates 4-column layout and manages global dashboard state.

**Data Flow**:
- **Receives**:
  - `journeys: RootJourney[]` - Journey data from API load
  - `files: FileProfile[]` - File profiles from API load
  - `projectPath: string` - Project root directory path
- **Provides**:
  - `activeJourney: string` - To JourneyGrid, CodeBank (active journey ID)
  - `selectedPOTJ: POTJ | null` - To ProfileView (currently selected POTJ)
  - `selectedFile: FileProfile | null` - To CodeViewer (file to display)
  - `projectPath: string` - To CodeViewer (for file path resolution)
- **Emits**:
  - `handleSelectJourney(id: string)` - Journey tab clicked
  - `handleSelectPOTJ(potj: POTJ)` - POTJ card clicked in grid
  - `handleSelectFile(file: FileProfile)` - File clicked in bank/profile
- **Stores**:
  - `state: DashboardState` - Local reactive state (read/write)

**Key Behavior**:
- Maintains single source of truth for dashboard state
- Passes down read-only props to child components
- Receives events from children to update state
```

### Parsing Rules

Each data flow item follows pattern:
```
- `propName: TypeAnnotation` - Human description [optional metadata]
```

Examples:
```markdown
- `journeys: RootJourney[]` - Journey data from API load
- `onSelectPOTJ: (potj: POTJ) => void` - POTJ selection callback
- `state` - Local reactive state (read/write)
```

**Field Definitions:**
- **Receives** = Props passed TO this component (input)
- **Provides** = Props passed FROM this component to children (output)
- **Emits** = Functions/callbacks called to notify parent (events)
- **Stores** = Global state accessed via stores or context

---

## TypeScript Interface Definitions

### New Interfaces

```typescript
// src/lib/types/journey.ts

export interface DataFlow {
  receives?: DataFlowItem[];
  provides?: DataFlowItem[];
  emits?: DataFlowItem[];
  stores?: DataFlowItem[];
}

export interface DataFlowItem {
  name: string;              // Prop/event name (e.g., "journeys", "onSelectPOTJ")
  type?: string;             // TypeScript type annotation (e.g., "RootJourney[]")
  description: string;       // Human-readable description
  destination?: string;      // For "provides": which component receives it
  source?: string;           // For "receives": where it comes from
}
```

### Extended POTJ Interface

```typescript
export interface POTJ {
  id: string;
  title: string;
  moduleType?: ModuleType;
  description?: string;
  section: JourneySectionType;
  fileRef?: string;
  metadata?: JourneyMetadata;
  tags?: string[];
  notes?: string[];
  keyBehavior?: string[];
  codeReference?: CodeReference;
  dependencies?: string[];
  routes?: string[];
  linkedRoutes?: string[];
  parentLayout?: string;
  isExpandable?: boolean;
  chatHistory?: ChatMessage[];
  dataFlow?: DataFlow;          // ← NEW FIELD
}
```

---

## Parser Implementation

### journey-parser.ts Updates

Add data flow parsing to `parsePOTJsFromSection()`:

```typescript
function parsePOTJsFromSection(content: string, section: JourneySectionType): POTJ[] {
  // ... existing parsing logic ...
  
  // Parse Data Flow section
  const dataFlowMatch = potjContent.match(/\*\*Data Flow\*\*:\s*\n([\s\S]+?)(?=\n\*\*[A-Z]|\n###|$)/);
  if (dataFlowMatch) {
    potj.dataFlow = parseDataFlow(dataFlowMatch[1]);
  }
  
  // ... rest of POTJ construction ...
}

function parseDataFlow(content: string): DataFlow | undefined {
  const dataFlow: DataFlow = {};
  
  // Parse "Receives" section
  const receivesMatch = content.match(/- \*\*Receives\*\*:\s*\n((?:  - .+\n?)+)/);
  if (receivesMatch) {
    dataFlow.receives = parseDataFlowItems(receivesMatch[1]);
  }
  
  // Parse "Provides" section
  const providesMatch = content.match(/- \*\*Provides\*\*:\s*\n((?:  - .+\n?)+)/);
  if (providesMatch) {
    dataFlow.provides = parseDataFlowItems(providesMatch[1]);
  }
  
  // Parse "Emits" section
  const emitsMatch = content.match(/- \*\*Emits\*\*:\s*\n((?:  - .+\n?)+)/);
  if (emitsMatch) {
    dataFlow.emits = parseDataFlowItems(emitsMatch[1]);
  }
  
  // Parse "Stores" section
  const storesMatch = content.match(/- \*\*Stores\*\*:\s*\n((?:  - .+\n?)+)/);
  if (storesMatch) {
    dataFlow.stores = parseDataFlowItems(storesMatch[1]);
  }
  
  return Object.keys(dataFlow).length > 0 ? dataFlow : undefined;
}

function parseDataFlowItems(text: string): DataFlowItem[] {
  const items: DataFlowItem[] = [];
  const lines = text.split('\n').filter(line => line.trim().startsWith('- '));
  
  for (const line of lines) {
    const item = parseDataFlowItem(line);
    if (item) items.push(item);
  }
  
  return items;
}

function parseDataFlowItem(line: string): DataFlowItem | null {
  // Pattern: - `propName: Type` - Description [to/from Target]
  const fullMatch = line.match(/- `([^:]+)(?::\s*([^`]+))?`\s*-\s*(.+?)(?:\s+to\s+(.+?))?(?:\s+from\s+(.+?))?$/);
  
  if (fullMatch) {
    const [, name, type, description, destination, source] = fullMatch;
    return {
      name: name.trim(),
      type: type?.trim(),
      description: description.trim(),
      destination: destination?.trim(),
      source: source?.trim()
    };
  }
  
  // Fallback: just extract name and description
  const simpleMatch = line.match(/- `([^`]+)`\s*-\s*(.+)/);
  if (simpleMatch) {
    const [, name, description] = simpleMatch;
    return {
      name: name.trim(),
      description: description.trim()
    };
  }
  
  return null;
}
```

---

## UI Component Updates

### 1. ProfileView.svelte - Data Flow Section

Add new section after Dependencies, before Chat:

```svelte
<!-- Data Flow Section -->
{#if selectedPOTJ?.dataFlow}
  <div class="section data-flow-section">
    <h3 class="section-title">📊 Data Flow</h3>
    
    {#if selectedPOTJ.dataFlow.receives?.length}
      <div class="flow-group receives">
        <h4 class="flow-heading">📥 Receives (Props In)</h4>
        <ul class="flow-list">
          {#each selectedPOTJ.dataFlow.receives as item}
            <li class="flow-item">
              <code class="flow-name">{item.name}</code>
              {#if item.type}
                <span class="flow-type">: {item.type}</span>
              {/if}
              {#if item.description}
                <p class="flow-desc">{item.description}</p>
              {/if}
              {#if item.source}
                <span class="flow-meta">from {item.source}</span>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {/if}
    
    {#if selectedPOTJ.dataFlow.provides?.length}
      <div class="flow-group provides">
        <h4 class="flow-heading">📤 Provides (Props Out)</h4>
        <ul class="flow-list">
          {#each selectedPOTJ.dataFlow.provides as item}
            <li class="flow-item">
              <code class="flow-name">{item.name}</code>
              {#if item.type}
                <span class="flow-type">: {item.type}</span>
              {/if}
              {#if item.destination}
                <span class="flow-meta">→ {item.destination}</span>
              {/if}
              {#if item.description}
                <p class="flow-desc">{item.description}</p>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {/if}
    
    {#if selectedPOTJ.dataFlow.emits?.length}
      <div class="flow-group emits">
        <h4 class="flow-heading">⚡ Emits (Events Up)</h4>
        <ul class="flow-list">
          {#each selectedPOTJ.dataFlow.emits as item}
            <li class="flow-item">
              <code class="flow-name">{item.name}</code>
              {#if item.type}
                <span class="flow-type">: {item.type}</span>
              {/if}
              {#if item.description}
                <p class="flow-desc">{item.description}</p>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {/if}
    
    {#if selectedPOTJ.dataFlow.stores?.length}
      <div class="flow-group stores">
        <h4 class="flow-heading">🌐 State Access</h4>
        <ul class="flow-list">
          {#each selectedPOTJ.dataFlow.stores as item}
            <li class="flow-item">
              <code class="flow-name">{item.name}</code>
              {#if item.description}
                <p class="flow-desc">{item.description}</p>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
{/if}
```

**Styling:**
```css
.data-flow-section {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-left: 4px solid #0ea5e9;
  padding: 1rem;
  border-radius: 8px;
}

.flow-group {
  margin-bottom: 1rem;
}

.flow-heading {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.flow-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.flow-item {
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.flow-name {
  font-family: 'Courier New', monospace;
  font-size: 0.8125rem;
  color: #1e40af;
  font-weight: 600;
}

.flow-type {
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  color: #64748b;
}

.flow-desc {
  margin: 0.25rem 0 0 0;
  font-size: 0.8125rem;
  color: #475569;
  line-height: 1.5;
}

.flow-meta {
  font-size: 0.75rem;
  color: #0ea5e9;
  font-weight: 500;
  margin-left: 0.5rem;
}

.receives { border-left: 3px solid #10b981; }
.provides { border-left: 3px solid #3b82f6; }
.emits { border-left: 3px solid #f59e0b; }
.stores { border-left: 3px solid #8b5cf6; }
```

### 2. JourneyGrid.svelte - Visual Flow Indicators

Add flow indicators below POTJ cards:

```svelte
<!-- After POTJ card content -->
{#if item.dataFlow?.provides && item.dataFlow.provides.length > 0}
  <div class="data-flow-indicators">
    <div class="flow-arrow-container">
      {#each item.dataFlow.provides.slice(0, 3) as flow}
        <div 
          class="flow-arrow"
          title="{flow.name}{flow.type ? ': ' + flow.type : ''}"
        >
          <span class="arrow-line">│</span>
          <span class="arrow-head">↓</span>
          <span class="flow-label">{flow.name}</span>
        </div>
      {/each}
      {#if item.dataFlow.provides.length > 3}
        <span class="flow-more">+{item.dataFlow.provides.length - 3} more</span>
      {/if}
    </div>
  </div>
{/if}
```

**Styling:**
```css
.data-flow-indicators {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px dashed #cbd5e1;
}

.flow-arrow-container {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  flex-wrap: wrap;
}

.flow-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
  cursor: help;
  transition: all 0.2s ease;
}

.flow-arrow:hover {
  transform: translateY(2px);
}

.arrow-line {
  color: #94a3b8;
  font-size: 1rem;
  line-height: 1;
}

.arrow-head {
  color: #3b82f6;
  font-size: 1.25rem;
  line-height: 1;
}

.flow-label {
  font-size: 0.625rem;
  color: #64748b;
  font-family: 'Courier New', monospace;
  max-width: 4rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flow-more {
  font-size: 0.625rem;
  color: #94a3b8;
  align-self: flex-end;
}
```

---

## Example: Updated Developer Journey

### JourneyDashboard POTJ with Data Flow

```markdown
### [POTJ:developer-m-1] Journey Dashboard View
**Type**: component
**File**: `@/lib/components/JourneyDashboard.svelte`  
**Level**: L4  
**Tags**: #dashboard #journey #visualization #interaction

Developer sees the 4-column dashboard layout orchestrating journey navigation, POTJ details, code viewing, and file browsing.

**Data Flow**:
- **Receives**:
  - `journeys: RootJourney[]` - Journey data from API load
  - `files: FileProfile[]` - File profiles from API load
  - `projectPath: string` - Project root directory path
- **Provides**:
  - `activeJourney: string` - To JourneyGrid, CodeBank
  - `selectedPOTJ: POTJ | null` - To ProfileView
  - `selectedFile: FileProfile | null` - To CodeViewer
  - `projectPath: string` - To CodeViewer
- **Emits**:
  - `handleSelectJourney(id: string)` - Journey tab clicked
  - `handleSelectPOTJ(potj: POTJ)` - POTJ card clicked
  - `handleSelectFile(file: FileProfile)` - File clicked
- **Stores**:
  - `state: DashboardState` - Local reactive state (read/write)

**Key Behavior**:
- Maintains single source of truth for dashboard state
- Orchestrates communication between 4 child components
- Updates state reactively when user interactions occur
- Passes projectPath for file resolution security
```

### ProfileView POTJ with Data Flow

```markdown
### [POTJ:developer-m-3] Profile View - POTJ Details
**Type**: component
**File**: `@/lib/components/ProfileView.svelte`  
**Level**: L4  
**Tags**: #profile #details #metadata

Second column shows detailed information about selected POTJ or file.

**Data Flow**:
- **Receives**:
  - `selectedPOTJ: POTJ | null` - From JourneyDashboard
  - `selectedFile: FileProfile | null` - From JourneyDashboard
  - `viewMode: 'potj' | 'file'` - Display mode
  - `files: FileProfile[]` - Available files
- **Provides**:
  - None (leaf component)
- **Emits**:
  - `onSelectFile(file: FileProfile)` - Dependency clicked
- **Stores**:
  - `chatMessages` - Chat history for context (read/write)

**Key Behavior**:
- Displays POTJ metadata, behavior, dependencies
- Integrates AI chat interface at bottom
- Allows clicking dependencies to load in Code Viewer
```

---

## Implementation Timeline

### Phase 1: Foundation (1 hour)
1. ✅ Create DATA_FLOW_SPEC.md
2. Update `src/lib/types/journey.ts` with DataFlow interfaces
3. Test TypeScript compilation

### Phase 2: Parser (1.5 hours)
4. Add data flow parsing functions to `journey-parser.ts`
5. Test parser with sample markdown
6. Verify parsed data structure

### Phase 3: ProfileView UI (1.5 hours)
7. Add Data Flow section to ProfileView
8. Style flow groups (receives, provides, emits, stores)
9. Test with sample POTJ data

### Phase 4: JourneyGrid Visuals (1 hour)
10. Add flow arrow indicators to POTJ cards
11. Style arrows and tooltips
12. Test hover states

### Phase 5: Documentation (30 min)
13. Update developer.journey.md with data flow examples
14. Add 4-5 POTJs with complete data flow documentation
15. Test end-to-end with real journey

**Total Estimated Time: 5.5 hours**

---

## Testing Checklist

- [ ] TypeScript compiles without errors
- [ ] Parser extracts data flow from markdown correctly
- [ ] ProfileView displays all 4 flow types (receives, provides, emits, stores)
- [ ] JourneyGrid shows flow arrows on POTJs with data flow
- [ ] Hover tooltips display prop names and types
- [ ] Styling matches existing design system
- [ ] Data flow info visible in developer.journey.md
- [ ] No performance impact on dashboard render time

---

## Success Metrics

1. **Clarity**: Developers immediately understand component communication
2. **Debugging**: Can trace where props come from and go to
3. **Documentation**: Self-documenting architecture through journey maps
4. **Adoption**: Data flow added to 80%+ of component POTJs

---

## Future Enhancements

1. **Interactive Flow Diagram**: Canvas-based visual showing full data flow paths
2. **Click-to-Navigate**: Click prop name to jump to source/destination POTJ
3. **Type Validation**: Verify TypeScript types match between provider/receiver
4. **Auto-Detection**: Parse actual Svelte components to extract data flows automatically
5. **Performance Tracking**: Show which props trigger re-renders
6. **Store Visualization**: Dedicated view for global state flows
