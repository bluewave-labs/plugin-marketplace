/**
 * Model Lifecycle Plugin for VerifyWise
 *
 * This plugin provides configurable model lifecycle phase tracking with
 * approval workflows, document management, and compliance documentation.
 */

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
  file?: {
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
  };
}

interface PluginRouteResponse {
  status?: number;
  data?: any;
  buffer?: any;
  filename?: string;
  contentType?: string;
  headers?: Record<string, string>;
}

interface PluginMetadata {
  name: string;
  version: string;
  author: string;
  description: string;
}

interface InstallResult {
  success: boolean;
  message: string;
  installedAt: string;
}

interface UninstallResult {
  success: boolean;
  message: string;
  uninstalledAt: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ========== DEFAULT SEED DATA ==========

const DEFAULT_PHASES = [
  {
    name: 'Registration & Inventory',
    description: 'Initial model registration, ownership assignment, and classification of the AI model.',
    display_order: 1,
    items: [
      { name: 'Model Registration Form', item_type: 'documents', is_required: true, display_order: 1, config: { maxFiles: 5, allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] } },
      { name: 'Unique Model Identifier', item_type: 'text', is_required: true, display_order: 2, config: { placeholder: 'Enter unique model identifier' } },
      { name: 'Model Ownership Record', item_type: 'people', is_required: true, display_order: 3, config: { maxPeople: 10, roles: ['Owner', 'Co-Owner', 'Steward'] } },
      { name: 'Purpose & Intended Use', item_type: 'textarea', is_required: true, display_order: 4, config: { placeholder: 'Describe the purpose and intended use of this model' } },
      { name: 'Regulatory / Risk Classification', item_type: 'classification', is_required: true, display_order: 5, config: { levels: ['Minimal', 'Low', 'Medium', 'High', 'Critical'] } },
      { name: 'Model Dependencies', item_type: 'textarea', is_required: false, display_order: 6, config: { placeholder: 'List any model dependencies or upstream/downstream systems' } },
    ],
  },
  {
    name: 'Design & Development',
    description: 'Documentation of model design, data lineage, feature engineering, and development assessments.',
    display_order: 2,
    items: [
      { name: 'Model Design Document', item_type: 'documents', is_required: true, display_order: 1, config: {} },
      { name: 'Data Lineage & Quality Assessment', item_type: 'documents', is_required: true, display_order: 2, config: {} },
      { name: 'Feature Documentation Sheet', item_type: 'documents', is_required: true, display_order: 3, config: {} },
      { name: 'Explainability Assessment (SHAP/LIME)', item_type: 'documents', is_required: true, display_order: 4, config: {} },
      { name: 'Bias & Fairness Assessment', item_type: 'documents', is_required: true, display_order: 5, config: {} },
      { name: 'Security & Adversarial Robustness Review', item_type: 'documents', is_required: false, display_order: 6, config: {} },
      { name: 'Version Control Log', item_type: 'documents', is_required: false, display_order: 7, config: {} },
    ],
  },
  {
    name: 'Validation & Testing',
    description: 'Validation test plans, performance evaluation, bias testing, and stress testing outputs.',
    display_order: 3,
    items: [
      { name: 'Validation Test Plan', item_type: 'documents', is_required: true, display_order: 1, config: {} },
      { name: 'Performance Evaluation Results', item_type: 'documents', is_required: true, display_order: 2, config: {} },
      { name: 'Bias Testing Results & Mitigation', item_type: 'documents', is_required: true, display_order: 3, config: {} },
      { name: 'Explainability Validation', item_type: 'documents', is_required: true, display_order: 4, config: {} },
      { name: 'Stress / Adversarial Test Outputs', item_type: 'documents', is_required: false, display_order: 5, config: {} },
    ],
  },
  {
    name: 'Deployment & Operational Readiness',
    description: 'Pre-deployment checklists, rollback plans, deployment records, and governance approval.',
    display_order: 4,
    items: [
      { name: 'Deployment Readiness Checklist', item_type: 'checklist', is_required: true, display_order: 1, config: { defaultItems: ['Infrastructure validated', 'Security review complete', 'Performance benchmarks met', 'Monitoring configured', 'Rollback tested'] } },
      { name: 'Rollback & Contingency Plan', item_type: 'documents', is_required: true, display_order: 2, config: {} },
      { name: 'Deployment Record', item_type: 'documents', is_required: true, display_order: 3, config: {} },
      { name: 'Versioning History Log', item_type: 'textarea', is_required: false, display_order: 4, config: { placeholder: 'Provide versioning history for this deployment' } },
      { name: 'Model Acceptance & Governance Approval', item_type: 'approval', is_required: true, display_order: 5, config: { requiredApprovers: 2 } },
    ],
  },
  {
    name: 'Monitoring & Incident Management',
    description: 'Ongoing model monitoring, drift assessment, stability reports, and incident management.',
    display_order: 5,
    items: [
      { name: 'Monitoring Plan', item_type: 'documents', is_required: true, display_order: 1, config: {} },
      { name: 'Drift Assessment Reports', item_type: 'documents', is_required: true, display_order: 2, config: {} },
      { name: 'Operational Stability Reports', item_type: 'documents', is_required: false, display_order: 3, config: {} },
      { name: 'Incident Response SOP', item_type: 'documents', is_required: true, display_order: 4, config: {} },
      { name: 'Model Incident Log', item_type: 'documents', is_required: false, display_order: 5, config: {} },
    ],
  },
  {
    name: 'Human-in-the-Loop Oversight',
    description: 'Human oversight procedures, manual review logs, escalation protocols, and ethics review.',
    display_order: 6,
    items: [
      { name: 'HITL Procedure', item_type: 'documents', is_required: true, display_order: 1, config: {} },
      { name: 'Manual Review Logs', item_type: 'documents', is_required: false, display_order: 2, config: {} },
      { name: 'Override / Escalation Log', item_type: 'documents', is_required: false, display_order: 3, config: {} },
      { name: 'Ethics Review Committee Approvals', item_type: 'approval', is_required: true, display_order: 4, config: { requiredApprovers: 3 } },
    ],
  },
];

// ========== HELPERS ==========

function escapePgIdentifier(ident: string): string {
  if (!/^[A-Za-z0-9_]{1,30}$/.test(ident)) {
    throw new Error("Invalid tenant identifier");
  }
  return '"' + ident.replace(/"/g, '""') + '"';
}

// ========== PLUGIN LIFECYCLE METHODS ==========

/**
 * Install the Model Lifecycle plugin.
 * Creates 5 tables and seeds default phases/items.
 */
export async function install(
  _userId: number,
  tenantId: string,
  _config: any,
  context: PluginContext
): Promise<InstallResult> {
  try {
    const { sequelize } = context;
    const schema = escapePgIdentifier(tenantId);

    // 1. model_lifecycle_phases
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.model_lifecycle_phases (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_model_lifecycle_phases_display_order
      ON ${schema}.model_lifecycle_phases(display_order);
    `);

    // 2. model_lifecycle_items
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.model_lifecycle_items (
        id SERIAL PRIMARY KEY,
        phase_id INTEGER NOT NULL
          REFERENCES ${schema}.model_lifecycle_phases(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        item_type VARCHAR(50) NOT NULL DEFAULT 'text',
        is_required BOOLEAN NOT NULL DEFAULT false,
        display_order INTEGER NOT NULL DEFAULT 0,
        config JSONB NOT NULL DEFAULT '{}'::jsonb,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_model_lifecycle_items_phase_id
      ON ${schema}.model_lifecycle_items(phase_id);
    `);

    // 3. model_lifecycle_values
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.model_lifecycle_values (
        id SERIAL PRIMARY KEY,
        model_inventory_id INTEGER NOT NULL
          REFERENCES ${schema}.model_inventories(id) ON DELETE CASCADE,
        item_id INTEGER NOT NULL
          REFERENCES ${schema}.model_lifecycle_items(id) ON DELETE CASCADE,
        value_text TEXT,
        value_json JSONB,
        updated_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(model_inventory_id, item_id)
      );
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_model_lifecycle_values_model_id
      ON ${schema}.model_lifecycle_values(model_inventory_id);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_model_lifecycle_values_model_item
      ON ${schema}.model_lifecycle_values(model_inventory_id, item_id);
    `);

    // 4. model_lifecycle_item_files
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.model_lifecycle_item_files (
        id SERIAL PRIMARY KEY,
        value_id INTEGER NOT NULL
          REFERENCES ${schema}.model_lifecycle_values(id) ON DELETE CASCADE,
        file_id INTEGER NOT NULL
          REFERENCES ${schema}.files(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(value_id, file_id)
      );
    `);

    // 5. model_lifecycle_change_history
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.model_lifecycle_change_history (
        id SERIAL PRIMARY KEY,
        model_inventory_id INTEGER NOT NULL,
        item_id INTEGER,
        change_type VARCHAR(50) NOT NULL,
        changed_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
        old_value JSONB,
        new_value JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Seed default phases and items (only if no phases exist yet)
    const existingPhases = await sequelize.query(
      `SELECT COUNT(*) as count FROM ${schema}.model_lifecycle_phases;`,
      { type: sequelize.QueryTypes?.SELECT || "SELECT" }
    );

    const phaseCount = Array.isArray(existingPhases)
      ? parseInt((existingPhases[0] as any)?.count ?? "0")
      : 0;

    if (phaseCount === 0) {
      for (const phase of DEFAULT_PHASES) {
        const phaseResult = await sequelize.query(
          `INSERT INTO ${schema}.model_lifecycle_phases (name, description, display_order, is_active)
           VALUES (:name, :description, :display_order, true)
           RETURNING id;`,
          {
            replacements: {
              name: phase.name,
              description: phase.description,
              display_order: phase.display_order,
            },
          }
        );

        const phaseId = Array.isArray(phaseResult[0]) && phaseResult[0].length > 0
          ? phaseResult[0][0].id
          : phaseResult[0]?.id;

        for (const item of phase.items) {
          await sequelize.query(
            `INSERT INTO ${schema}.model_lifecycle_items
              (phase_id, name, item_type, is_required, display_order, config, is_active)
             VALUES (:phase_id, :name, :item_type, :is_required, :display_order, :config, true);`,
            {
              replacements: {
                phase_id: phaseId,
                name: item.name,
                item_type: item.item_type,
                is_required: item.is_required,
                display_order: item.display_order,
                config: JSON.stringify(item.config),
              },
            }
          );
        }
      }
    }

    return {
      success: true,
      message: `Model Lifecycle plugin installed successfully. ${phaseCount === 0 ? `Seeded ${DEFAULT_PHASES.length} default phases.` : 'Existing phases preserved.'}`,
      installedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Installation failed: ${error.message}`);
  }
}

/**
 * Uninstall the Model Lifecycle plugin.
 * Drops all 5 custom tables with CASCADE.
 */
export async function uninstall(
  _userId: number,
  tenantId: string,
  context: PluginContext
): Promise<UninstallResult> {
  try {
    const { sequelize } = context;
    const schema = escapePgIdentifier(tenantId);

    await sequelize.query(`DROP TABLE IF EXISTS ${schema}.model_lifecycle_change_history CASCADE;`);
    await sequelize.query(`DROP TABLE IF EXISTS ${schema}.model_lifecycle_item_files CASCADE;`);
    await sequelize.query(`DROP TABLE IF EXISTS ${schema}.model_lifecycle_values CASCADE;`);
    await sequelize.query(`DROP TABLE IF EXISTS ${schema}.model_lifecycle_items CASCADE;`);
    await sequelize.query(`DROP TABLE IF EXISTS ${schema}.model_lifecycle_phases CASCADE;`);

    return {
      success: true,
      message: "Model Lifecycle plugin uninstalled successfully. All lifecycle tables dropped.",
      uninstalledAt: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Uninstallation failed: ${error.message}`);
  }
}

/**
 * Validate plugin configuration.
 */
export function validateConfig(_config: any): ValidationResult {
  return { valid: true, errors: [] };
}

// ========== ROUTE HANDLERS: CONFIG ==========

async function handleGetConfig(ctx: PluginRouteContext): Promise<PluginRouteResponse> {
  const { sequelize, tenantId, query } = ctx;
  const schema = escapePgIdentifier(tenantId);
  const includeInactive = query.includeInactive === "true";
  const activeFilter = includeInactive ? "" : "WHERE is_active = true";

  const phases = await sequelize.query(
    `SELECT id, name, description, display_order, is_active, created_at, updated_at
     FROM ${schema}.model_lifecycle_phases
     ${activeFilter}
     ORDER BY display_order ASC;`,
    { type: sequelize.QueryTypes?.SELECT || "SELECT" }
  );

  for (const phase of (phases as any[])) {
    const itemFilter = includeInactive ? "" : "AND is_active = true";
    phase.items = await sequelize.query(
      `SELECT id, phase_id, name, description, item_type, is_required,
              display_order, config, is_active, created_at, updated_at
       FROM ${schema}.model_lifecycle_items
       WHERE phase_id = :phaseId ${itemFilter}
       ORDER BY display_order ASC;`,
      {
        type: sequelize.QueryTypes?.SELECT || "SELECT",
        replacements: { phaseId: phase.id },
      }
    );
  }

  return { status: 200, data: phases };
}

async function handleCreatePhase(ctx: PluginRouteContext): Promise<PluginRouteResponse> {
  const { sequelize, tenantId, body } = ctx;
  const schema = escapePgIdentifier(tenantId);

  let displayOrder = body.display_order;
  if (displayOrder === undefined) {
    const maxResult = await sequelize.query(
      `SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order FROM ${schema}.model_lifecycle_phases;`,
      { type: sequelize.QueryTypes?.SELECT || "SELECT" }
    );
    displayOrder = (maxResult[0] as any)?.next_order ?? 1;
  }

  const results = await sequelize.query(
    `INSERT INTO ${schema}.model_lifecycle_phases (name, description, display_order)
     VALUES (:name, :description, :display_order)
     RETURNING *;`,
    {
      type: sequelize.QueryTypes?.SELECT || "SELECT",
      replacements: {
        name: body.name,
        description: body.description || null,
        display_order: displayOrder,
      },
    }
  );

  return { status: 201, data: results[0] };
}

async function handleUpdatePhase(ctx: PluginRouteContext): Promise<PluginRouteResponse> {
  const { sequelize, tenantId, params, body } = ctx;
  const schema = escapePgIdentifier(tenantId);
  const phaseId = params.id;

  const setClauses: string[] = [];
  const replacements: Record<string, unknown> = { phaseId };

  if (body.name !== undefined) { setClauses.push("name = :name"); replacements.name = body.name; }
  if (body.description !== undefined) { setClauses.push("description = :description"); replacements.description = body.description; }
  if (body.display_order !== undefined) { setClauses.push("display_order = :display_order"); replacements.display_order = body.display_order; }
  if (body.is_active !== undefined) { setClauses.push("is_active = :is_active"); replacements.is_active = body.is_active; }

  if (setClauses.length === 0) {
    return { status: 400, data: { message: "No fields to update" } };
  }

  setClauses.push("updated_at = NOW()");

  const results = await sequelize.query(
    `UPDATE ${schema}.model_lifecycle_phases SET ${setClauses.join(", ")} WHERE id = :phaseId RETURNING *;`,
    { type: sequelize.QueryTypes?.SELECT || "SELECT", replacements }
  );

  if (!results || results.length === 0) {
    return { status: 404, data: { message: "Phase not found" } };
  }

  return { status: 200, data: results[0] };
}

async function handleDeletePhase(ctx: PluginRouteContext): Promise<PluginRouteResponse> {
  const { sequelize, tenantId, params } = ctx;
  const schema = escapePgIdentifier(tenantId);

  await sequelize.query(
    `DELETE FROM ${schema}.model_lifecycle_phases WHERE id = :phaseId;`,
    { replacements: { phaseId: params.id } }
  );

  return { status: 200, data: { success: true } };
}

async function handleReorderPhases(ctx: PluginRouteContext): Promise<PluginRouteResponse> {
  const { sequelize, tenantId, body } = ctx;
  const schema = escapePgIdentifier(tenantId);
  const orderedIds: number[] = body.orderedIds || [];

  for (let i = 0; i < orderedIds.length; i++) {
    await sequelize.query(
      `UPDATE ${schema}.model_lifecycle_phases SET display_order = :order, updated_at = NOW() WHERE id = :id;`,
      { replacements: { order: i + 1, id: orderedIds[i] } }
    );
  }

  return { status: 200, data: { success: true } };
}

async function handleCreateItem(ctx: PluginRouteContext): Promise<PluginRouteResponse> {
  const { sequelize, tenantId, params, body } = ctx;
  const schema = escapePgIdentifier(tenantId);
  const phaseId = params.phaseId;

  let displayOrder = body.display_order;
  if (displayOrder === undefined) {
    const maxResult = await sequelize.query(
      `SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order FROM ${schema}.model_lifecycle_items WHERE phase_id = :phaseId;`,
      { type: sequelize.QueryTypes?.SELECT || "SELECT", replacements: { phaseId } }
    );
    displayOrder = (maxResult[0] as any)?.next_order ?? 1;
  }

  const results = await sequelize.query(
    `INSERT INTO ${schema}.model_lifecycle_items
       (phase_id, name, description, item_type, is_required, display_order, config)
     VALUES (:phase_id, :name, :description, :item_type, :is_required, :display_order, :config)
     RETURNING *;`,
    {
      type: sequelize.QueryTypes?.SELECT || "SELECT",
      replacements: {
        phase_id: phaseId,
        name: body.name,
        description: body.description || null,
        item_type: body.item_type || "text",
        is_required: body.is_required ?? false,
        display_order: displayOrder,
        config: JSON.stringify(body.config || {}),
      },
    }
  );

  return { status: 201, data: results[0] };
}

async function handleUpdateItem(ctx: PluginRouteContext): Promise<PluginRouteResponse> {
  const { sequelize, tenantId, params, body } = ctx;
  const schema = escapePgIdentifier(tenantId);
  const itemId = params.id;

  const setClauses: string[] = [];
  const replacements: Record<string, unknown> = { itemId };

  if (body.name !== undefined) { setClauses.push("name = :name"); replacements.name = body.name; }
  if (body.description !== undefined) { setClauses.push("description = :description"); replacements.description = body.description; }
  if (body.item_type !== undefined) { setClauses.push("item_type = :item_type"); replacements.item_type = body.item_type; }
  if (body.is_required !== undefined) { setClauses.push("is_required = :is_required"); replacements.is_required = body.is_required; }
  if (body.display_order !== undefined) { setClauses.push("display_order = :display_order"); replacements.display_order = body.display_order; }
  if (body.config !== undefined) { setClauses.push("config = :config"); replacements.config = JSON.stringify(body.config); }
  if (body.is_active !== undefined) { setClauses.push("is_active = :is_active"); replacements.is_active = body.is_active; }

  if (setClauses.length === 0) {
    return { status: 400, data: { message: "No fields to update" } };
  }

  setClauses.push("updated_at = NOW()");

  const results = await sequelize.query(
    `UPDATE ${schema}.model_lifecycle_items SET ${setClauses.join(", ")} WHERE id = :itemId RETURNING *;`,
    { type: sequelize.QueryTypes?.SELECT || "SELECT", replacements }
  );

  return { status: 200, data: results[0] || null };
}

async function handleDeleteItem(ctx: PluginRouteContext): Promise<PluginRouteResponse> {
  const { sequelize, tenantId, params } = ctx;
  const schema = escapePgIdentifier(tenantId);

  await sequelize.query(
    `DELETE FROM ${schema}.model_lifecycle_items WHERE id = :itemId;`,
    { replacements: { itemId: params.id } }
  );

  return { status: 200, data: { success: true } };
}

async function handleReorderItems(ctx: PluginRouteContext): Promise<PluginRouteResponse> {
  const { sequelize, tenantId, params, body } = ctx;
  const schema = escapePgIdentifier(tenantId);
  const phaseId = params.phaseId;
  const orderedIds: number[] = body.orderedIds || [];

  for (let i = 0; i < orderedIds.length; i++) {
    await sequelize.query(
      `UPDATE ${schema}.model_lifecycle_items SET display_order = :order, updated_at = NOW() WHERE id = :id AND phase_id = :phaseId;`,
      { replacements: { order: i + 1, id: orderedIds[i], phaseId } }
    );
  }

  return { status: 200, data: { success: true } };
}

// ========== ROUTE HANDLERS: VALUES ==========

async function handleGetModelLifecycle(ctx: PluginRouteContext): Promise<PluginRouteResponse> {
  const { sequelize, tenantId, params } = ctx;
  const schema = escapePgIdentifier(tenantId);
  const modelId = params.id;

  const phases = await sequelize.query(
    `SELECT id, name, description, display_order, is_active
     FROM ${schema}.model_lifecycle_phases WHERE is_active = true ORDER BY display_order ASC;`,
    { type: sequelize.QueryTypes?.SELECT || "SELECT" }
  );

  for (const phase of (phases as any[])) {
    const items = await sequelize.query(
      `SELECT i.id, i.phase_id, i.name, i.description, i.item_type, i.is_required,
              i.display_order, i.config, i.is_active
       FROM ${schema}.model_lifecycle_items i
       WHERE i.phase_id = :phaseId AND i.is_active = true
       ORDER BY i.display_order ASC;`,
      { type: sequelize.QueryTypes?.SELECT || "SELECT", replacements: { phaseId: phase.id } }
    );

    const values = await sequelize.query(
      `SELECT v.id, v.model_inventory_id, v.item_id, v.value_text, v.value_json,
              v.updated_by, v.created_at, v.updated_at
       FROM ${schema}.model_lifecycle_values v
       INNER JOIN ${schema}.model_lifecycle_items i ON v.item_id = i.id
       WHERE v.model_inventory_id = :modelId AND i.phase_id = :phaseId;`,
      { type: sequelize.QueryTypes?.SELECT || "SELECT", replacements: { modelId, phaseId: phase.id } }
    );

    // Get files for document-type values
    const valueIds = (values as any[]).map((v: any) => v.id).filter(Boolean);
    const filesByValue: Record<number, any[]> = {};

    if (valueIds.length > 0) {
      const files = await sequelize.query(
        `SELECT lf.id, lf.value_id, lf.file_id, lf.created_at,
                f.filename, f.type AS mimetype
         FROM ${schema}.model_lifecycle_item_files lf
         INNER JOIN ${schema}.files f ON lf.file_id = f.id
         WHERE lf.value_id IN (:valueIds);`,
        { type: sequelize.QueryTypes?.SELECT || "SELECT", replacements: { valueIds } }
      );

      for (const file of (files as any[])) {
        if (!filesByValue[file.value_id]) filesByValue[file.value_id] = [];
        filesByValue[file.value_id].push(file);
      }
    }

    // Map values onto items
    const valueByItemId: Record<number, any> = {};
    for (const v of (values as any[])) {
      v.files = filesByValue[v.id] || [];
      valueByItemId[v.item_id] = v;
    }

    for (const item of (items as any[])) {
      item.value = valueByItemId[item.id] || null;
    }

    phase.items = items;
  }

  return { status: 200, data: phases };
}

async function handleGetProgress(ctx: PluginRouteContext): Promise<PluginRouteResponse> {
  const { sequelize, tenantId, params } = ctx;
  const schema = escapePgIdentifier(tenantId);
  const modelId = params.id;

  const phaseProgress = await sequelize.query(
    `SELECT
       p.id AS phase_id,
       p.name AS phase_name,
       COUNT(i.id)::int AS total_items,
       COUNT(v.id)::int AS filled_items,
       COUNT(CASE WHEN i.is_required = true THEN 1 END)::int AS required_items,
       COUNT(CASE WHEN i.is_required = true AND v.id IS NOT NULL THEN 1 END)::int AS filled_required_items
     FROM ${schema}.model_lifecycle_phases p
     INNER JOIN ${schema}.model_lifecycle_items i
       ON i.phase_id = p.id AND i.is_active = true
     LEFT JOIN ${schema}.model_lifecycle_values v
       ON v.item_id = i.id AND v.model_inventory_id = :modelId
       AND (v.value_text IS NOT NULL OR v.value_json IS NOT NULL
            OR EXISTS (
              SELECT 1 FROM ${schema}.model_lifecycle_item_files lf
              WHERE lf.value_id = v.id
            ))
     WHERE p.is_active = true
     GROUP BY p.id, p.name, p.display_order
     ORDER BY p.display_order ASC;`,
    { type: sequelize.QueryTypes?.SELECT || "SELECT", replacements: { modelId } }
  );

  const totals = (phaseProgress as any[]).reduce(
    (acc: any, p: any) => ({
      total_items: acc.total_items + p.total_items,
      filled_items: acc.filled_items + p.filled_items,
      total_required: acc.total_required + p.required_items,
      filled_required: acc.filled_required + p.filled_required_items,
    }),
    { total_items: 0, filled_items: 0, total_required: 0, filled_required: 0 }
  );

  return {
    status: 200,
    data: {
      phases: phaseProgress,
      ...totals,
      completion_percentage:
        totals.total_items > 0
          ? Math.round((totals.filled_items / totals.total_items) * 100)
          : 0,
    },
  };
}

async function handleUpsertValue(ctx: PluginRouteContext): Promise<PluginRouteResponse> {
  const { sequelize, tenantId, params, body, userId } = ctx;
  const schema = escapePgIdentifier(tenantId);
  const modelId = params.id;
  const itemId = params.itemId;

  const results = await sequelize.query(
    `INSERT INTO ${schema}.model_lifecycle_values
       (model_inventory_id, item_id, value_text, value_json, updated_by)
     VALUES (:modelId, :itemId, :value_text, :value_json, :userId)
     ON CONFLICT (model_inventory_id, item_id)
     DO UPDATE SET
       value_text = :value_text,
       value_json = :value_json,
       updated_by = :userId,
       updated_at = NOW()
     RETURNING *;`,
    {
      type: sequelize.QueryTypes?.SELECT || "SELECT",
      replacements: {
        modelId,
        itemId,
        value_text: body.value_text ?? null,
        value_json: body.value_json ? JSON.stringify(body.value_json) : null,
        userId,
      },
    }
  );

  return { status: 200, data: results[0] };
}

async function handleAddFile(ctx: PluginRouteContext): Promise<PluginRouteResponse> {
  const { sequelize, tenantId, params, body, userId } = ctx;
  const schema = escapePgIdentifier(tenantId);
  const modelId = params.id;
  const itemId = params.itemId;
  const fileId = body.fileId;

  if (!fileId) {
    return { status: 400, data: { message: "fileId is required" } };
  }

  // Ensure a value row exists
  await sequelize.query(
    `INSERT INTO ${schema}.model_lifecycle_values
       (model_inventory_id, item_id, updated_by)
     VALUES (:modelId, :itemId, :userId)
     ON CONFLICT (model_inventory_id, item_id) DO NOTHING;`,
    { replacements: { modelId, itemId, userId } }
  );

  const valueResult = await sequelize.query(
    `SELECT id FROM ${schema}.model_lifecycle_values
     WHERE model_inventory_id = :modelId AND item_id = :itemId;`,
    { type: sequelize.QueryTypes?.SELECT || "SELECT", replacements: { modelId, itemId } }
  );

  const valueId = (valueResult[0] as any)?.id;

  const results = await sequelize.query(
    `INSERT INTO ${schema}.model_lifecycle_item_files (value_id, file_id)
     VALUES (:valueId, :fileId)
     ON CONFLICT (value_id, file_id) DO NOTHING
     RETURNING *;`,
    { type: sequelize.QueryTypes?.SELECT || "SELECT", replacements: { valueId, fileId } }
  );

  return { status: 201, data: results[0] || { value_id: valueId, file_id: fileId } };
}

async function handleRemoveFile(ctx: PluginRouteContext): Promise<PluginRouteResponse> {
  const { sequelize, tenantId, params } = ctx;
  const schema = escapePgIdentifier(tenantId);
  const modelId = params.id;
  const itemId = params.itemId;
  const fileId = params.fileId;

  await sequelize.query(
    `DELETE FROM ${schema}.model_lifecycle_item_files
     WHERE file_id = :fileId
     AND value_id = (
       SELECT id FROM ${schema}.model_lifecycle_values
       WHERE model_inventory_id = :modelId AND item_id = :itemId
     );`,
    { replacements: { fileId, modelId, itemId } }
  );

  return { status: 200, data: { success: true } };
}

// ========== PLUGIN METADATA ==========

export const metadata: PluginMetadata = {
  name: "Model Lifecycle",
  version: "1.0.0",
  author: "VerifyWise",
  description: "Track AI model lifecycle phases from registration through monitoring with configurable phases, approval workflows, and compliance documentation",
};

// ========== PLUGIN ROUTER ==========

export const router: Record<string, (ctx: PluginRouteContext) => Promise<PluginRouteResponse>> = {
  // Config routes
  "GET /config": handleGetConfig,
  "POST /phases": handleCreatePhase,
  "PUT /phases/:id": handleUpdatePhase,
  "DELETE /phases/:id": handleDeletePhase,
  "PUT /phases/reorder": handleReorderPhases,
  "POST /phases/:phaseId/items": handleCreateItem,
  "PUT /items/:id": handleUpdateItem,
  "DELETE /items/:id": handleDeleteItem,
  "PUT /phases/:phaseId/items/reorder": handleReorderItems,

  // Value routes
  "GET /models/:id/lifecycle": handleGetModelLifecycle,
  "GET /models/:id/lifecycle/progress": handleGetProgress,
  "PUT /models/:id/lifecycle/items/:itemId": handleUpsertValue,
  "POST /models/:id/lifecycle/items/:itemId/files": handleAddFile,
  "DELETE /models/:id/lifecycle/items/:itemId/files/:fileId": handleRemoveFile,
};
