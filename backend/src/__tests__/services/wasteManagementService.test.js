// Mock des modules AVANT qu'ils soient chargés
jest.mock('../../config/database', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}))

// Import des modules après les mocks
const wasteManagementService = require('../../services/wasteManagementService')
const { query } = require('../../config/database')

describe('WasteManagementService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getWasteRecords', () => {
    it('should return all waste records for user', async () => {
      const userId = 'user123'
      const mockWasteRecords = [
        {
          id: 'waste-1',
          user_id: userId,
          project_id: 'project-1',
          waste_type: 'peinture',
          waste_code: '08 01 11',
          quantity: 10.5,
          unit: 'kg',
          collection_date: new Date('2023-01-15'),
          transporter_name: 'Transport Company',
          transporter_siret: '12345678901234',
          destination_facility: 'Waste Facility',
          facility_siret: '98765432109876',
          bsd_number: 'BSD-2023-001',
          disposal_method: 'Valorisation énergétique',
          cost: 250.0,
          notes: 'Test notes',
          project_name: 'Test Project',
          client_first_name: 'John',
          client_last_name: 'Doe',
          client_company: 'Test Company',
          created_at: new Date('2023-01-15'),
        },
        {
          id: 'waste-2',
          user_id: userId,
          project_id: 'project-2',
          waste_type: 'solvants',
          waste_code: '08 01 12',
          quantity: 5.0,
          unit: 'kg',
          collection_date: new Date('2023-01-20'),
          transporter_name: 'Another Transport',
          transporter_siret: '11111111111111',
          destination_facility: 'Another Facility',
          facility_siret: '22222222222222',
          bsd_number: 'BSD-2023-002',
          disposal_method: 'Incinération',
          cost: 150.0,
          notes: 'Another test',
          project_name: 'Another Project',
          client_first_name: 'Jane',
          client_last_name: 'Smith',
          client_company: 'Another Company',
          created_at: new Date('2023-01-20'),
        },
      ]

      query.mockResolvedValueOnce({ rows: mockWasteRecords })

      const result = await wasteManagementService.getWasteRecords(userId)

      expect(result).toHaveLength(2)
      expect(result[0].waste_type).toBe('peinture')
      expect(result[1].waste_type).toBe('solvants')
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE wm.user_id = $1'),
        [userId]
      )
    })

    it('should filter waste records by project ID', async () => {
      const userId = 'user123'
      const projectId = 'project-1'
      const mockWasteRecords = [
        {
          id: 'waste-1',
          user_id: userId,
          project_id: projectId,
          waste_type: 'peinture',
          waste_code: '08 01 11',
          quantity: 10.5,
          unit: 'kg',
          collection_date: new Date('2023-01-15'),
          transporter_name: 'Transport Company',
          transporter_siret: '12345678901234',
          destination_facility: 'Waste Facility',
          facility_siret: '98765432109876',
          bsd_number: 'BSD-2023-001',
          disposal_method: 'Valorisation énergétique',
          cost: 250.0,
          notes: 'Test notes',
          project_name: 'Test Project',
          client_first_name: 'John',
          client_last_name: 'Doe',
          client_company: 'Test Company',
          created_at: new Date('2023-01-15'),
        },
      ]

      query.mockResolvedValueOnce({ rows: mockWasteRecords })

      const result = await wasteManagementService.getWasteRecords(
        userId,
        projectId
      )

      expect(result).toHaveLength(1)
      expect(result[0].project_id).toBe(projectId)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('AND wm.project_id = $2'),
        [userId, projectId]
      )
    })

    it('should handle database errors', async () => {
      const userId = 'user123'
      query.mockRejectedValueOnce(new Error('Database error'))

      await expect(
        wasteManagementService.getWasteRecords(userId)
      ).rejects.toThrow('Échec de la récupération des déchets')
    })
  })

  describe('getWasteRecordById', () => {
    it('should return waste record by ID', async () => {
      const wasteId = 'waste-1'
      const userId = 'user123'
      const mockWasteRecord = {
        id: wasteId,
        user_id: userId,
        project_id: 'project-1',
        waste_type: 'peinture',
        waste_code: '08 01 11',
        quantity: 10.5,
        unit: 'kg',
        collection_date: new Date('2023-01-15'),
        transporter_name: 'Transport Company',
        transporter_siret: '12345678901234',
        destination_facility: 'Waste Facility',
        facility_siret: '98765432109876',
        bsd_number: 'BSD-2023-001',
        disposal_method: 'Valorisation énergétique',
        cost: 250.0,
        notes: 'Test notes',
        project_name: 'Test Project',
        client_first_name: 'John',
        client_last_name: 'Doe',
        client_company: 'Test Company',
        created_at: new Date('2023-01-15'),
      }

      query.mockResolvedValueOnce({ rows: [mockWasteRecord] })

      const result = await wasteManagementService.getWasteRecordById(
        wasteId,
        userId
      )

      expect(result).toMatchObject(mockWasteRecord)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE wm.id = $1 AND wm.user_id = $2'),
        [wasteId, userId]
      )
    })

    it('should throw error if waste record not found', async () => {
      const wasteId = 'non-existent'
      const userId = 'user123'
      query.mockResolvedValueOnce({ rows: [] })

      await expect(
        wasteManagementService.getWasteRecordById(wasteId, userId)
      ).rejects.toThrow('Enregistrement de déchet non trouvé')
    })
  })

  describe('createWasteRecord', () => {
    it('should create waste record successfully', async () => {
      const wasteData = {
        userId: 'user123',
        projectId: 'project-1',
        wasteType: 'peinture',
        wasteCode: '08 01 11',
        quantity: 10.5,
        unit: 'kg',
        collectionDate: new Date('2023-01-15'),
        transporterName: 'Transport Company',
        transporterSiret: '12345678901234',
        destinationFacility: 'Waste Facility',
        facilitySiret: '98765432109876',
        bsdNumber: 'BSD-2023-001',
        disposalMethod: 'Valorisation énergétique',
        cost: 250.0,
        notes: 'Test notes',
      }

      const mockCreatedRecord = {
        id: 'waste-1',
        ...wasteData,
        created_at: new Date(),
        updated_at: new Date(),
      }

      query.mockResolvedValueOnce({ rows: [mockCreatedRecord] })

      const result = await wasteManagementService.createWasteRecord(wasteData)

      expect(result).toMatchObject(mockCreatedRecord)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO waste_management'),
        [
          'user123',
          'project-1',
          'peinture',
          '08 01 11',
          10.5,
          'kg',
          new Date('2023-01-15'),
          'Transport Company',
          '12345678901234',
          'Waste Facility',
          '98765432109876',
          'BSD-2023-001',
          'Valorisation énergétique',
          250.0,
          'Test notes',
        ]
      )
    })

    it('should handle creation errors', async () => {
      const wasteData = {
        userId: 'user123',
        projectId: 'project-1',
        wasteType: 'peinture',
        wasteCode: '08 01 11',
        quantity: 10.5,
        unit: 'kg',
        collectionDate: new Date('2023-01-15'),
        transporterName: 'Transport Company',
        transporterSiret: '12345678901234',
        destinationFacility: 'Waste Facility',
        facilitySiret: '98765432109876',
        bsdNumber: 'BSD-2023-001',
        disposalMethod: 'Valorisation énergétique',
        cost: 250.0,
        notes: 'Test notes',
      }

      query.mockRejectedValueOnce(new Error('Database error'))

      await expect(
        wasteManagementService.createWasteRecord(wasteData)
      ).rejects.toThrow("Échec de la création de l'enregistrement de déchet")
    })
  })

  describe('updateWasteRecord', () => {
    it('should update waste record successfully', async () => {
      const wasteId = 'waste-1'
      const userId = 'user123'
      const updateData = {
        quantity: 15.0,
        cost: 300.0,
        notes: 'Updated notes',
      }

      const mockUpdatedRecord = {
        id: wasteId,
        user_id: userId,
        quantity: 15.0,
        cost: 300.0,
        notes: 'Updated notes',
        updated_at: new Date(),
      }

      query.mockResolvedValueOnce({ rows: [mockUpdatedRecord] })

      const result = await wasteManagementService.updateWasteRecord(
        wasteId,
        userId,
        updateData
      )

      expect(result).toMatchObject(mockUpdatedRecord)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE waste_management'),
        expect.arrayContaining([15.0, 300.0, 'Updated notes', wasteId, userId])
      )
    })

    it('should throw error if no data to update', async () => {
      const wasteId = 'waste-1'
      const userId = 'user123'
      const updateData = {}

      await expect(
        wasteManagementService.updateWasteRecord(wasteId, userId, updateData)
      ).rejects.toThrow('Aucune donnée à mettre à jour')
    })

    it('should throw error if waste record not found', async () => {
      const wasteId = 'non-existent'
      const userId = 'user123'
      const updateData = { quantity: 15.0 }

      query.mockResolvedValueOnce({ rows: [] })

      await expect(
        wasteManagementService.updateWasteRecord(wasteId, userId, updateData)
      ).rejects.toThrow('Enregistrement de déchet non trouvé')
    })

    it('should skip undefined values in update data', async () => {
      const wasteId = 'waste-1'
      const userId = 'user123'
      const updateData = {
        quantity: 15.0,
        cost: undefined, // This should be skipped
        notes: 'Updated notes',
        transporterName: undefined, // This should be skipped
      }

      const mockUpdatedRecord = {
        id: wasteId,
        user_id: userId,
        quantity: 15.0,
        notes: 'Updated notes',
        updated_at: new Date(),
      }

      query.mockResolvedValueOnce({ rows: [mockUpdatedRecord] })

      const result = await wasteManagementService.updateWasteRecord(
        wasteId,
        userId,
        updateData
      )

      expect(result).toMatchObject(mockUpdatedRecord)
      // Should only include defined values in the query
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE waste_management'),
        expect.arrayContaining([15.0, 'Updated notes', wasteId, userId])
      )
    })
  })

  describe('deleteWasteRecord', () => {
    it('should delete waste record successfully', async () => {
      const wasteId = 'waste-1'
      const userId = 'user123'

      query.mockResolvedValueOnce({ rowCount: 1 })

      const result = await wasteManagementService.deleteWasteRecord(
        wasteId,
        userId
      )

      expect(result).toBe(true)
      expect(query).toHaveBeenCalledWith(
        'DELETE FROM waste_management WHERE id = $1 AND user_id = $2',
        [wasteId, userId]
      )
    })

    it('should return false if waste record not found', async () => {
      const wasteId = 'non-existent'
      const userId = 'user123'

      query.mockResolvedValueOnce({ rowCount: 0 })

      const result = await wasteManagementService.deleteWasteRecord(
        wasteId,
        userId
      )

      expect(result).toBe(false)
    })

    it('should handle deletion errors', async () => {
      const wasteId = 'waste-1'
      const userId = 'user123'

      query.mockRejectedValueOnce(new Error('Database error'))

      await expect(
        wasteManagementService.deleteWasteRecord(wasteId, userId)
      ).rejects.toThrow("Échec de la suppression de l'enregistrement de déchet")
    })
  })

  describe('getWasteStatistics', () => {
    it('should return waste statistics for user', async () => {
      const userId = 'user123'
      const mockStats = [
        {
          waste_type: 'peinture',
          record_count: '5',
          total_quantity: '50.5',
          avg_quantity: '10.1',
          total_cost: '1250.00',
          avg_cost: '250.00',
          projects_count: '3',
        },
        {
          waste_type: 'solvants',
          record_count: '3',
          total_quantity: '15.0',
          avg_quantity: '5.0',
          total_cost: '450.00',
          avg_cost: '150.00',
          projects_count: '2',
        },
      ]

      query.mockResolvedValueOnce({ rows: mockStats })

      const result = await wasteManagementService.getWasteStatistics(userId)

      expect(result.summary.totalRecords).toBe(8)
      expect(result.summary.totalQuantity).toBe(65.5)
      expect(result.summary.totalCost).toBe(1700.0)
      expect(result.summary.projectsCount).toBe(5)
      expect(result.summary.byType.peinture).toMatchObject({
        records: 5,
        quantity: 50.5,
        avgQuantity: 10.1,
        cost: 1250.0,
        avgCost: 250.0,
        projects: 3,
      })
      expect(result.summary.byType.solvants).toMatchObject({
        records: 3,
        quantity: 15.0,
        avgQuantity: 5.0,
        cost: 450.0,
        avgCost: 150.0,
        projects: 2,
      })
    })

    it('should filter statistics by date range', async () => {
      const userId = 'user123'
      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-12-31')
      const mockStats = [
        {
          waste_type: 'peinture',
          record_count: '2',
          total_quantity: '20.0',
          avg_quantity: '10.0',
          total_cost: '500.00',
          avg_cost: '250.00',
          projects_count: '1',
        },
      ]

      query.mockResolvedValueOnce({ rows: mockStats })

      const result = await wasteManagementService.getWasteStatistics(
        userId,
        startDate,
        endDate
      )

      expect(result.period).toEqual({ startDate, endDate })
      expect(result.summary.totalRecords).toBe(2)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('AND collection_date BETWEEN $2 AND $3'),
        [userId, startDate, endDate]
      )
    })

    it('should handle database errors', async () => {
      const userId = 'user123'
      query.mockRejectedValueOnce(new Error('Database error'))

      await expect(
        wasteManagementService.getWasteStatistics(userId)
      ).rejects.toThrow('Échec de la récupération des statistiques de déchets')
    })

    it('should handle null values in statistics data', async () => {
      const userId = 'user123'
      const mockStats = [
        {
          waste_type: 'peinture',
          record_count: '5',
          total_quantity: null, // null value
          avg_quantity: '10.1',
          total_cost: null, // null value
          avg_cost: '250.00',
          projects_count: '3',
        },
        {
          waste_type: 'solvants',
          record_count: '3',
          total_quantity: '15.0',
          avg_quantity: null, // null value
          total_cost: '450.00',
          avg_cost: null, // null value
          projects_count: '2',
        },
      ]

      query.mockResolvedValueOnce({ rows: mockStats })

      const result = await wasteManagementService.getWasteStatistics(userId)

      expect(result.summary.totalQuantity).toBe(15.0) // Only non-null values
      expect(result.summary.totalCost).toBe(450.0) // Only non-null values
      expect(result.summary.byType.peinture.quantity).toBe(0) // null converted to 0
      expect(result.summary.byType.peinture.cost).toBe(0) // null converted to 0
      expect(result.summary.byType.solvants.avgQuantity).toBe(0) // null converted to 0
      expect(result.summary.byType.solvants.avgCost).toBe(0) // null converted to 0
    })
  })

  describe('getWasteTypes', () => {
    it('should return waste types information', async () => {
      const result = await wasteManagementService.getWasteTypes()

      expect(result).toHaveProperty('peinture')
      expect(result).toHaveProperty('solvants')
      expect(result).toHaveProperty('emballages')
      expect(result).toHaveProperty('dechets_amiante')
      expect(result).toHaveProperty('dechets_plomb')

      expect(result.peinture).toMatchObject({
        name: 'Déchets de peinture',
        code: '08 01 11',
        description: 'Peintures, vernis, laques en phase aqueuse',
        disposal: 'Valorisation énergétique ou élimination',
        cost: '15-25€/kg',
      })

      expect(result.dechets_amiante).toMatchObject({
        name: "Déchets d'amiante",
        code: '17 06 01',
        description: "Matériaux contenant de l'amiante",
        disposal: 'Installation de stockage de déchets dangereux',
        cost: '50-100€/kg',
        special: 'Transport et élimination réglementés',
      })
    })
  })

  describe('generateWasteReport', () => {
    it('should generate waste report for period', async () => {
      const userId = 'user123'
      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-12-31')
      const mockRecords = [
        {
          id: 'waste-1',
          user_id: userId,
          project_id: 'project-1',
          waste_type: 'peinture',
          waste_code: '08 01 11',
          quantity: 10.5,
          unit: 'kg',
          collection_date: new Date('2023-01-15'),
          transporter_name: 'Transport Company',
          transporter_siret: '12345678901234',
          destination_facility: 'Waste Facility',
          facility_siret: '98765432109876',
          bsd_number: 'BSD-2023-001',
          disposal_method: 'Valorisation énergétique',
          cost: 250.0,
          notes: 'Test notes',
          project_name: 'Test Project',
          client_first_name: 'John',
          client_last_name: 'Doe',
          client_company: 'Test Company',
          created_at: new Date('2023-01-15'),
        },
        {
          id: 'waste-2',
          user_id: userId,
          project_id: 'project-1',
          waste_type: 'peinture',
          waste_code: '08 01 11',
          quantity: 5.0,
          unit: 'kg',
          collection_date: new Date('2023-02-15'),
          transporter_name: 'Another Transport',
          transporter_siret: '11111111111111',
          destination_facility: 'Another Facility',
          facility_siret: '22222222222222',
          bsd_number: 'BSD-2023-002',
          disposal_method: 'Valorisation énergétique',
          cost: 150.0,
          notes: 'Another test',
          project_name: 'Test Project',
          client_first_name: 'John',
          client_last_name: 'Doe',
          client_company: 'Test Company',
          created_at: new Date('2023-02-15'),
        },
      ]

      query.mockResolvedValueOnce({ rows: mockRecords })

      const result = await wasteManagementService.generateWasteReport(
        userId,
        startDate,
        endDate
      )

      expect(result.period).toEqual({ startDate, endDate })
      expect(result.records).toHaveLength(2)
      expect(result.summary.totalRecords).toBe(2)
      expect(result.summary.totalQuantity).toBe(15.5)
      expect(result.summary.totalCost).toBe(400.0)
      expect(result.summary.byType.peinture).toMatchObject({
        count: 2,
        quantity: 15.5,
        cost: 400.0,
      })
      expect(result.summary.byProject['Test Project']).toMatchObject({
        count: 2,
        quantity: 15.5,
        cost: 400.0,
      })
      expect(result.summary.compliance.hasBsd).toBe(100)
      expect(result.summary.compliance.hasTransporter).toBe(100)
      expect(result.summary.compliance.hasDestination).toBe(100)
    })

    it('should handle database errors', async () => {
      const userId = 'user123'
      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-12-31')

      query.mockRejectedValueOnce(new Error('Database error'))

      await expect(
        wasteManagementService.generateWasteReport(userId, startDate, endDate)
      ).rejects.toThrow('Échec de la génération du rapport de déchets')
    })

    it('should handle records with null values', async () => {
      const userId = 'user123'
      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-12-31')
      const mockRecords = [
        {
          id: 'waste-1',
          user_id: userId,
          project_id: 'project-1',
          waste_type: 'peinture',
          quantity: null, // null value
          cost: null, // null value
          project_name: null, // null project name
          created_at: new Date('2023-01-15'),
        },
        {
          id: 'waste-2',
          user_id: userId,
          project_id: 'project-2',
          waste_type: 'solvants',
          quantity: 5.0,
          cost: 100.0,
          project_name: 'Test Project', // valid project name
          created_at: new Date('2023-01-20'),
        },
      ]

      query.mockResolvedValueOnce({ rows: mockRecords })

      const result = await wasteManagementService.generateWasteReport(
        userId,
        startDate,
        endDate
      )

      expect(result.summary.totalQuantity).toBe(5.0) // Only non-null values
      expect(result.summary.totalCost).toBe(100.0) // Only non-null values
      expect(result.summary.byType.peinture.quantity).toBe(0) // null converted to 0
      expect(result.summary.byType.peinture.cost).toBe(0) // null converted to 0
      expect(result.summary.byProject['Test Project']).toBeDefined() // Only valid project names
    })
  })
})
