# Custom Framework Import Plugin

Import and manage custom compliance frameworks with full feature support.

## Overview

This plugin allows organizations to define and import their own compliance frameworks from JSON files. Imported frameworks include all features of built-in frameworks:

- Status tracking (Not started → Implemented)
- Owner assignments
- Progress calculation
- Dashboard visualization
- Integration with organizational and project-level views

## Architecture

```
custom-framework-import/
├── index.ts              # Backend plugin entry point
├── bundle.js             # Compiled backend bundle (auto-generated)
├── manifest.json         # Plugin metadata for marketplace
├── ui/                   # Frontend React components
│   ├── src/
│   │   ├── index.tsx                    # UI entry point & slot registrations
│   │   ├── CustomFrameworkConfig.tsx    # Settings page component
│   │   ├── CustomFrameworkCards.tsx     # Framework selection cards
│   │   ├── CustomFrameworkDashboard.tsx # Dashboard view
│   │   ├── CustomFrameworkControls.tsx  # Controls viewer
│   │   ├── CustomFrameworkViewer.tsx    # Framework detail viewer
│   │   ├── FrameworkImportModal.tsx     # Import wizard modal
│   │   ├── FrameworkDetailDrawer.tsx    # Framework details drawer
│   │   ├── FrameworksTable.tsx          # Frameworks list table
│   │   ├── ControlItemDrawer.tsx        # Control details drawer
│   │   └── theme.ts                     # Design system tokens
│   ├── dist/                            # Compiled UI bundle
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── README.md
```

## Features

- **JSON Import**: Import frameworks from JSON definition files
- **Flexible Hierarchy**: Support for 2-level and 3-level framework structures
- **Organizational Support**: Create both organizational and project-level frameworks
- **Visual Dashboard**: Progress cards, assignment status, status breakdown
- **Controls Management**: Full control implementation tracking
- **Evidence Upload**: Attach evidence files to controls using the main app's file manager
- **Risk Linking**: Link controls to project risks for traceability
- **Dynamic File Sources**: Framework-specific file source enums created automatically

## Database Schema

The plugin creates tables in the tenant schema on installation:

### `custom_frameworks`
Stores framework definitions.

```sql
CREATE TABLE custom_frameworks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  hierarchy_type VARCHAR(50) NOT NULL,  -- 'two_level' or 'three_level'
  level_1_name VARCHAR(100) NOT NULL,   -- e.g., 'Categories', 'Domains'
  level_2_name VARCHAR(100) NOT NULL,   -- e.g., 'Controls', 'Requirements'
  level_3_name VARCHAR(100),            -- e.g., 'Sub-controls' (only for three_level)
  file_source VARCHAR(100),             -- e.g., 'SOC 2 Type II Framework evidence'
  is_organizational BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### `custom_framework_level1`
Level 1 items (e.g., Categories, Domains).

```sql
CREATE TABLE custom_framework_level1 (
  id SERIAL PRIMARY KEY,
  framework_id INTEGER REFERENCES custom_frameworks(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0
);
```

### `custom_framework_level2`
Level 2 items (e.g., Controls, Requirements).

```sql
CREATE TABLE custom_framework_level2 (
  id SERIAL PRIMARY KEY,
  level1_id INTEGER REFERENCES custom_framework_level1(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0
);
```

### `custom_framework_level3`
Level 3 items (only for three_level hierarchy).

```sql
CREATE TABLE custom_framework_level3 (
  id SERIAL PRIMARY KEY,
  level2_id INTEGER REFERENCES custom_framework_level2(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0
);
```

### `custom_framework_projects`
Associates frameworks with projects.

```sql
CREATE TABLE custom_framework_projects (
  id SERIAL PRIMARY KEY,
  framework_id INTEGER REFERENCES custom_frameworks(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### `custom_framework_controls`
Tracks implementation status for each control in a project.

```sql
CREATE TABLE custom_framework_controls (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  framework_id INTEGER REFERENCES custom_frameworks(id),
  level2_id INTEGER REFERENCES custom_framework_level2(id),
  level3_id INTEGER REFERENCES custom_framework_level3(id),
  status VARCHAR(50) DEFAULT 'Not Started',
  owner_id INTEGER,
  implementation_details TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

All endpoints are prefixed with `/api/plugins/custom-framework-import`.

### Framework Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/frameworks` | List all custom frameworks |
| GET | `/frameworks/:id` | Get framework by ID with structure |
| POST | `/frameworks` | Import a new framework from JSON |
| DELETE | `/frameworks/:id` | Delete a framework (fails if in use) |

### Project Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects/:projectId/custom-frameworks` | Get frameworks added to a project |
| POST | `/add-to-project` | Add framework to project |
| POST | `/remove-from-project` | Remove framework from project |
| GET | `/projects/:projectId/frameworks/:frameworkId` | Get framework structure with implementation status |
| GET | `/projects/:projectId/frameworks/:frameworkId/progress` | Get progress statistics |

### Control Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/projects/:projectId/controls/:controlId` | Update control status/owner |
| GET | `/projects/:projectId/controls/:controlId` | Get control details |

## JSON Import Format

### Two-Level Hierarchy

```json
{
  "name": "My Framework",
  "description": "Framework description",
  "hierarchy_type": "two_level",
  "level_1_name": "Categories",
  "level_2_name": "Controls",
  "is_organizational": false,
  "structure": [
    {
      "name": "Category 1",
      "description": "Category description",
      "items": [
        {
          "name": "Control 1.1",
          "description": "Control description"
        },
        {
          "name": "Control 1.2",
          "description": "Another control"
        }
      ]
    }
  ]
}
```

### Three-Level Hierarchy

```json
{
  "name": "My Framework",
  "description": "Framework description",
  "hierarchy_type": "three_level",
  "level_1_name": "Domains",
  "level_2_name": "Requirements",
  "level_3_name": "Sub-requirements",
  "is_organizational": true,
  "structure": [
    {
      "name": "Domain 1",
      "description": "Domain description",
      "items": [
        {
          "name": "Requirement 1.1",
          "description": "Requirement description",
          "items": [
            {
              "name": "Sub-requirement 1.1.1",
              "description": "Sub-requirement description"
            }
          ]
        }
      ]
    }
  ]
}
```

## UI Plugin Slots

The plugin registers React components for these VerifyWise plugin slots:

| Slot ID | Component | Location |
|---------|-----------|----------|
| `page.settings.tabs` | CustomFrameworkConfig | Settings > Custom Frameworks tab |
| `modal.framework.selection` | CustomFrameworkCards | Add Framework modal (cards section) |
| `page.framework-dashboard.custom` | CustomFrameworkDashboard | Organizational Framework Dashboard |
| `page.controls.custom-framework` | CustomFrameworkControls | Organizational Controls & Requirements tab |
| `page.project-controls.custom-framework` | CustomFrameworkControls | Project Controls & Requirements tab |

### Slot Registration (ui/src/index.tsx)

```typescript
export function registerSlots(registry: PluginRegistry) {
  // Settings tab
  registry.register(PLUGIN_SLOTS.SETTINGS_TABS, {
    id: "custom-framework-config",
    component: CustomFrameworkConfig,
    renderType: "tab",
    label: "Custom Frameworks",
    order: 100,
  });

  // Framework selection cards
  registry.register(PLUGIN_SLOTS.FRAMEWORK_SELECTION, {
    id: "custom-framework-cards",
    component: CustomFrameworkCards,
    renderType: "card",
    order: 100,
  });

  // ... more registrations
}
```

## Event-Based Communication

The plugin uses custom DOM events for decoupled communication with the main app:

### `customFrameworkCountChanged`

Emitted when custom framework count changes for a project. Used by the main app to calculate total framework count (system + custom).

```typescript
// Emitted by: CustomFrameworkCards
window.dispatchEvent(
  new CustomEvent("customFrameworkCountChanged", {
    detail: { projectId: number, count: number }
  })
);

// Listened by: AddNewFramework modal, Framework Settings page
useEffect(() => {
  const handler = (event: CustomEvent) => {
    if (event.detail?.projectId === project.id) {
      setCustomFrameworkCount(event.detail.count || 0);
    }
  };
  window.addEventListener("customFrameworkCountChanged", handler);
  return () => window.removeEventListener("customFrameworkCountChanged", handler);
}, [project.id]);
```

### `customFrameworkChanged`

Emitted when a framework is added to or removed from a project.

```typescript
// Emitted by: CustomFrameworkCards (on add/remove)
window.dispatchEvent(
  new CustomEvent("customFrameworkChanged", {
    detail: {
      projectId: number,
      action: "add" | "remove",
      frameworkId: number
    }
  })
);

// Listened by: CustomFrameworkDashboard, CustomFrameworkControls
// Triggers data reload when frameworks change
```

## Plugin Lifecycle

### Installation

When the plugin is installed, the `install()` function:
1. Creates all database tables in the tenant schema
2. Returns success status

```typescript
export async function install(userId, tenantId, context) {
  const { sequelize } = context;

  // Create tables
  await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tenantId}".custom_frameworks ...`);
  // ... create other tables

  return {
    success: true,
    message: "Custom Framework Import plugin installed successfully.",
    installedAt: new Date().toISOString(),
  };
}
```

### Uninstallation

When the plugin is uninstalled, the `uninstall()` function:
1. **Deletes** `custom_framework_controls` (implementation data)
2. **Deletes** `custom_framework_projects` (project associations)
3. **Preserves** Framework definitions (custom_frameworks, level1/2/3 tables)

This allows re-installation to recover framework definitions while clearing project-specific data.

```typescript
export async function uninstall(userId, tenantId, context) {
  const { sequelize } = context;

  // Delete implementation data
  await sequelize.query(`DELETE FROM "${tenantId}".custom_framework_controls`);

  // Delete project associations
  await sequelize.query(`DELETE FROM "${tenantId}".custom_framework_projects`);

  // Framework definitions are preserved

  return {
    success: true,
    message: "Plugin uninstalled. Framework definitions preserved.",
    uninstalledAt: new Date().toISOString(),
  };
}
```

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Access to VerifyWise development environment

### Building the UI

```bash
cd ui
npm install
npm run build
```

The build outputs to `ui/dist/index.esm.js`.

### Local Development Workflow

1. **Backend changes**: The server caches plugins at `Servers/temp/plugins/`. After modifying `index.ts`:
   ```bash
   cp index.ts /path/to/verifywise/Servers/temp/plugins/custom-framework-import/index.ts
   ```

2. **Frontend changes**: After running `npm run build` in the `ui` directory, the changes are automatically picked up.

3. **Restart the server** to apply backend changes.

### Project Structure

```
ui/src/
├── index.tsx                    # Entry point, exports registerSlots()
├── CustomFrameworkConfig.tsx    # Settings page (import/manage frameworks)
├── CustomFrameworkCards.tsx     # Cards in Add Framework modal
├── CustomFrameworkDashboard.tsx # Dashboard cards and tabs
├── CustomFrameworkControls.tsx  # Controls tree viewer
├── CustomFrameworkViewer.tsx    # Framework detail view
├── FrameworkImportModal.tsx     # JSON import wizard
├── FrameworkDetailDrawer.tsx    # Framework info drawer
├── FrameworksTable.tsx          # Table component for settings
├── ControlItemDrawer.tsx        # Control edit drawer
└── theme.ts                     # VerifyWise design tokens
```

### Theme System

The plugin uses VerifyWise design tokens for consistency:

```typescript
// theme.ts
export const colors = {
  primary: "#13715B",      // VerifyWise green
  secondary: "#7C3AED",    // Purple (for custom frameworks)
  // ...
};

export const buttonStyles = {
  primary: {
    contained: {
      backgroundColor: "#13715B",
      color: "#FFFFFF",
      // ...
    }
  }
};
```

## Status Values

Controls can have the following status values:

| Status | Color | Description |
|--------|-------|-------------|
| Not Started | Gray (#9CA3AF) | No work begun |
| Draft | Light Gray (#D1D5DB) | Initial draft |
| In Progress | Yellow (#F59E0B) | Currently being worked on |
| Awaiting Review | Blue (#3B82F6) | Pending review |
| Awaiting Approval | Purple (#8B5CF6) | Pending approval |
| Implemented | Green (#13715B) | Complete |
| Needs Rework | Orange (#EA580C) | Requires changes |

## Evidence Upload & File Sources

### Overview

The plugin supports uploading evidence files to controls. Evidence is stored using the main app's file manager (`/api/file-manager`) and categorized with framework-specific file source enums.

### Dynamic File Source Enum

When a custom framework is imported, the plugin automatically creates a new PostgreSQL enum value in `enum_files_source`. This allows evidence files to be categorized by framework.

#### How It Works

1. **On framework import**: The plugin generates a file source name from the framework name
2. **Enum creation**: The new value is added to `enum_files_source` (if not exists)
3. **Storage**: The file source name is stored in the `custom_frameworks.file_source` column
4. **Usage**: When uploading evidence, the framework's file source is used

#### File Source Naming Convention

The file source is generated as: `{Framework Name} evidence`

| Framework Name | Generated File Source |
|----------------|----------------------|
| SOC 2 Type II Framework | `SOC 2 Type II Framework evidence` |
| GDPR Compliance Framework | `GDPR Compliance Framework evidence` |
| HIPAA Security Rule Framework | `HIPAA Security Rule Framework evidence` |
| CCPA Compliance Framework | `CCPA Compliance Framework evidence` |
| DORA Compliance Framework | `DORA Compliance Framework evidence` |
| CIS Controls v8 | `CIS Controls v8 evidence` |
| NIST Cybersecurity Framework | `NIST Cybersecurity Framework evidence` |
| PCI-DSS Lite Framework | `PCI-DSS Lite Framework evidence` |
| ISO 27001 Starter Framework | `ISO 27001 Starter Framework evidence` |
| AI Ethics & Governance Framework | `AI Ethics & Governance Framework evidence` |
| Data Governance Framework | `Data Governance Framework evidence` |
| Custom Framework Starter | `Custom Framework Starter evidence` |

#### Backend Implementation

```typescript
// Generate file source name from framework name
function generateFileSourceName(frameworkName: string): string {
  const cleanName = frameworkName.trim();
  return `${cleanName} evidence`;
}

// Add enum value if it doesn't exist (runs before transaction)
async function addFileSourceEnum(sequelize: any, sourceName: string): Promise<boolean> {
  // Check if enum value already exists
  const [existing] = await sequelize.query(`
    SELECT 1 FROM pg_enum
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_files_source')
    AND enumlabel = :sourceName
  `, { replacements: { sourceName } });

  if (existing.length === 0) {
    // Add the new enum value
    await sequelize.query(
      `ALTER TYPE public.enum_files_source ADD VALUE '${sourceName}'`
    );
  }
  return true;
}
```

**Note**: `ALTER TYPE ... ADD VALUE` cannot run inside a transaction, so enum creation happens before the main import transaction.

### Evidence Upload Flow

1. User selects files in the Control Item Drawer
2. Files are uploaded to `/api/file-manager` with the framework's file source
3. File IDs are stored in the control's `evidence_links` JSONB array
4. Files can be downloaded or deleted from the drawer

```typescript
// Upload evidence file
const formData = new FormData();
formData.append("file", file);
formData.append("source", frameworkData.file_source || "File Manager");
formData.append("project_id", projectId.toString());

const response = await fetch("/api/file-manager", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});
```

### Fallback Behavior

If a framework doesn't have a `file_source` (e.g., created before this feature), evidence uploads fall back to `"File Manager"` as the source.

### Field Naming Convention

| Layer | Field Name | Description |
|-------|------------|-------------|
| Database | `evidence_links` | JSONB column in `custom_framework_level2_impl` |
| Backend API | `evidence_links` | Field name in API responses and requests |
| UI State | `evidenceFiles` | React state variable (camelCase) |
| UI Props | `evidence_links` or `evidence_files` | Interface accepts both for compatibility |

**Important**: The UI accepts both `evidence_links` and `evidence_files` from the API response for backward compatibility. When saving, the field is always sent as `evidence_links`.

## Risk Linking

### Overview

Controls can be linked to project risks for traceability. This creates a relationship between compliance controls and identified risks.

### How It Works

1. User opens the Control Item Drawer
2. Clicks "Linked Risks" to open the risk selection modal
3. Selects/deselects risks from the project's risk list
4. On save, the changes are sent to the backend as `risks_to_add` and `risks_to_remove` arrays

### API Request

```typescript
// PATCH /api/plugins/custom-framework-import/projects/:projectId/implementations/:implId
{
  "status": "In Progress",
  "owner": 123,
  "implementation_details": "Details...",
  "evidence_links": [{ "id": 1, "fileName": "doc.pdf" }],
  "risks_to_add": [5, 8, 12],    // Risk IDs to link
  "risks_to_remove": [3, 7]      // Risk IDs to unlink
}
```

### UI Components

The risk linking UI includes:
- **Risk count badge**: Shows number of linked risks
- **Selection modal**: Searchable list with checkboxes
- **Visual indicators**: Shows risk level/severity

```typescript
// Risk selection modal
<Dialog open={isLinkedRisksModalOpen} onClose={() => setIsLinkedRisksModalOpen(false)}>
  <DialogTitle>Link Risks to Control</DialogTitle>
  <DialogContent>
    <TextField placeholder="Search risks..." />
    <Table>
      {allProjectRisks.map(risk => (
        <TableRow>
          <Checkbox checked={isRiskLinked(risk.id)} />
          <TableCell>{risk.risk_name}</TableCell>
          <TableCell>{risk.risk_level}</TableCell>
        </TableRow>
      ))}
    </Table>
  </DialogContent>
</Dialog>
```

### Database Storage

Linked risks are stored in the `linked_risks` JSONB column of `custom_framework_implementations`:

```sql
ALTER TABLE custom_framework_implementations
ADD COLUMN linked_risks JSONB DEFAULT '[]';
```

## Extending the Plugin

### Adding a New Status Value

1. Update `getStatusColor()` in `CustomFrameworkDashboard.tsx`:
   ```typescript
   const getStatusColor = (status: string): string => {
     // Add new status
     if (statusLower === "new_status") return "#COLOR";
     // ...
   };
   ```

2. Update status dropdown in `ControlItemDrawer.tsx`

3. Update backend validation if needed

### Adding a New Hierarchy Level (Level 4)

1. Create table in `install()`:
   ```sql
   CREATE TABLE custom_framework_level4 (
     id SERIAL PRIMARY KEY,
     level3_id INTEGER REFERENCES custom_framework_level3(id) ON DELETE CASCADE,
     name VARCHAR(255) NOT NULL,
     description TEXT,
     order_index INTEGER DEFAULT 0
   );
   ```

2. Update import validation in `validateFrameworkImport()`

3. Update structure parsing in the import handler

4. Update UI components to render level 4 items

### Adding New Fields to Controls

1. Add column to `custom_framework_controls` table:
   ```sql
   ALTER TABLE custom_framework_controls ADD COLUMN new_field TEXT;
   ```

2. Update control update endpoint in `index.ts`

3. Update `ControlItemDrawer.tsx` form

4. Update progress calculations if the field affects completion

## App Integration Points

The main VerifyWise app integrates with this plugin at these points:

### Plugin Slots (Frontend)

Defined in `Clients/src/domain/constants/pluginSlots.ts`:
```typescript
export const PLUGIN_SLOTS = {
  SETTINGS_TABS: "page.settings.tabs",
  FRAMEWORK_SELECTION: "modal.framework.selection",
  FRAMEWORK_DASHBOARD_CUSTOM: "page.framework-dashboard.custom",
  CONTROLS_CUSTOM_FRAMEWORK: "page.controls.custom-framework",
  PROJECT_CONTROLS_CUSTOM_FRAMEWORK: "page.project-controls.custom-framework",
};
```

### Event Listeners (Frontend)

The app listens for plugin events in:
- `AddNewFramework/index.tsx` - listens for `customFrameworkCountChanged`
- `Framework/Settings/index.tsx` - listens for `customFrameworkCountChanged`

### Database Query (Backend)

The app safely queries plugin tables in `Servers/utils/framework.utils.ts`:
```typescript
// Checks if plugin table exists before querying
CASE
  WHEN EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = :tenant
               AND table_name = 'custom_framework_projects')
  THEN (SELECT COUNT(*) FROM custom_framework_projects WHERE project_id = :projectId)
  ELSE 0
END
```

## Troubleshooting

### Framework won't delete
- **Cause**: Framework is associated with projects
- **Solution**: Remove framework from all projects first, or the plugin now cleans up orphaned associations automatically

### Alerts don't auto-dismiss
- **Cause**: Fixed in latest version
- **Solution**: Alerts now auto-dismiss after 3 seconds

### Custom Frameworks section not showing
- **Cause**: No custom frameworks exist for the project type
- **Solution**:
  - Verify plugin is installed
  - Import a framework with matching `is_organizational` value
  - The section header only shows when there are custom frameworks

### Progress not updating
- **Cause**: UI not refreshed or API error
- **Solution**:
  - Refresh the page
  - Check browser console for API errors
  - Verify user has permission to update controls

### Changes not taking effect after code edit
- **Cause**: Server caches plugins
- **Solution**: Copy updated `index.ts` to server cache directory and restart server

### Evidence files not showing after upload
- **Cause**: Files were uploaded but not saved/linked to the control
- **Solution**: After selecting files in the drawer, click **Save** to persist the link. The file upload to `/api/file-manager` only stores the file; the Save action updates `evidence_links` in the database to link it to the control.

### Evidence upload fails with "invalid input value for enum"
- **Cause**: The file source enum value doesn't exist in `enum_files_source`
- **Solution**:
  - For frameworks imported before this feature: Re-import the framework to create the enum
  - Manually add the enum value:
    ```sql
    ALTER TYPE public.enum_files_source ADD VALUE 'Framework Name evidence';
    ```
  - Update the framework's `file_source` column:
    ```sql
    UPDATE custom_frameworks SET file_source = 'Framework Name evidence' WHERE id = X;
    ```

### File source not showing in file manager
- **Cause**: Framework was imported before the file source feature was added
- **Solution**:
  1. Check if framework has `file_source` set:
     ```sql
     SELECT id, name, file_source FROM custom_frameworks;
     ```
  2. If null, update it manually or delete and re-import the framework

### Risk linking not working
- **Cause**: Missing `linked_risks` column or API endpoint issue
- **Solution**:
  - Verify the column exists:
    ```sql
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'custom_framework_implementations'
    AND column_name = 'linked_risks';
    ```
  - If missing, add it:
    ```sql
    ALTER TABLE custom_framework_implementations
    ADD COLUMN linked_risks JSONB DEFAULT '[]';
    ```

## Example Frameworks

The plugin includes starter templates for common compliance frameworks:

| Template | Framework Name | File Source Enum |
|----------|----------------|------------------|
| `soc2.json` | SOC 2 Type II Framework | `SOC 2 Type II Framework evidence` |
| `gdpr.json` | GDPR Compliance Framework | `GDPR Compliance Framework evidence` |
| `hipaa.json` | HIPAA Security Rule Framework | `HIPAA Security Rule Framework evidence` |
| `pci-dss-lite.json` | PCI-DSS Lite Framework | `PCI-DSS Lite Framework evidence` |
| `ccpa.json` | CCPA Compliance Framework | `CCPA Compliance Framework evidence` |
| `dora.json` | DORA Compliance Framework | `DORA Compliance Framework evidence` |
| `nist-csf.json` | NIST Cybersecurity Framework | `NIST Cybersecurity Framework evidence` |
| `cis-controls.json` | CIS Controls v8 | `CIS Controls v8 evidence` |
| `iso27001-starter.json` | ISO 27001 Starter Framework | `ISO 27001 Starter Framework evidence` |
| `ai-ethics.json` | AI Ethics & Governance Framework | `AI Ethics & Governance Framework evidence` |
| `data-governance.json` | Data Governance Framework | `Data Governance Framework evidence` |
| `custom-starter.json` | Custom Framework Starter | `Custom Framework Starter evidence` |

Templates are located in `ui/src/templates/` and can be customized or used as references for creating your own frameworks

## Author

VerifyWise
