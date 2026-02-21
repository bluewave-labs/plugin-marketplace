# VerifyWise Plugin Marketplace - CLAUDE.md

> **IMPORTANT FOR CLAUDE:** This document is the authoritative reference for the plugin-marketplace repository. **Whenever you make changes to any code, configuration, or documentation in this repository, you MUST also update this CLAUDE.md file to reflect those changes.** This ensures future conversations have accurate, up-to-date information.

---

## Table of Contents

1. [Repository Overview](#1-repository-overview)
2. [Directory Structure](#2-directory-structure)
3. [Plugin Types](#3-plugin-types)
4. [Plugin Registry (plugins.json)](#4-plugin-registry-pluginsjson)
5. [Creating a New Plugin](#5-creating-a-new-plugin)
6. [Framework Plugins](#6-framework-plugins)
7. [Plugin Router System](#7-plugin-router-system)
8. [Plugin Lifecycle Methods](#8-plugin-lifecycle-methods)
9. [UI Components and Slots](#9-ui-components-and-slots)
10. [Shared Packages](#10-shared-packages)
11. [Build System](#11-build-system)
12. [Database Tables](#12-database-tables)
13. [File Attachment System](#13-file-attachment-system)
14. [Event System](#14-event-system)
15. [Testing and Deployment](#15-testing-and-deployment)
16. [Current Plugins Inventory](#16-current-plugins-inventory)
17. [Troubleshooting](#17-troubleshooting)

---

## 1. Repository Overview

This repository contains the plugin marketplace for VerifyWise, including:
- Plugin registry (`plugins.json`)
- Plugin implementations (`plugins/`)
- Shared packages for framework plugins (`packages/`)
- Build scripts (`scripts/`)
- Documentation (`docs/`)

### Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run build:all` | Build everything |
| `npm run build:framework-plugins` | Build all framework plugins |
| `npm run build:custom-framework-ui` | Build shared UI package |
| `npm run build:mlflow` | Build MLflow plugin UI |
| `npm run build:jira-assets` | Build Jira Assets plugin UI |
| `npm run build:risk-import` | Build Risk Import plugin UI |

### Key Paths

| Path | Purpose |
|------|---------|
| `/plugins.json` | Plugin registry manifest |
| `/plugins/` | Plugin implementations |
| `/packages/custom-framework-base/` | Shared backend for framework plugins |
| `/packages/custom-framework-ui/` | Shared UI for framework plugins |
| `/scripts/build-framework-plugins.js` | Framework plugin build script |

---

## 2. Directory Structure

```
plugin-marketplace/
├── plugins.json                    # Plugin registry (marketplace manifest)
├── package.json                    # Build scripts
├── CLAUDE.md                       # This file
├── README.md                       # Repository overview
│
├── plugins/                        # Plugin implementations
│   │
│   │ # Integration Plugins (have their own logic)
│   ├── mlflow/                     # MLflow integration
│   │   ├── index.ts                # Backend code
│   │   ├── icon.svg                # Plugin icon
│   │   └── ui/                     # Frontend UI
│   │       ├── src/                # React components
│   │       ├── dist/               # Built UI bundle
│   │       └── vite.config.ts
│   ├── azure-ai-foundry/           # Azure AI Foundry integration
│   ├── risk-import/                # Risk Import plugin
│   ├── slack/                      # Slack integration
│   ├── jira-assets/                # Jira Assets integration
│   ├── model-lifecycle/            # Model Lifecycle plugin
│   ├── dataset-bulk-upload/        # Dataset Bulk Upload plugin
│   │
│   │ # Framework Plugins (use shared base)
│   ├── gdpr/                       # GDPR framework
│   │   ├── template.json           # Framework definition (REQUIRED)
│   │   ├── index.ts                # Auto-generated from template
│   │   ├── icon.svg                # Plugin icon
│   │   ├── dist/                   # Compiled backend (index.js)
│   │   └── ui/dist/                # Shared UI (copied from packages/)
│   ├── soc2/
│   ├── hipaa/
│   ├── ccpa/
│   ├── iso27001/
│   ├── nist-csf/
│   ├── pci-dss/
│   ├── cis-controls/
│   ├── dora/
│   ├── ai-ethics/
│   ├── altai/
│   ├── data-governance/
│   ├── oecd-ai-principles/
│   ├── texas-ai-act/
│   ├── colorado-ai-act/
│   ├── ftc-ai-guidelines/
│   ├── nyc-local-law-144/
│   ├── quebec-law25/
│   ├── uae-pdpl/
│   ├── saudi-pdpl/
│   ├── qatar-pdpl/
│   └── bahrain-pdpl/
│
├── packages/                       # Shared packages
│   ├── custom-framework-base/      # Shared backend for framework plugins
│   │   └── index.ts                # createFrameworkPlugin() factory
│   └── custom-framework-ui/        # Shared UI for framework plugins
│       ├── src/                    # React components
│       │   ├── index.tsx           # Exports all components
│       │   ├── CustomFrameworkConfig.tsx
│       │   ├── CustomFrameworkControls.tsx
│       │   ├── CustomFrameworkDashboard.tsx
│       │   ├── CustomFrameworkViewer.tsx
│       │   └── ...
│       ├── dist/                   # Built bundle (index.esm.js)
│       └── vite.config.ts
│
├── scripts/                        # Build scripts
│   ├── build-framework-plugins.js  # Main framework build script
│   └── add-framework.js            # Helper to add new frameworks
│
└── docs/                           # Documentation
    ├── PLUGIN_DEVELOPMENT.md
    ├── FRAMEWORK_PLUGINS.md
    ├── PLUGIN_UI_GUIDE.md
    ├── ARCHITECTURE.md
    └── API_REFERENCE.md
```

---

## 3. Plugin Types

### 3.1 By Installation Type

| Type | Description | Database | Examples |
|------|-------------|----------|----------|
| **standard** | Simple plugins without per-tenant tables | None | Slack |
| **tenant_scoped** | Plugins with per-tenant database tables | Per-tenant tables | MLflow, Risk Import, all frameworks |

### 3.2 By Category

| Category | Description |
|----------|-------------|
| `communication` | Team communication and notifications |
| `ml_ops` | ML model management |
| `data_management` | Data import/export tools |
| `compliance` | Compliance frameworks |
| `security` | Security scanning tools |
| `monitoring` | System monitoring tools |

### 3.3 By Architecture

| Type | Description | Backend | UI | Examples |
|------|-------------|---------|-----|----------|
| **Integration** | Custom logic, own backend & UI | Custom `index.ts` | Custom UI bundle | MLflow, Slack, Jira Assets |
| **Framework** | Uses shared base, auto-generated backend | Uses `createFrameworkPlugin()` | Shared UI bundle | SOC2, GDPR, HIPAA |

---

## 4. Plugin Registry (plugins.json)

The `plugins.json` file is the central registry for all plugins.

### 4.1 Full Plugin Entry Structure

```json
{
  "key": "my-plugin",
  "name": "My Plugin",
  "displayName": "My Plugin",
  "description": "Short description (max 150 chars)",
  "longDescription": "Detailed description for plugin details page",
  "version": "1.0.0",
  "author": "VerifyWise",
  "category": "data_management",
  "region": "International",
  "iconUrl": "plugins/my-plugin/icon.svg",
  "documentationUrl": "https://docs.verifywise.com/plugins/my-plugin",
  "supportUrl": "https://support.verifywise.com",
  "isOfficial": true,
  "isPublished": true,
  "requiresConfiguration": true,
  "installationType": "tenant_scoped",
  "frameworkType": "organizational",
  "features": [
    {
      "name": "Feature Name",
      "description": "What this feature does",
      "displayOrder": 1
    }
  ],
  "tags": ["tag1", "tag2"],
  "pluginPath": "plugins/my-plugin",
  "entryPoint": "dist/index.js",
  "dependencies": {
    "axios": "^1.6.0"
  },
  "ui": {
    "bundleUrl": "/api/plugins/my-plugin/ui/dist/index.esm.js",
    "globalName": "PluginMyPlugin",
    "slots": [
      {
        "slotId": "page.plugin.config",
        "componentName": "MyPluginConfig",
        "renderType": "card",
        "props": {}
      }
    ]
  }
}
```

### 4.2 Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `key` | string | Unique identifier (lowercase, hyphenated) |
| `name` | string | Full plugin name |
| `displayName` | string | Name shown in UI |
| `description` | string | Brief description (max 150 chars) |
| `version` | string | Semantic version (e.g., "1.0.0") |
| `category` | string | Plugin category |
| `isOfficial` | boolean | Whether officially maintained |
| `isPublished` | boolean | Whether visible in marketplace |
| `pluginPath` | string | Path to plugin directory |
| `entryPoint` | string | Main entry file |

### 4.3 Framework-Specific Fields

| Field | Type | Description |
|-------|------|-------------|
| `region` | string | Geographic region (for grouping) |
| `frameworkType` | string | "organizational" or "project" |

### 4.4 UI Configuration

```json
"ui": {
  "bundleUrl": "/api/plugins/my-plugin/ui/dist/index.esm.js",
  "globalName": "PluginMyPlugin",
  "slots": [
    {
      "slotId": "page.plugin.config",
      "componentName": "ComponentName",
      "renderType": "card",
      "props": { "pluginKey": "my-plugin" }
    }
  ]
}
```

---

## 5. Creating a New Plugin

### 5.1 Integration Plugin (Custom Logic)

#### Step 1: Create Directory Structure

```bash
mkdir -p plugins/my-plugin/ui/src
```

#### Step 2: Create Backend (`plugins/my-plugin/index.ts`)

```typescript
// ========== TYPE DEFINITIONS ==========

interface PluginContext {
  sequelize: any;
}

interface PluginRouteContext {
  tenantId: string;
  userId: number;
  organizationId: number;
  method: string;
  path: string;
  params: Record<string, string>;
  query: Record<string, any>;
  body: any;
  sequelize: any;
  configuration: Record<string, any>;
}

interface PluginRouteResponse {
  status?: number;
  data?: any;
  buffer?: any;
  filename?: string;
  contentType?: string;
  headers?: Record<string, string>;
}

// ========== PLUGIN METADATA ==========

export const metadata = {
  name: "My Plugin",
  version: "1.0.0",
  author: "VerifyWise",
  description: "Plugin description"
};

// ========== LIFECYCLE METHODS ==========

export async function install(
  userId: number,
  tenantId: string,
  config: any,
  context: PluginContext
) {
  const { sequelize } = context;

  // Create plugin-specific tables
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "${tenantId}".my_plugin_config (
      id SERIAL PRIMARY KEY,
      setting_key VARCHAR(100) NOT NULL,
      setting_value TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  return {
    success: true,
    message: "Plugin installed successfully",
    installedAt: new Date().toISOString()
  };
}

export async function uninstall(
  userId: number,
  tenantId: string,
  context: PluginContext
) {
  const { sequelize } = context;

  // Clean up tables
  await sequelize.query(`DROP TABLE IF EXISTS "${tenantId}".my_plugin_config CASCADE`);

  return {
    success: true,
    message: "Plugin uninstalled successfully",
    uninstalledAt: new Date().toISOString()
  };
}

export function validateConfig(config: any) {
  const errors: string[] = [];

  if (!config.api_key) {
    errors.push("API key is required");
  }

  return { valid: errors.length === 0, errors };
}

// ========== PLUGIN ROUTER ==========

export const router: Record<string, (ctx: PluginRouteContext) => Promise<PluginRouteResponse>> = {
  "GET /config": async (ctx) => {
    const { sequelize, tenantId } = ctx;
    const [configs] = await sequelize.query(
      `SELECT * FROM "${tenantId}".my_plugin_config`
    );
    return { data: configs };
  },

  "POST /config": async (ctx) => {
    const { sequelize, tenantId, body } = ctx;
    await sequelize.query(
      `INSERT INTO "${tenantId}".my_plugin_config (setting_key, setting_value) VALUES (:key, :value)`,
      { replacements: { key: body.key, value: body.value } }
    );
    return { status: 201, data: { success: true } };
  },

  "GET /items/:itemId": async (ctx) => {
    const { params } = ctx;
    return { data: { id: params.itemId } };
  }
};
```

#### Step 3: Create UI (`plugins/my-plugin/ui/src/index.tsx`)

```tsx
import React from "react";

interface Props {
  apiServices: any;
  pluginKey: string;
}

export const MyPluginConfig: React.FC<Props> = ({ apiServices, pluginKey }) => {
  return (
    <div>
      <h2>My Plugin Configuration</h2>
      {/* Configuration UI */}
    </div>
  );
};

// Export for plugin system
export default { MyPluginConfig };
```

#### Step 4: Add to plugins.json

```json
{
  "key": "my-plugin",
  "name": "My Plugin",
  "displayName": "My Plugin",
  "description": "Short description",
  "version": "1.0.0",
  "author": "VerifyWise",
  "category": "data_management",
  "iconUrl": "plugins/my-plugin/icon.svg",
  "isOfficial": true,
  "isPublished": true,
  "requiresConfiguration": true,
  "installationType": "tenant_scoped",
  "features": [
    {
      "name": "Feature 1",
      "description": "What it does",
      "displayOrder": 1
    }
  ],
  "tags": ["my-plugin", "data"],
  "pluginPath": "plugins/my-plugin",
  "entryPoint": "index.ts",
  "dependencies": {},
  "ui": {
    "bundleUrl": "/api/plugins/my-plugin/ui/dist/index.esm.js",
    "globalName": "PluginMyPlugin",
    "slots": [
      {
        "slotId": "page.plugin.config",
        "componentName": "MyPluginConfig",
        "renderType": "card"
      }
    ]
  }
}
```

#### Step 5: Build and Test

```bash
cd plugins/my-plugin/ui
npm install
npm run build

# Copy to VerifyWise server
cp -r ../my-plugin /path/to/verifywise/Servers/temp/plugins/
```

---

## 6. Framework Plugins

Framework plugins use a shared architecture with auto-generation from `template.json`.

### 6.1 Framework Types

| Type | `is_organizational` | Description |
|------|---------------------|-------------|
| **Organizational** | `true` | Applies to entire organization (SOC2, GDPR, ISO27001) |
| **Project** | `false` | Applies per-project (HIPAA, PCI-DSS, AI Ethics) |

### 6.2 Creating a Framework Plugin

#### Step 1: Create Directory

```bash
mkdir -p plugins/my-framework/ui/dist
```

#### Step 2: Create template.json (REQUIRED)

```json
{
  "id": "my-framework",
  "name": "My Framework",
  "description": "Framework description",
  "category": "Compliance",
  "tags": ["compliance", "framework"],
  "framework": {
    "name": "My Framework",
    "description": "Detailed description",
    "version": "1.0.0",
    "is_organizational": true,
    "hierarchy": {
      "type": "two_level",
      "level1_name": "Category",
      "level2_name": "Control"
    },
    "structure": [
      {
        "title": "1. Category One",
        "description": "Description of category",
        "order_no": 1,
        "items": [
          {
            "title": "1.1 Control Name",
            "description": "What this control requires",
            "order_no": 1,
            "summary": "Brief summary",
            "questions": [
              "Is requirement X met?",
              "Is requirement Y documented?"
            ],
            "evidence_examples": [
              "Policy document",
              "Audit logs",
              "Training records"
            ]
          }
        ]
      }
    ]
  }
}
```

#### Hierarchy Types

**Two-Level (`"type": "two_level"`):**
```
Category
└── Control
```

**Three-Level (`"type": "three_level"`):**
```
Chapter
└── Article
    └── Requirement
```

For three-level, add `level3_name` and nested `items` in level2:

```json
{
  "hierarchy": {
    "type": "three_level",
    "level1_name": "Chapter",
    "level2_name": "Article",
    "level3_name": "Requirement"
  },
  "structure": [
    {
      "title": "Chapter 1",
      "order_no": 1,
      "items": [
        {
          "title": "Article 1.1",
          "order_no": 1,
          "items": [
            {
              "title": "Requirement 1.1.1",
              "order_no": 1,
              "questions": ["..."],
              "evidence_examples": ["..."]
            }
          ]
        }
      ]
    }
  ]
}
```

#### Step 3: Create Icon

Create `plugins/my-framework/icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <rect width="48" height="48" rx="10" fill="#F0FDF4"/>
  <path d="M24 8L38 15V24C38 32.28 32.11 39.95 24 42C15.89 39.95 10 32.28 10 24V15L24 8Z"
        fill="#DCFCE7" stroke="#16A34A" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M17 25L22 30L31 21" stroke="#16A34A" stroke-width="3"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### Step 4: Add to plugins.json

```json
{
  "key": "my-framework",
  "name": "My Framework",
  "displayName": "My Framework",
  "description": "Brief description of the framework.",
  "region": "International",
  "frameworkType": "organizational",
  "longDescription": "Detailed description...",
  "version": "1.0.0",
  "author": "VerifyWise",
  "category": "compliance",
  "iconUrl": "plugins/my-framework/icon.svg",
  "isOfficial": true,
  "isPublished": true,
  "requiresConfiguration": false,
  "installationType": "tenant_scoped",
  "features": [
    {
      "name": "Auto-Import",
      "description": "Framework automatically imported on installation",
      "displayOrder": 1
    },
    {
      "name": "Evidence Management",
      "description": "Upload and link evidence files to controls",
      "displayOrder": 2
    }
  ],
  "tags": ["compliance", "framework", "my-framework"],
  "pluginPath": "plugins/my-framework",
  "entryPoint": "dist/index.js",
  "dependencies": {},
  "ui": {
    "bundleUrl": "/api/plugins/my-framework/ui/dist/index.esm.js",
    "globalName": "PluginCustomFrameworkImport",
    "slots": [
      {
        "slotId": "modal.framework.selection",
        "componentName": "CustomFrameworkCards",
        "renderType": "raw",
        "props": { "pluginKey": "my-framework" }
      },
      {
        "slotId": "page.controls.custom-framework",
        "componentName": "CustomFrameworkControls",
        "renderType": "raw",
        "props": { "pluginKey": "my-framework" }
      },
      {
        "slotId": "page.project-controls.custom-framework",
        "componentName": "CustomFrameworkControls",
        "renderType": "raw",
        "props": { "pluginKey": "my-framework" }
      },
      {
        "slotId": "page.framework-dashboard.custom",
        "componentName": "CustomFrameworkDashboard",
        "renderType": "raw",
        "props": { "pluginKey": "my-framework" }
      },
      {
        "slotId": "page.org-framework.management",
        "componentName": "CustomFrameworkCards",
        "renderType": "raw",
        "props": { "pluginKey": "my-framework" }
      },
      {
        "slotId": "page.project-overview.custom-framework",
        "componentName": "CustomFrameworkOverview",
        "renderType": "raw",
        "props": { "pluginKey": "my-framework" }
      }
    ]
  }
}
```

#### Step 5: Build

```bash
# Build all framework plugins (generates index.ts, compiles, copies UI)
npm run build:framework-plugins

# Or build specific plugin
npm run build:framework-plugins -- my-framework
```

### 6.3 What the Build Script Does

The `scripts/build-framework-plugins.js` script:

1. **Discovers** framework plugins by looking for `template.json` files
2. **Generates** `index.ts` from `template.json`:
   ```typescript
   import { createFrameworkPlugin } from "../../packages/custom-framework-base";
   import template from "./template.json";

   const plugin = createFrameworkPlugin({
     key: "my-framework",
     name: "My Framework",
     description: "...",
     template: template.framework,
     autoImport: true,
   });

   export const { metadata, install, uninstall, validateConfig, router } = plugin;
   ```
3. **Compiles** to `dist/index.js` using esbuild
4. **Copies** shared UI from `packages/custom-framework-ui/dist/` to `ui/dist/`

### 6.4 Non-Framework Plugins

The build script skips these plugins (they have their own build logic):
- `mlflow`
- `risk-import`
- `slack`
- `azure-ai-foundry`
- `custom-framework-import`
- `shared`
- `jira-assets`
- `model-lifecycle`
- `dataset-bulk-upload`

---

## 7. Plugin Router System

### 7.1 Route Pattern Format

Routes are defined as `"METHOD /path"` keys:

```typescript
export const router: Record<string, (ctx: PluginRouteContext) => Promise<PluginRouteResponse>> = {
  "GET /items": handleGetItems,
  "POST /items": handleCreateItem,
  "GET /items/:itemId": handleGetItem,
  "PATCH /items/:itemId": handleUpdateItem,
  "DELETE /items/:itemId": handleDeleteItem,
};
```

### 7.2 Route Context (PluginRouteContext)

```typescript
interface PluginRouteContext {
  tenantId: string;              // Current tenant identifier
  userId: number;                // Authenticated user ID
  organizationId: number;        // User's organization ID
  method: string;                // HTTP method (GET, POST, etc.)
  path: string;                  // Request path after plugin key
  params: Record<string, string>;// URL parameters (e.g., :itemId)
  query: Record<string, any>;    // Query string parameters
  body: any;                     // Request body (POST/PUT/PATCH)
  sequelize: any;                // Database connection
  configuration: Record<string, any>; // Plugin's stored configuration
}
```

### 7.3 Route Response (PluginRouteResponse)

```typescript
interface PluginRouteResponse {
  status?: number;      // HTTP status code (default 200)
  data?: any;           // JSON response data
  buffer?: any;         // Binary data (for file downloads)
  filename?: string;    // For Content-Disposition header
  contentType?: string; // Custom content type
  headers?: Record<string, string>; // Additional headers
}
```

### 7.4 Response Examples

```typescript
// JSON response
return { data: { items: [...] } };

// Custom status
return { status: 201, data: { created: true } };

// Error response
return { status: 400, data: { error: "Invalid input" } };

// File download
return {
  buffer: excelBuffer,
  filename: "export.xlsx",
  contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
};

// Custom headers
return {
  data: {...},
  headers: { "X-Custom-Header": "value" }
};
```

---

## 8. Plugin Lifecycle Methods

### 8.1 install()

Called when plugin is installed for a tenant.

```typescript
export async function install(
  userId: number,
  tenantId: string,
  config: any,
  context: PluginContext
): Promise<{ success: boolean; message: string; installedAt: string }> {
  const { sequelize } = context;

  // Create tables
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "${tenantId}".my_plugin_table (
      id SERIAL PRIMARY KEY,
      ...
    )
  `);

  return {
    success: true,
    message: "Installed successfully",
    installedAt: new Date().toISOString()
  };
}
```

### 8.2 uninstall()

Called when plugin is uninstalled. **Must clean up all resources.**

```typescript
export async function uninstall(
  userId: number,
  tenantId: string,
  context: PluginContext
): Promise<{ success: boolean; message: string; uninstalledAt: string }> {
  const { sequelize } = context;

  // Clean up file_entity_links for this plugin
  await sequelize.query(
    `DELETE FROM "${tenantId}".file_entity_links WHERE framework_type = :pluginKey`,
    { replacements: { pluginKey: "my-plugin" } }
  );

  // Drop tables
  await sequelize.query(`DROP TABLE IF EXISTS "${tenantId}".my_plugin_table CASCADE`);

  return {
    success: true,
    message: "Uninstalled successfully",
    uninstalledAt: new Date().toISOString()
  };
}
```

### 8.3 validateConfig()

Called to validate plugin configuration.

```typescript
export function validateConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.api_url) {
    errors.push("API URL is required");
  }

  if (!config.api_key) {
    errors.push("API Key is required");
  }

  return { valid: errors.length === 0, errors };
}
```

### 8.4 configure() (Optional)

Called when configuration is updated.

```typescript
export async function configure(
  userId: number,
  tenantId: string,
  config: any,
  context: PluginContext
): Promise<{ success: boolean; message: string; configuredAt: string }> {
  // Validate and apply configuration
  return {
    success: true,
    message: "Configuration applied",
    configuredAt: new Date().toISOString()
  };
}
```

### 8.5 testConnection() (Optional)

Called to test external connections.

```typescript
export async function testConnection(
  config: any,
  context?: { sequelize?: any; tenantId?: string }
): Promise<{ success: boolean; message: string; testedAt: string }> {
  try {
    // Test connection to external service
    const response = await fetch(config.api_url + "/health");

    if (!response.ok) {
      throw new Error("Connection failed");
    }

    return {
      success: true,
      message: "Connection successful",
      testedAt: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
      testedAt: new Date().toISOString()
    };
  }
}
```

---

## 9. UI Components and Slots

### 9.1 Available Slots

| Slot ID | Location | Render Types |
|---------|----------|--------------|
| `page.risks.actions` | Risk Management "Insert From" menu | `menuitem`, `modal` |
| `page.models.tabs` | Model Inventory tabs | `tab` |
| `page.plugin.config` | Plugin configuration panel | `card`, `inline` |
| `page.settings.tabs` | Settings page tabs | `tab` |
| `modal.framework.selection` | Add Framework modal | `card`, `raw` |
| `page.framework-dashboard.custom` | Org Framework Dashboard | `card`, `raw` |
| `page.controls.custom-framework` | Org Controls tab | `card`, `raw` |
| `page.project-controls.custom-framework` | Project Controls tab | `card`, `raw` |
| `page.project-overview.custom-framework` | Project Overview | `raw` |
| `page.org-framework.management` | Framework Settings | `raw` |
| `page.usecase.overview` | Use-case Overview tab | `raw` |
| `page.usecase.monitoring` | Use-case Monitoring tab | `raw` |
| `page.usecase.settings` | Use-case Settings tab | `raw` |

### 9.2 Render Types

| Type | Description |
|------|-------------|
| `card` | Wrapped in a card component |
| `tab` | Rendered as a tab in a tab panel |
| `modal` | Rendered in a modal dialog |
| `menuitem` | Rendered as a menu item |
| `raw` | Rendered directly without wrapper |
| `inline` | Rendered inline within parent |

### 9.3 Slot Configuration

```json
"slots": [
  {
    "slotId": "page.models.tabs",
    "componentName": "MLFlowTab",
    "renderType": "tab",
    "props": {
      "label": "MLFlow Data",
      "icon": "Database"
    }
  },
  {
    "slotId": "page.risks.actions",
    "componentName": "RiskImportMenuItem",
    "renderType": "menuitem",
    "props": {
      "label": "Import from Excel",
      "icon": "FileSpreadsheet"
    }
  },
  {
    "slotId": "page.risks.actions",
    "componentName": "RiskImportModal",
    "renderType": "modal",
    "trigger": "RiskImportMenuItem"
  }
]
```

### 9.4 Framework Plugin UI Components

All framework plugins use the shared `PluginCustomFrameworkImport` global name and these components:

| Component | Purpose |
|-----------|---------|
| `CustomFrameworkCards` | Framework selection cards |
| `CustomFrameworkControls` | Controls tab with framework toggle |
| `CustomFrameworkDashboard` | Dashboard statistics |
| `CustomFrameworkOverview` | Overview progress cards |
| `CustomFrameworkViewer` | Control details viewer |
| `CustomFrameworkConfig` | Settings configuration |
| `ControlItemDrawer` | Control detail drawer |
| `FrameworkDetailDrawer` | Framework detail drawer |
| `FrameworksTable` | Frameworks data table |

---

## 10. Shared Packages

### 10.1 custom-framework-base

Location: `packages/custom-framework-base/`

Provides `createFrameworkPlugin()` factory for framework plugins:

```typescript
import { createFrameworkPlugin } from "../../packages/custom-framework-base";

const plugin = createFrameworkPlugin({
  key: "my-framework",
  name: "My Framework",
  description: "...",
  version: "1.0.0",
  author: "VerifyWise",
  template: frameworkTemplate,
  autoImport: true,
});

export const { metadata, install, uninstall, validateConfig, router } = plugin;
```

#### Generated Routes

The factory creates these routes automatically:

| Route | Purpose |
|-------|---------|
| `GET /frameworks` | List frameworks for this plugin |
| `GET /frameworks/:frameworkId` | Get framework with structure |
| `DELETE /frameworks/:frameworkId` | Delete framework |
| `POST /add-to-project` | Add framework to project |
| `POST /remove-from-project` | Remove from project |
| `GET /projects/:projectId/custom-frameworks` | List project frameworks |
| `GET /projects/:projectId/frameworks/:frameworkId` | Get project framework |
| `GET /projects/:projectId/frameworks/:frameworkId/progress` | Get progress |
| `PATCH /level2/:level2Id` | Update level2 implementation |
| `PATCH /level3/:level3Id` | Update level3 implementation |
| `POST /level2/:level2Id/files` | Attach files to level2 |
| `GET /level2/:level2Id/files` | Get level2 files |
| `DELETE /level2/:level2Id/files/:fileId` | Detach file from level2 |
| `POST /level3/:level3Id/files` | Attach files to level3 |
| `GET /level3/:level3Id/files` | Get level3 files |
| `DELETE /level3/:level3Id/files/:fileId` | Detach file from level3 |

### 10.2 custom-framework-ui

Location: `packages/custom-framework-ui/`

Provides shared React UI components for all framework plugins.

#### Building

```bash
cd packages/custom-framework-ui
npm install
npm run build
```

Or from root:

```bash
npm run build:custom-framework-ui
```

Output: `packages/custom-framework-ui/dist/index.esm.js`

#### Exported Components

```typescript
export { CustomFrameworkConfig } from "./CustomFrameworkConfig";
export { FrameworkImportModal } from "./FrameworkImportModal";
export { FrameworkImportButton } from "./FrameworkImportButton";
export { CustomFrameworkViewer } from "./CustomFrameworkViewer";
export { CustomFrameworkDrawer } from "./CustomFrameworkDrawer";
export { FrameworkDetailDrawer } from "./FrameworkDetailDrawer";
export { CustomFrameworkCards } from "./CustomFrameworkCards";
export { CustomFrameworkControls } from "./CustomFrameworkControls";
export { CustomFrameworkDashboard } from "./CustomFrameworkDashboard";
export { CustomFrameworkOverview } from "./CustomFrameworkOverview";
export { ControlItemDrawer } from "./ControlItemDrawer";
export { FrameworksTable } from "./FrameworksTable";
export { theme, statusOptions } from "./theme";
```

---

## 11. Build System

### 11.1 Available Scripts

```json
{
  "scripts": {
    "build:mlflow": "cd plugins/mlflow/ui && npm install && npm run build",
    "build:risk-import": "cd plugins/risk-import/ui && npm install && npm run build",
    "build:jira-assets": "cd plugins/jira-assets/ui && npm install && npm run build",
    "build:custom-framework-ui": "cd packages/custom-framework-ui && npm install && npm run build",
    "build:framework-plugins": "node scripts/build-framework-plugins.js",
    "build:all": "npm run build:mlflow && npm run build:risk-import && npm run build:jira-assets && npm run build:custom-framework-ui && npm run build:framework-plugins && npm run build:model-lifecycle && npm run build:dataset-bulk-upload",
    "add:framework": "node scripts/add-framework.js"
  }
}
```

### 11.2 Build Order

1. Build integration plugin UIs (mlflow, risk-import, jira-assets)
2. Build shared framework UI (`build:custom-framework-ui`)
3. Build all framework plugins (`build:framework-plugins`)

### 11.3 Framework Plugin Build Process

```bash
npm run build:framework-plugins
```

What happens:
1. Discovers plugins with `template.json` files
2. Skips non-framework plugins (mlflow, slack, etc.)
3. For each framework plugin:
   - Generates `index.ts` from `template.json`
   - Compiles to `dist/index.js` using esbuild
   - Copies shared UI to `ui/dist/`

### 11.4 Building Specific Plugins

```bash
# Build specific framework plugin
npm run build:framework-plugins -- soc2

# Build multiple
npm run build:framework-plugins -- soc2 gdpr hipaa
```

---

## 12. Database Tables

### 12.1 Framework Plugin Tables (Shared)

All framework plugins use these shared tables in each tenant schema:

```sql
-- Framework definitions
custom_frameworks (
  id SERIAL PRIMARY KEY,
  plugin_key VARCHAR(100),          -- Links to plugin
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(50),
  is_organizational BOOLEAN,
  hierarchy_type VARCHAR(50),       -- 'two_level' or 'three_level'
  level_1_name VARCHAR(100),
  level_2_name VARCHAR(100),
  level_3_name VARCHAR(100),
  file_source VARCHAR(100),
  created_at TIMESTAMP
)

-- Level 1 structure (Categories/Chapters)
custom_framework_level1 (
  id SERIAL PRIMARY KEY,
  framework_id INTEGER REFERENCES custom_frameworks(id),
  title VARCHAR(500),
  description TEXT,
  order_no INTEGER,
  metadata JSONB
)

-- Level 2 structure (Controls/Articles)
custom_framework_level2 (
  id SERIAL PRIMARY KEY,
  level1_id INTEGER REFERENCES custom_framework_level1(id),
  title VARCHAR(500),
  description TEXT,
  order_no INTEGER,
  summary TEXT,
  questions TEXT[],
  evidence_examples TEXT[],
  metadata JSONB
)

-- Level 3 structure (Requirements) - for three_level hierarchies
custom_framework_level3 (
  id SERIAL PRIMARY KEY,
  level2_id INTEGER REFERENCES custom_framework_level2(id),
  title VARCHAR(500),
  description TEXT,
  order_no INTEGER,
  summary TEXT,
  questions TEXT[],
  evidence_examples TEXT[],
  metadata JSONB
)

-- Project-framework association
custom_framework_projects (
  id SERIAL PRIMARY KEY,
  framework_id INTEGER REFERENCES custom_frameworks(id),
  project_id INTEGER,
  created_at TIMESTAMP,
  UNIQUE(framework_id, project_id)
)

-- Level 2 implementation tracking
custom_framework_level2_impl (
  id SERIAL PRIMARY KEY,
  level2_id INTEGER REFERENCES custom_framework_level2(id),
  project_framework_id INTEGER REFERENCES custom_framework_projects(id),
  status VARCHAR(50),
  owner INTEGER,
  reviewer INTEGER,
  approver INTEGER,
  due_date DATE,
  implementation_details TEXT,
  evidence_links JSONB,
  feedback_links JSONB,
  auditor_feedback TEXT,
  is_demo BOOLEAN
)

-- Level 3 implementation tracking
custom_framework_level3_impl (
  id SERIAL PRIMARY KEY,
  level3_id INTEGER REFERENCES custom_framework_level3(id),
  level2_impl_id INTEGER REFERENCES custom_framework_level2_impl(id),
  status VARCHAR(50),
  owner INTEGER,
  reviewer INTEGER,
  approver INTEGER,
  due_date DATE,
  implementation_details TEXT,
  evidence_links JSONB,
  feedback_links JSONB,
  auditor_feedback TEXT,
  is_demo BOOLEAN
)

-- Risk linking
custom_framework_level2_risks (
  level2_impl_id INTEGER,
  risk_id INTEGER,
  PRIMARY KEY (level2_impl_id, risk_id)
)

custom_framework_level3_risks (
  level3_impl_id INTEGER,
  risk_id INTEGER,
  PRIMARY KEY (level3_impl_id, risk_id)
)
```

### 12.2 File Entity Links Table

For proper relational file linking (used by all plugins):

```sql
file_entity_links (
  id SERIAL PRIMARY KEY,
  file_id INTEGER REFERENCES files(id),
  framework_type VARCHAR(100),  -- Plugin key (e.g., "soc2", "gdpr")
  entity_type VARCHAR(50),      -- 'level2_impl', 'level3_impl', etc.
  entity_id INTEGER,
  link_type VARCHAR(50),        -- 'evidence', 'feedback', etc.
  created_by INTEGER,
  created_at TIMESTAMP,
  UNIQUE(file_id, framework_type, entity_type, entity_id)
)
```

---

## 13. File Attachment System

### 13.1 Overview

Files are linked to framework controls using the `file_entity_links` table, not JSON columns.

### 13.2 Backend Routes (auto-generated by createFrameworkPlugin)

```typescript
// Attach files to level2 implementation
"POST /level2/:level2Id/files": async (ctx) => {
  // body: { file_ids: number[], link_type?: string }
  // Creates file_entity_links entries
}

// Get files attached to level2
"GET /level2/:level2Id/files": async (ctx) => {
  // Returns array of files with metadata
}

// Detach file from level2
"DELETE /level2/:level2Id/files/:fileId": async (ctx) => {
  // Removes file_entity_links entry
}

// Same for level3...
"POST /level3/:level3Id/files"
"GET /level3/:level3Id/files"
"DELETE /level3/:level3Id/files/:fileId"
```

### 13.3 Frontend API Calls

Instead of sending `evidence_links` JSON in PATCH body, use these dedicated routes:

```typescript
// Attach files
await apiServices.pluginExecute(pluginKey, {
  method: "POST",
  path: `/level2/${implId}/files`,
  body: { file_ids: [123, 456], link_type: "evidence" }
});

// Get files
const files = await apiServices.pluginExecute(pluginKey, {
  method: "GET",
  path: `/level2/${implId}/files`
});

// Detach file
await apiServices.pluginExecute(pluginKey, {
  method: "DELETE",
  path: `/level2/${implId}/files/${fileId}`
});
```

### 13.4 Cleanup on Uninstall

When uninstalling a plugin, clean up file links:

```typescript
await sequelize.query(
  `DELETE FROM "${tenantId}".file_entity_links WHERE framework_type = :pluginKey`,
  { replacements: { pluginKey } }
);
```

---

## 14. Event System

### 14.1 DOM Events

Plugins communicate with the main app using custom DOM events:

```typescript
// Dispatch event
window.dispatchEvent(
  new CustomEvent("customFrameworkChanged", {
    detail: { projectId: 123 }
  })
);

// Listen for event
useEffect(() => {
  const handler = (event: CustomEvent) => {
    if (event.detail?.projectId === project.id) {
      refetchData();
    }
  };
  window.addEventListener("customFrameworkChanged", handler);
  return () => window.removeEventListener("customFrameworkChanged", handler);
}, [project.id]);
```

### 14.2 Framework Plugin Events

| Event | Detail | Purpose |
|-------|--------|---------|
| `customFrameworkChanged` | `{ projectId }` | Framework added/removed |
| `customFrameworkCountChanged` | `{ projectId, count }` | Framework count changed |

---

## 15. Testing and Deployment

### 15.1 Local Development

1. Build your plugin
2. Copy to VerifyWise server cache:
   ```bash
   cp -r plugins/my-plugin /path/to/verifywise/Servers/temp/plugins/
   ```
3. Restart the server
4. Test in browser

### 15.2 Plugin Cache

The backend caches downloaded plugins for 5 days. To force refresh:

```bash
rm -rf /path/to/verifywise/Servers/temp/plugins/my-plugin
# Restart server
```

### 15.3 Production Deployment

In production, VerifyWise fetches from the remote repository:

```bash
PLUGIN_MARKETPLACE_URL=https://raw.githubusercontent.com/org/plugin-marketplace/main/plugins.json
```

### 15.4 Verification Checklist

- [ ] Plugin appears in marketplace
- [ ] Installation succeeds
- [ ] Configuration UI renders
- [ ] API endpoints work
- [ ] Uninstallation succeeds
- [ ] For framework plugins: appears in Settings > Custom Frameworks

---

## 16. Current Plugins Inventory

### 16.1 Integration Plugins

| Plugin | Category | Key Features |
|--------|----------|--------------|
| **MLflow** | ML Ops | Model tracking, sync from MLflow server |
| **Azure AI Foundry** | ML Ops | Import Azure ML models |
| **Risk Import** | Data Management | Bulk import risks from Excel |
| **Slack** | Communication | Real-time notifications |
| **Jira Assets** | Data Management | Import AI Systems from JSM Assets |
| **Model Lifecycle** | ML Ops | Model lifecycle management |
| **Dataset Bulk Upload** | Data Management | Bulk dataset uploads |

### 16.2 Framework Plugins by Region

#### 🌐 International
- ISO 27001, PCI-DSS, CIS Controls v8, AI Ethics, Data Governance, OECD AI Principles

#### 🇺🇸 United States
- SOC 2 Type II, HIPAA, CCPA, NIST CSF, Texas AI Act, Colorado AI Act, FTC AI Guidelines, NYC Local Law 144

#### 🇨🇦 Canada
- Quebec Law 25

#### 🇪🇺 European Union
- GDPR, DORA, ALTAI

#### 🇦🇪 United Arab Emirates
- UAE PDPL

#### 🇸🇦 Saudi Arabia
- Saudi PDPL

#### 🇶🇦 Qatar
- Qatar PDPL

#### 🇧🇭 Bahrain
- Bahrain PDPL

---

## 17. Troubleshooting

### 17.1 Framework Not Appearing After Installation

1. Check `template.json` exists
2. Check plugin was built (`npm run build:framework-plugins`)
3. Check `dist/index.js` exists
4. Check `isPublished: true` in plugins.json
5. Check plugin was copied to server cache

### 17.2 UI Components Not Loading

1. Check `bundleUrl` in plugins.json
2. Check `ui/dist/index.esm.js` exists
3. Check browser console for errors
4. Verify `globalName` matches component exports

### 17.3 API Routes Not Working

1. Check route pattern format (`"METHOD /path"`)
2. Check handler is async and returns PluginRouteResponse
3. Check tenantId usage in SQL queries
4. Check error handling

### 17.4 Database Errors

1. Ensure tables are created in install()
2. Use tenantId schema: `"${tenantId}".table_name`
3. Check CASCADE on foreign keys
4. Clean up properly in uninstall()

### 17.5 Build Errors

1. Run `npm install` in plugin directory
2. Check TypeScript errors
3. Check import paths
4. For frameworks: ensure `template.json` is valid JSON

---

## Quick Reference Commands

```bash
# Build all
npm run build:all

# Build framework plugins only
npm run build:framework-plugins

# Build specific framework
npm run build:framework-plugins -- soc2

# Build shared UI
npm run build:custom-framework-ui

# Build integration plugins
npm run build:mlflow
npm run build:jira-assets
npm run build:risk-import

# Copy to VerifyWise
cp -r plugins/my-plugin /path/to/verifywise/Servers/temp/plugins/
```

---

> **Remember:** Update this CLAUDE.md file whenever you make changes to the plugin system, add new plugins, or modify existing patterns.
