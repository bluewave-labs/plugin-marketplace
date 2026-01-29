# Custom Framework Import Plugin

Import and manage custom compliance frameworks with full feature support.

## Overview

This plugin allows organizations to define and import their own compliance frameworks from JSON or Excel files. Imported frameworks include all features of built-in frameworks:

- Status tracking (Not started → Implemented)
- Owner/Reviewer/Approver assignments
- Evidence management
- Risk linking
- Progress calculation
- Auditor feedback

## Features

- **JSON Import**: Import frameworks from JSON definition files
- **Excel Template**: Download and fill Excel templates for easy framework creation
- **Flexible Hierarchy**: Support for 2-level and 3-level framework structures
- **Organizational Support**: Create both organizational and project-level frameworks
- **Full Feature Parity**: All features of built-in frameworks

## JSON Import Format

```json
{
  "name": "My Custom Framework",
  "description": "Framework description",
  "version": "1.0.0",
  "is_organizational": false,
  "hierarchy": {
    "type": "two_level",
    "level1_name": "Category",
    "level2_name": "Control",
    "level3_name": null
  },
  "structure": [
    {
      "title": "Access Control",
      "description": "Controls related to access management",
      "order_no": 1,
      "items": [
        {
          "title": "AC-1: Access Control Policy",
          "description": "Establish and maintain access control policy",
          "order_no": 1,
          "summary": "Implementation guidance for this control",
          "questions": [
            "Is there a documented access control policy?",
            "Who is responsible for access control?"
          ],
          "evidence_examples": [
            "Access control policy document",
            "Policy review logs"
          ]
        }
      ]
    }
  ]
}
```

## Hierarchy Types

### Two-Level (Default)
```
Category (Level 1)
└── Control (Level 2)
```

Examples: GDPR Articles → Requirements, ISO Clauses → Sections

### Three-Level
```
Category (Level 1)
└── Control (Level 2)
    └── Subcontrol (Level 3)
```

Examples: NIST Functions → Categories → Subcategories

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/import` | Import framework from JSON |
| POST | `/import-excel` | Import framework from Excel data |
| GET | `/frameworks` | List all custom frameworks |
| GET | `/frameworks/:id` | Get framework structure |
| DELETE | `/frameworks/:id` | Delete a custom framework |
| GET | `/template` | Download Excel template |
| POST | `/initialize` | Initialize framework for project |
| GET | `/projects/:pid/frameworks/:fid` | Get project framework data |
| GET | `/projects/:pid/frameworks/:fid/progress` | Get progress stats |
| PATCH | `/level2/:id` | Update level 2 item |
| PATCH | `/level3/:id` | Update level 3 item |

## Database Schema

### Public Schema (Framework Structure)

- `custom_framework_struct` - Framework hierarchy metadata
- `custom_framework_level1_struct` - Level 1 items (Categories)
- `custom_framework_level2_struct` - Level 2 items (Controls)
- `custom_framework_level3_struct` - Level 3 items (Subcontrols)

### Tenant Schema (Implementation Data)

- `custom_framework_level2` - Level 2 implementation records
- `custom_framework_level3` - Level 3 implementation records
- `custom_framework_level2__risks` - Risk linking
- `custom_framework_level3__risks` - Risk linking

## Usage

### 1. Install the Plugin

Navigate to Plugins in VerifyWise and install "Custom Framework Import".

### 2. Import a Framework

**Option A: JSON**
1. Prepare your framework JSON following the format above
2. Open the import modal from Framework Settings
3. Paste your JSON and click Import

**Option B: Excel**
1. Download the Excel template
2. Fill in the Framework Info sheet with metadata
3. Fill in the Structure sheet with your hierarchy
4. Upload and import

### 3. Add to Project

After importing, the framework appears in "Manage Frameworks" modal.
Add it to your project like any built-in framework.

### 4. Use the Framework

- View progress on Framework Dashboard
- Update control status, assignments, and evidence
- Link controls to organizational risks
- Track completion and assignments

## Status Values

- Not started
- Draft
- In progress
- Awaiting review
- Awaiting approval
- Implemented
- Audited
- Needs rework

## Example Frameworks

The plugin can be used to import frameworks like:
- GDPR (General Data Protection Regulation)
- SOC 2 (Trust Service Criteria)
- HIPAA (Health Insurance Portability)
- PCI-DSS (Payment Card Industry)
- Internal compliance policies
- Custom governance frameworks

## Dependencies

- exceljs: ^4.4.0

## Author

VerifyWise
