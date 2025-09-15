const rlsContext = require('../../middleware/rlsContext')
const { query, transaction } = require('../../config/database')

// Mock database functions
jest.mock('../../config/database', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}))

describe('RLS Context Middleware', () => {
  let mockReq
  let mockRes
  let mockNext
  let consoleSpy

  beforeEach(() => {
    mockReq = {}
    mockRes = {}
    mockNext = jest.fn()

    jest.clearAllMocks()

    // Mock console
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
    }
  })

  afterEach(() => {
    consoleSpy.log.mockRestore()
    consoleSpy.error.mockRestore()
  })

  describe('setRLSContext', () => {
    it('should set RLS context when user is authenticated', async () => {
      mockReq.user = { userId: 'user123' }
      query.mockResolvedValueOnce({})

      await rlsContext.setRLSContext(mockReq, mockRes, mockNext)

      expect(query).toHaveBeenCalledWith('SELECT set_user_context($1)', [
        'user123',
      ])
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[RLS] Contexte utilisateur défini: user123'
      )
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should not set RLS context when user is not authenticated', async () => {
      mockReq.user = null

      await rlsContext.setRLSContext(mockReq, mockRes, mockNext)

      expect(query).not.toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should not set RLS context when user has no userId', async () => {
      mockReq.user = { username: 'test' }

      await rlsContext.setRLSContext(mockReq, mockRes, mockNext)

      expect(query).not.toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should handle database errors', async () => {
      mockReq.user = { userId: 'user123' }
      const error = new Error('Database error')
      query.mockRejectedValueOnce(error)

      await rlsContext.setRLSContext(mockReq, mockRes, mockNext)

      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Erreur lors de la définition du contexte RLS:',
        error
      )
      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('clearRLSContext', () => {
    it('should clear RLS context successfully', async () => {
      query.mockResolvedValueOnce({})

      await rlsContext.clearRLSContext(mockReq, mockRes, mockNext)

      expect(query).toHaveBeenCalledWith('SELECT set_user_context(NULL::uuid)')
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[RLS] Contexte utilisateur nettoyé'
      )
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should handle database errors', async () => {
      const error = new Error('Database error')
      query.mockRejectedValueOnce(error)

      await rlsContext.clearRLSContext(mockReq, mockRes, mockNext)

      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Erreur lors du nettoyage du contexte RLS:',
        error
      )
      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('queryWithRLS', () => {
    it('should execute query with RLS context', async () => {
      const mockResult = { rows: [{ id: 1 }] }
      query
        .mockResolvedValueOnce({}) // set_user_context
        .mockResolvedValueOnce(mockResult) // actual query
        .mockResolvedValueOnce({}) // clear context

      const result = await rlsContext.queryWithRLS(
        'SELECT * FROM test',
        [],
        'user123'
      )

      expect(query).toHaveBeenCalledWith('SELECT set_user_context($1)', [
        'user123',
      ])
      expect(query).toHaveBeenCalledWith('SELECT * FROM test', [])
      expect(query).toHaveBeenCalledWith('SELECT set_user_context(NULL::uuid)')
      expect(result).toEqual(mockResult)
    })

    it('should execute query without RLS context when userId is null', async () => {
      const mockResult = { rows: [{ id: 1 }] }
      query.mockResolvedValueOnce(mockResult)

      const result = await rlsContext.queryWithRLS('SELECT * FROM test', [])

      expect(query).toHaveBeenCalledTimes(1)
      expect(query).toHaveBeenCalledWith('SELECT * FROM test', [])
      expect(result).toEqual(mockResult)
    })

    it('should clean up context on query error', async () => {
      const error = new Error('Query failed')
      query
        .mockResolvedValueOnce({}) // set_user_context
        .mockRejectedValueOnce(error) // actual query fails
        .mockResolvedValueOnce({}) // cleanup

      await expect(
        rlsContext.queryWithRLS('SELECT * FROM test', [], 'user123')
      ).rejects.toThrow('Query failed')

      expect(query).toHaveBeenCalledWith('SELECT set_user_context(NULL::uuid)')
    })

    it('should handle cleanup errors gracefully', async () => {
      const queryError = new Error('Query failed')
      const cleanupError = new Error('Cleanup failed')
      query
        .mockResolvedValueOnce({}) // set_user_context
        .mockRejectedValueOnce(queryError) // actual query fails
        .mockRejectedValueOnce(cleanupError) // cleanup fails

      await expect(
        rlsContext.queryWithRLS('SELECT * FROM test', [], 'user123')
      ).rejects.toThrow('Query failed')

      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Erreur lors du nettoyage RLS:',
        cleanupError
      )
    })

    it('should handle cleanup errors gracefully when userId is null', async () => {
      const queryError = new Error('Query failed')
      query.mockRejectedValueOnce(queryError)

      await expect(
        rlsContext.queryWithRLS('SELECT * FROM test', [])
      ).rejects.toThrow('Query failed')

      // Should not attempt cleanup when userId is null
      expect(query).toHaveBeenCalledTimes(1)
    })
  })

  describe('transactionWithRLS', () => {
    it('should execute transaction with RLS context', async () => {
      const mockCallback = jest.fn().mockResolvedValue('result')
      const mockResult = 'result'

      query
        .mockResolvedValueOnce({}) // set_user_context
        .mockResolvedValueOnce({}) // clear context
      transaction.mockResolvedValueOnce(mockResult)

      const result = await rlsContext.transactionWithRLS(
        mockCallback,
        'user123'
      )

      expect(query).toHaveBeenCalledWith('SELECT set_user_context($1)', [
        'user123',
      ])
      expect(transaction).toHaveBeenCalledWith(mockCallback)
      expect(query).toHaveBeenCalledWith('SELECT set_user_context(NULL::uuid)')
      expect(result).toBe(mockResult)
    })

    it('should execute transaction without RLS context when userId is null', async () => {
      const mockCallback = jest.fn().mockResolvedValue('result')
      const mockResult = 'result'
      transaction.mockResolvedValueOnce(mockResult)

      const result = await rlsContext.transactionWithRLS(mockCallback)

      expect(query).not.toHaveBeenCalled()
      expect(transaction).toHaveBeenCalledWith(mockCallback)
      expect(result).toBe(mockResult)
    })

    it('should clean up context on transaction error', async () => {
      const mockCallback = jest
        .fn()
        .mockRejectedValue(new Error('Transaction failed'))

      query
        .mockResolvedValueOnce({}) // set_user_context
        .mockResolvedValueOnce({}) // cleanup
      transaction.mockRejectedValueOnce(new Error('Transaction failed'))

      await expect(
        rlsContext.transactionWithRLS(mockCallback, 'user123')
      ).rejects.toThrow('Transaction failed')

      expect(query).toHaveBeenCalledWith('SELECT set_user_context(NULL::uuid)')
    })

    it('should handle cleanup errors gracefully on transaction error', async () => {
      const mockCallback = jest
        .fn()
        .mockRejectedValue(new Error('Transaction failed'))
      const cleanupError = new Error('Cleanup failed')

      query
        .mockResolvedValueOnce({}) // set_user_context
        .mockRejectedValueOnce(cleanupError) // cleanup fails
      transaction.mockRejectedValueOnce(new Error('Transaction failed'))

      await expect(
        rlsContext.transactionWithRLS(mockCallback, 'user123')
      ).rejects.toThrow('Transaction failed')

      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Erreur lors du nettoyage RLS:',
        cleanupError
      )
    })

    it('should handle cleanup errors gracefully when userId is null in transaction', async () => {
      const mockCallback = jest
        .fn()
        .mockRejectedValue(new Error('Transaction failed'))
      transaction.mockRejectedValueOnce(new Error('Transaction failed'))

      await expect(rlsContext.transactionWithRLS(mockCallback)).rejects.toThrow(
        'Transaction failed'
      )

      // Should not attempt cleanup when userId is null
      expect(query).not.toHaveBeenCalled()
    })
  })

  describe('module exports', () => {
    it('should export all required functions', () => {
      expect(rlsContext).toHaveProperty('setRLSContext')
      expect(rlsContext).toHaveProperty('clearRLSContext')
      expect(rlsContext).toHaveProperty('queryWithRLS')
      expect(rlsContext).toHaveProperty('transactionWithRLS')
      expect(typeof rlsContext.setRLSContext).toBe('function')
      expect(typeof rlsContext.clearRLSContext).toBe('function')
      expect(typeof rlsContext.queryWithRLS).toBe('function')
      expect(typeof rlsContext.transactionWithRLS).toBe('function')
    })
  })
})
