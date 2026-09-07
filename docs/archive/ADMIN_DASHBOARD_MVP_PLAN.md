# Tributestream Admin Dashboard MVP Plan

## 🎯 Simplified MVP Focus

Create a streamlined admin dashboard with **3 core elements only**:

## 📋 MVP Requirements (Simplified)

### 1. 🗂️ **5 Main Tabs**
- **Overview**: System metrics and quick stats
- **Memorials**: Memorial management
- **Users**: User account management  
- **Purchases**: Payment and transaction tracking
- **Streams**: Stream monitoring and management

### 2. 🎨 **Clean Tabbed Interface**
- Minimal Modern design system integration
- Professional navigation with gold accents (#D5BA7F)
- Responsive layout with ABeeZee typography

### 3. ⚙️ **Full CRUD Operations**
- **Create**: Add new memorials, users (admin creation)
- **Read**: View all data with search and filtering
- **Update**: Edit existing records inline
- **Delete**: Remove entries with confirmation dialogs

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend**: SvelteKit with Svelte 5 runes
- **Backend**: Firebase Firestore + Firebase Auth
- **Streaming**: Cloudflare Stream integration
- **Design System**: Minimal Modern theme with ABeeZee typography
- **Styling**: Tailwind CSS with gold accent colors (#D5BA7F)

### Current Admin Infrastructure
- Existing admin portal at `/admin` with basic functionality
- Firebase Admin SDK integration
- Role-based access control (admin, owner, funeral_director, viewer)
- Audit logging system
- API endpoints at `/api/admin/*`

## 📊 Simplified Dashboard Structure

### Tab Layout
```
┌─────────────────────────────────────────────────────┐
│ 🏛️ Tributestream Admin Dashboard                    │
├─────────────────────────────────────────────────────┤
│ 📊 Overview | 💝 Memorials | 👥 Users |            │
│ 💰 Purchases | 🎥 Streams                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│              Active Tab Content                     │
│              (CRUD Operations)                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Tab Functions

#### 📊 Overview Tab
- System metrics cards (totals)
- Quick action buttons

#### 💝 Memorials Tab  
- **CRUD Operations**: Create, Read, Update, Delete memorials
- Table view with search/filter
- Edit memorial details inline

#### 👥 Users Tab
- **CRUD Operations**: Create, Read, Update, Delete users  
- User management table
- Role changes and account actions

#### 💰 Purchases Tab
- **CRUD Operations**: View, Update purchase records
- Payment tracking table
- Transaction management

#### 🎥 Streams Tab
- **CRUD Operations**: View, Update, Delete stream records
- Stream monitoring table  
- Stream management controls

## 🔧 Implementation Plan (Simplified)

### Step 1: Tabbed Interface
- Create `/admin/mvp-dashboard` route
- Build tab navigation with Minimal Modern styling
- Set up tab switching logic

### Step 2: CRUD Infrastructure  
- Create data loading functions for each tab
- Build reusable CRUD components (tables, forms, modals)
- Implement confirmation dialogs for delete operations

### Step 3: Tab Implementation
- **Overview**: Metrics cards with totals
- **Memorials**: Table with inline editing and delete
- **Users**: User management with role changes  
- **Purchases**: Payment tracking table
- **Streams**: Stream monitoring with controls

## 🎨 Design System (Minimal Modern)

### Components Used
- **Button, Card, Input, Badge** for UI elements
- **Gold accents (#D5BA7F)** with ABeeZee typography
- **Responsive tables** with inline editing
- **Confirmation modals** for delete operations

### Component Structure
```svelte
<AdminDashboard>
  <TabNavigation activeTab={activeTab} />
  <TabContent>
    {#if activeTab === 'overview'}<OverviewTab />{/if}
    {#if activeTab === 'memorials'}<MemorialsTab />{/if}
    {#if activeTab === 'users'}<UsersTab />{/if}
    {#if activeTab === 'purchases'}<PurchasesTab />{/if}
    {#if activeTab === 'streams'}<StreamsTab />{/if}
  </TabContent>
</AdminDashboard>
```

---

## ✅ Simplified MVP Summary

**3 Core Elements:**
1. **5 Main Tabs**: Overview, Memorials, Users, Purchases, Streams
2. **Clean Tabbed Interface**: Minimal Modern design with gold accents
3. **Full CRUD Operations**: Create, Read, Update, Delete for all entities

**Implementation Focus:**
- Tabbed navigation with clean UI
- Data tables with inline editing
- Confirmation dialogs for deletions
- Admin role verification
- Firebase/Firestore integration

**Route**: `/admin/mvp-dashboard`  
**Design**: Minimal Modern components with ABeeZee typography  
**Tech Stack**: SvelteKit + Firebase + Tailwind CSS
