# Client Categorization & Filtering Guide

## Overview

PULSE now includes comprehensive categorization and filtering features designed for **client-based monitoring**. Instead of organizing by Dev/Staging/Production, you can organize monitors by **client name** (PFL, HDFC, SBIGIC, etc.).

---

## Key Features

### 1. **Projects = Clients**

Projects in PULSE represent your clients. Each client can have multiple URLs being monitored.

**Example Structure:**
- **Client: PFL** → 10 URLs monitored
- **Client: HDFC** → 10 URLs monitored
- **Client: SBIGIC** → 10 URLs monitored

**Location:** `/projects` page (renamed to "Clients" in the UI)

---

### 2. **Advanced Filtering on Monitors Page**

The Monitors page now includes a comprehensive filtering system with:

#### **Search Bar**
- Search monitors by **name** or **URL**
- Real-time filtering as you type
- Example: Search "api" to find all API endpoints

#### **Client Filter (Dropdown)**
- Filter monitors by specific client
- Shows all clients with color indicators
- Select "All Clients" to view everything

#### **Status Filter (Dropdown)**
- Filter by monitor status:
  - All Status
  - Up
  - Down
  - Degraded
  - Paused

#### **Tag Filters (Advanced)**
- Click "Filters" button to show/hide tag section
- Multi-select tags to filter monitors
- Tags are automatically extracted from all monitors
- Click a tag to toggle it on/off
- Selected tags shown with X icon

#### **Active Filters Summary**
- Shows all active filters below the filter bar
- Easy-to-see badges for: Search, Client, Status, Tags
- Quick "Clear" button to reset all filters

#### **Filter Results Counter**
- Shows "Showing X of Y monitors"
- Updates in real-time as filters change

---

### 3. **Tag System**

Tags provide flexible categorization for monitors.

**Common Tag Categories:**

```
Environment Tags:
- production
- staging
- development
- qa

Application Tags:
- api
- website
- admin-panel
- mobile-backend

Client Tags:
- pfl
- hdfc
- sbigic

Critical Tags:
- critical
- high-priority
- low-priority

Type Tags:
- health-check
- login-endpoint
- payment-gateway
```

**How to Use Tags:**
1. When creating/editing a monitor, add tags in the "Tags" field
2. Use comma-separated values: `production, api, critical, pfl`
3. Tags automatically appear in the filter section
4. Click any tag in the filter to show only monitors with that tag

---

### 4. **Enhanced Projects/Clients Page**

The Projects page is now a **client management dashboard**.

**Features:**
- **Client Cards** showing:
  - Client name with color indicator
  - Total monitors count
  - Up/Down/Degraded status breakdown
  - Uptime percentage with visual bar
  - Quick actions: View Monitors, Analytics

- **Click-through Navigation:**
  - Click any client card to view their monitors
  - "View Monitors" button filters monitors by that client

- **Stats Integration:**
  - Real-time health data from dashboard API
  - Visual uptime progress bars
  - Color-coded status (Green = good, Red = issues)

---

## Usage Examples

### Example 1: View All PFL Monitors

**Steps:**
1. Go to `/monitors`
2. Click the "Client" dropdown
3. Select "PFL"
4. See only PFL monitors

**Or:**
1. Go to `/projects` (Clients page)
2. Click the "PFL" card
3. Automatically filtered to PFL monitors

---

### Example 2: Find All Production APIs

**Steps:**
1. Go to `/monitors`
2. Click "Filters" button
3. Click "production" tag
4. Click "api" tag
5. See only production API monitors

---

### Example 3: Check Critical Down Monitors

**Steps:**
1. Go to `/monitors`
2. Select Status: "Down"
3. Click "Filters" → Click "critical" tag
4. See all critical monitors that are currently down

---

### Example 4: Search for Specific Endpoint

**Steps:**
1. Go to `/monitors`
2. Type in search bar: "login"
3. See all monitors with "login" in name or URL

---

## Filter Combinations

You can **combine multiple filters** for powerful search:

**Example Combinations:**

| Search | Client | Status | Tags | Result |
|--------|--------|--------|------|--------|
| "api" | PFL | Down | critical | PFL's critical API endpoints that are down |
| "" | HDFC | All | production, api | All HDFC production APIs |
| "health" | All | Up | - | All running health check endpoints |
| "" | SBIGIC | Paused | - | All paused SBIGIC monitors |

---

## Components Created

### **New Files:**

```
apps/web/src/components/monitors/MonitorFilters.tsx
```

**MonitorFilters Component:**
- Search input with icon
- Client dropdown
- Status dropdown
- Tag filter section (collapsible)
- Clear filters button
- Active filters summary
- Handles all filter logic

---

### **Enhanced Files:**

```
apps/web/src/pages/Monitors.tsx
```
- Integrated MonitorFilters component
- Added filter state management
- Added filter logic (useMemo)
- Extracts unique tags from all monitors
- Shows filtered results count
- Empty state for "no matches"

```
apps/web/src/pages/Projects.tsx
```
- Renamed to "Clients" in UI
- Added client stats (monitors, uptime, status)
- Made cards clickable
- Added visual uptime bars
- Added "View Monitors" button
- Integrated with dashboard API for real-time stats

---

## Filter Logic

The filtering system uses **AND logic**:

- Search **AND** Client **AND** Status **AND** Tags

**Example:**
- Search: "api"
- Client: PFL
- Tags: production, critical

**Result:** Shows monitors that:
1. Contain "api" in name OR URL
2. **AND** belong to PFL client
3. **AND** have BOTH "production" AND "critical" tags

---

## Benefits

### **For Your Use Case:**

✅ **Client Segregation**
- Clear separation of PFL, HDFC, SBIGIC monitors
- Easy to view one client at a time
- Quick switching between clients

✅ **Tag Flexibility**
- Add any tags you need (production, api, critical, etc.)
- Filter by multiple tags
- No predefined categories - fully customizable

✅ **Quick Search**
- Find specific URLs instantly
- Search across all clients
- Real-time results

✅ **Status Filtering**
- Quickly identify all down monitors
- Check paused monitors
- Focus on specific status

✅ **Combined Filters**
- Powerful combinations for complex queries
- Example: "Show all critical production APIs for PFL that are down"

---

## Future Enhancements

### Planned Features:

1. **Custom Tag Categories**
   - Environment (Production, Staging, Dev)
   - Application (API, Website, Admin)
   - Priority (Critical, High, Medium, Low)
   - Custom categories defined by you

2. **Saved Filters**
   - Save common filter combinations
   - Quick access to frequently used views
   - Share filter presets with team

3. **Bulk Tag Management**
   - Add/remove tags from multiple monitors at once
   - Tag suggestions based on URL patterns
   - Auto-tagging rules

4. **Advanced Search**
   - Regular expressions support
   - Search in monitor configurations
   - Search in check history

5. **Client Groups**
   - Group multiple clients together
   - Example: "Banking Clients" = HDFC + SBIGIC
   - Filter by group

---

## How Tags Work Internally

### **Tag Storage:**
- Tags stored as array of strings in database
- Each monitor has a `tags` field: `["production", "api", "critical"]`

### **Tag Extraction:**
- System scans all monitors
- Extracts unique tags
- Sorts alphabetically
- Displays in filter section

### **Tag Filtering:**
- Uses `Array.every()` to check if monitor has all selected tags
- Only shows monitors matching **all** selected tags (AND logic)

---

## Best Practices

### **Tagging Strategy:**

1. **Be Consistent**
   - Use lowercase: "production" not "Production"
   - Use hyphens: "health-check" not "health check"
   - Decide on naming convention and stick to it

2. **Use Hierarchical Tags**
   ```
   Client: pfl, hdfc, sbigic
   Environment: production, staging, development
   Type: api, website, admin
   Priority: critical, high, medium, low
   ```

3. **Don't Over-Tag**
   - Use 3-5 tags per monitor
   - Too many tags makes filtering confusing
   - Focus on meaningful categorization

4. **Document Your Tags**
   - Keep a list of standard tags
   - Share with your team
   - Update when adding new categories

---

## Visual Guide

### **Filters Section:**

```
┌─────────────────────────────────────────────────────────────────────┐
│ [🔍 Search monitors...]  [Client: All ▼]  [Status: All ▼]  [Filters] [Clear] │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Filter by Tags:                                                     │
│ [production] [staging] [api] [website] [critical] [health-check]   │
│                                                                      │
│ Active filters: [Search: "api"] [Client: PFL] [Tag: production]    │
└─────────────────────────────────────────────────────────────────────┘

Showing 12 of 50 monitors
```

### **Client Card:**

```
┌─────────────────────────────────────┐
│ ● PFL                     [🏢]     │
│ Production monitoring               │
│                                     │
│ Monitors               [15]        │
│                                     │
│ Up                     14          │
│ Down                   1           │
│                                     │
│ Uptime         99.5%              │
│ [████████████████████░░] 99.5%    │
│                                     │
│ [View Monitors]  [📊]             │
└─────────────────────────────────────┘
```

---

## Technical Details

### **Filter State:**

```typescript
interface FilterValues {
  search: string;           // Search term
  projectId: string;        // Selected client ID (or "all")
  status: string;           // Selected status (or "all")
  tags: string[];           // Array of selected tag names
}
```

### **Filter Logic:**

```typescript
const filteredMonitors = useMemo(() => {
  return monitors.filter((monitor) => {
    // Search filter
    if (filters.search && !matchesSearch(monitor, filters.search)) {
      return false;
    }

    // Project/Client filter
    if (filters.projectId !== 'all' && monitor.project?.id !== filters.projectId) {
      return false;
    }

    // Status filter
    if (filters.status !== 'all' && monitor.currentStatus !== filters.status) {
      return false;
    }

    // Tags filter (must have ALL selected tags)
    if (filters.tags.length > 0) {
      const hasAllTags = filters.tags.every((tag) => monitor.tags.includes(tag));
      if (!hasAllTags) return false;
    }

    return true;
  });
}, [monitors, filters]);
```

---

## Summary

You now have a **powerful client-based categorization and filtering system**:

✅ Organize by clients (PFL, HDFC, SBIGIC)
✅ Filter by multiple criteria simultaneously
✅ Search across all monitors
✅ Tag-based flexible categorization
✅ Real-time results
✅ Visual client dashboard with stats
✅ Click-through navigation
✅ Active filter indicators
✅ Clear filters with one click

**Perfect for monitoring multiple production websites across different clients!**

---

*Last Updated: February 2, 2026*
*Version: 1.0 - Client-Focused Categorization*
