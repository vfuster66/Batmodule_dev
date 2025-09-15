const auditService = require('../../services/auditService')
const { query } = require('../../config/database')

// Mock database
jest.mock('../../config/database', () => ({
  query: jest.fn(),
}))

describe('Audit Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('logAudit', () => {
    it('should log audit entry with all parameters', async () => {
      const auditData = {
        userId: 'user123',
        entityType: 'user',
        entityId: 'entity456',
        action: 'update',
        metadata: {
          field: 'email',
          oldValue: 'old@test.com',
          newValue: 'new@test.com',
        },
      }

      query
        .mockResolvedValueOnce({}) // ensureAuditTable
        .mockResolvedValueOnce({}) // insert query

      await auditService.logAudit(auditData)

      expect(query).toHaveBeenCalledTimes(2)
      expect(query).toHaveBeenCalledWith(
        'INSERT INTO audit_logs (user_id, entity_type, entity_id, action, metadata) VALUES ($1, $2, $3, $4, $5)',
        [
          'user123',
          'user',
          'entity456',
          'update',
          {
            field: 'email',
            oldValue: 'old@test.com',
            newValue: 'new@test.com',
          },
        ]
      )
    })

    it('should log audit entry with null userId', async () => {
      const auditData = {
        userId: null,
        entityType: 'system',
        entityId: 'system123',
        action: 'startup',
        metadata: {},
      }

      query
        .mockResolvedValueOnce({}) // ensureAuditTable
        .mockResolvedValueOnce({}) // insert query

      await auditService.logAudit(auditData)

      expect(query).toHaveBeenCalledWith(
        'INSERT INTO audit_logs (user_id, entity_type, entity_id, action, metadata) VALUES ($1, $2, $3, $4, $5)',
        [null, 'system', 'system123', 'startup', {}]
      )
    })

    it('should use default empty metadata when not provided', async () => {
      const auditData = {
        userId: 'user123',
        entityType: 'user',
        entityId: 'entity456',
        action: 'delete',
        // metadata not provided
      }

      query
        .mockResolvedValueOnce({}) // ensureAuditTable
        .mockResolvedValueOnce({}) // insert query

      await auditService.logAudit(auditData)

      expect(query).toHaveBeenCalledWith(
        'INSERT INTO audit_logs (user_id, entity_type, entity_id, action, metadata) VALUES ($1, $2, $3, $4, $5)',
        ['user123', 'user', 'entity456', 'delete', {}]
      )
    })

    it('should ensure audit table exists before logging', async () => {
      const auditData = {
        userId: 'user123',
        entityType: 'user',
        entityId: 'entity456',
        action: 'create',
      }

      query
        .mockResolvedValueOnce({}) // ensureAuditTable
        .mockResolvedValueOnce({}) // insert query

      await auditService.logAudit(auditData)

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS audit_logs')
      )
    })

    it('should handle database errors', async () => {
      const auditData = {
        userId: 'user123',
        entityType: 'user',
        entityId: 'entity456',
        action: 'update',
      }

      const error = new Error('Database connection failed')
      query.mockRejectedValueOnce(error)

      await expect(auditService.logAudit(auditData)).rejects.toThrow(
        'Database connection failed'
      )
    })

    it('should handle insert errors', async () => {
      const auditData = {
        userId: 'user123',
        entityType: 'user',
        entityId: 'entity456',
        action: 'update',
      }

      const error = new Error('Insert failed')
      query
        .mockResolvedValueOnce({}) // ensureAuditTable
        .mockRejectedValueOnce(error) // insert query fails

      await expect(auditService.logAudit(auditData)).rejects.toThrow(
        'Insert failed'
      )
    })
  })

  describe('module exports', () => {
    it('should export logAudit function', () => {
      expect(auditService).toHaveProperty('logAudit')
      expect(typeof auditService.logAudit).toBe('function')
    })
  })
})
