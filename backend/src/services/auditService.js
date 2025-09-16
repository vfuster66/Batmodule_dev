const { query } = require('../config/database')

async function ensureAuditTable() {
  await query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID,
            entity_type TEXT NOT NULL,
            entity_id UUID NOT NULL,
            action TEXT NOT NULL,
            metadata JSONB,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
    `)
}

async function logAudit({
  userId,
  entityType,
  entityId,
  action,
  metadata = {},
}) {
  await ensureAuditTable()
  await query(
    'INSERT INTO audit_logs (user_id, entity_type, entity_id, action, metadata) VALUES ($1, $2, $3, $4, $5)',
    [userId || null, entityType, entityId, action, metadata]
  )
}

module.exports = { logAudit }
