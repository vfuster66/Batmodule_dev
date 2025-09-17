const express = require('express')
const Joi = require('joi')
const { query } = require('../config/database')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// Schémas de validation
const clientSchema = Joi.object({
  firstName: Joi.string()
    .min(2)
    .max(100)
    .when('isCompany', {
      is: true,
      then: Joi.optional().allow(''),
      otherwise: Joi.required(),
    }),
  lastName: Joi.string()
    .min(2)
    .max(100)
    .when('isCompany', {
      is: true,
      then: Joi.optional().allow(''),
      otherwise: Joi.required(),
    }),
  companyName: Joi.string().max(255).optional().allow(''),
  email: Joi.string().email().optional().allow(''),
  phone: Joi.string().max(20).optional().allow(''),
  addressLine1: Joi.string().max(255).optional().allow(''),
  addressLine2: Joi.string().max(255).optional().allow(''),
  postalCode: Joi.string().max(10).optional().allow(''),
  city: Joi.string().max(100).optional().allow(''),
  country: Joi.string().max(100).default('France').allow(''),
  notes: Joi.string().optional().allow(''),
  isCompany: Joi.boolean().default(false),
  // Champs légaux pour les entreprises
  siret: Joi.string().max(14).optional().allow(''),
  vatNumber: Joi.string().max(20).optional().allow(''),
  legalForm: Joi.string().max(50).optional().allow(''),
  rcsNumber: Joi.string().max(50).optional().allow(''),
  apeCode: Joi.string().max(10).optional().allow(''),
  capitalSocial: Joi.number().positive().optional().allow(null),
})
  .custom((value, helpers) => {
    // Validation personnalisée : au moins un des deux jeux doit être rempli
    if (value.isCompany) {
      // Pour une entreprise, au moins le nom de l'entreprise OU prénom/nom doit être rempli
      if (!value.companyName && !value.firstName && !value.lastName) {
        return helpers.error('custom.companyOrPersonRequired')
      }
    } else {
      // Pour une personne, prénom et nom sont obligatoires
      if (!value.firstName || !value.lastName) {
        return helpers.error('custom.personNameRequired')
      }
    }
    return value
  })
  .messages({
    'custom.companyOrPersonRequired':
      "Pour une entreprise, le nom de l'entreprise ou le prénom/nom du contact doit être renseigné",
    'custom.personNameRequired':
      'Pour une personne, le prénom et le nom sont obligatoires',
  })

// GET / - Récupérer tous les clients de l'utilisateur
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20, sortBy, sortOrder } = req.query
    const offset = (page - 1) * limit

    let whereClause = 'WHERE user_id = $1'
    let queryParams = [req.user.userId]
    let paramCount = 1

    if (search) {
      paramCount++
      whereClause += ` AND (
        first_name ILIKE $${paramCount} OR 
        last_name ILIKE $${paramCount} OR 
        company_name ILIKE $${paramCount} OR 
        email ILIKE $${paramCount}
      )`
      queryParams.push(`%${search}%`)
    }

    // Tri sécurisé
    const allowedSort = new Map([
      ['created_at', 'created_at'],
      ['updated_at', 'updated_at'],
      ['last_name', 'last_name'],
      ['first_name', 'first_name'],
      ['company_name', 'company_name'],
      ['email', 'email'],
    ])
    const orderCol =
      allowedSort.get(String(sortBy || '').toLowerCase()) || 'last_name'
    const orderDir =
      String(sortOrder || '').toLowerCase() === 'desc' ? 'DESC' : 'ASC'

    const result = await query(
      `SELECT 
                id, first_name, last_name, company_name, email, phone, address_line1, address_line2, postal_code, city, country,
                notes, is_company, siret, vat_number, legal_form, rcs_number, ape_code, capital_social, created_at, updated_at,
                (
                  SELECT COUNT(*) FROM quotes q WHERE q.client_id = clients.id AND q.user_id = $1
                ) AS quotes_count,
                (
                  SELECT COUNT(*) FROM invoices i WHERE i.client_id = clients.id AND i.user_id = $1
                ) AS invoices_count
       FROM clients 
       ${whereClause}
       ORDER BY ${orderCol} ${orderDir}
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...queryParams, limit, offset]
    )

    // Compter le total pour la pagination
    const countResult = await query(
      `SELECT COUNT(*) as total FROM clients ${whereClause}`,
      queryParams
    )

    res.json({
      clients: result.rows.map((client) => ({
        id: client.id,
        firstName: client.first_name,
        lastName: client.last_name,
        companyName: client.company_name,
        email: client.email,
        phone: client.phone,
        addressLine1: client.address_line1,
        addressLine2: client.address_line2,
        postalCode: client.postal_code,
        city: client.city,
        country: client.country,
        notes: client.notes,
        isCompany: client.is_company,
        siret: client.siret,
        vatNumber: client.vat_number,
        legalForm: client.legal_form,
        rcsNumber: client.rcs_number,
        apeCode: client.ape_code,
        capitalSocial: client.capital_social,
        // Compteurs (camelCase)
        quotesCount: parseInt(client.quotes_count || 0, 10),
        invoicesCount: parseInt(client.invoices_count || 0, 10),
        // Compatibilité avec l'UI actuelle
        quotes_count: parseInt(client.quotes_count || 0, 10),
        invoices_count: parseInt(client.invoices_count || 0, 10),
        createdAt: client.created_at,
        updatedAt: client.updated_at,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit),
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /export - Exporter tous les clients en CSV
router.get('/export', authenticateToken, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT first_name, last_name, company_name, email, phone, 
                    address_line1, address_line2, postal_code, city, country,
                    is_company, siret, vat_number, legal_form, rcs_number, ape_code, capital_social, notes
             FROM clients 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
      [req.user.userId]
    )

    // Générer le CSV
    const headers = [
      'Prénom',
      'Nom',
      'Entreprise',
      'Email',
      'Téléphone',
      'Adresse 1',
      'Adresse 2',
      'Code postal',
      'Ville',
      'Pays',
      'Est une entreprise',
      'SIRET',
      'N° TVA',
      'Forme juridique',
      'RCS',
      'Code APE',
      'Capital social',
      'Notes',
    ]

    const csvContent = [
      headers.join(','),
      ...result.rows.map((row) =>
        [
          `"${(row.first_name || '').replace(/"/g, '""')}"`,
          `"${(row.last_name || '').replace(/"/g, '""')}"`,
          `"${(row.company_name || '').replace(/"/g, '""')}"`,
          `"${(row.email || '').replace(/"/g, '""')}"`,
          `"${(row.phone || '').replace(/"/g, '""')}"`,
          `"${(row.address_line1 || '').replace(/"/g, '""')}"`,
          `"${(row.address_line2 || '').replace(/"/g, '""')}"`,
          `"${(row.postal_code || '').replace(/"/g, '""')}"`,
          `"${(row.city || '').replace(/"/g, '""')}"`,
          `"${(row.country || '').replace(/"/g, '""')}"`,
          row.is_company ? 'Oui' : 'Non',
          `"${(row.siret || '').replace(/"/g, '""')}"`,
          `"${(row.vat_number || '').replace(/"/g, '""')}"`,
          `"${(row.legal_form || '').replace(/"/g, '""')}"`,
          `"${(row.rcs_number || '').replace(/"/g, '""')}"`,
          `"${(row.ape_code || '').replace(/"/g, '""')}"`,
          row.capital_social || '',
          `"${(row.notes || '').replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ].join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="clients-${new Date().toISOString().split('T')[0]}.csv"`
    )
    res.send('\ufeff' + csvContent) // BOM UTF-8 pour Excel
  } catch (error) {
    next(error)
  }
})

// GET /:id - Récupérer un client spécifique
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params

    const result = await query(
      `SELECT id, first_name, last_name, company_name, email, phone, address_line1, address_line2, postal_code, city, country, notes, is_company, siret, vat_number, legal_form, rcs_number, ape_code, capital_social, created_at, updated_at
       FROM clients 
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Client non trouvé',
      })
    }

    const client = result.rows[0]

    res.json({
      client: {
        id: client.id,
        firstName: client.first_name,
        lastName: client.last_name,
        companyName: client.company_name,
        email: client.email,
        phone: client.phone,
        addressLine1: client.address_line1,
        addressLine2: client.address_line2,
        postalCode: client.postal_code,
        city: client.city,
        country: client.country,
        notes: client.notes,
        isCompany: client.is_company,
        siret: client.siret,
        vatNumber: client.vat_number,
        legalForm: client.legal_form,
        rcsNumber: client.rcs_number,
        apeCode: client.ape_code,
        capitalSocial: client.capital_social,
        createdAt: client.created_at,
        updatedAt: client.updated_at,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST / - Créer un nouveau client
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { error, value } = clientSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Données invalides',
        details: error.details.map((detail) => detail.message),
      })
    }

    const {
      firstName,
      lastName,
      companyName,
      email,
      phone,
      addressLine1,
      addressLine2,
      postalCode,
      city,
      country,
      notes,
      isCompany,
      siret,
      vatNumber,
      legalForm,
      rcsNumber,
      apeCode,
      capitalSocial,
    } = value

    const result = await query(
      `INSERT INTO clients (user_id, first_name, last_name, company_name, email, phone, address_line1, address_line2, postal_code, city, country, notes, is_company, siret, vat_number, legal_form, rcs_number, ape_code, capital_social)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING id, first_name, last_name, company_name, email, phone, address_line1, address_line2, postal_code, city, country, notes, is_company, siret, vat_number, legal_form, rcs_number, ape_code, capital_social, created_at, updated_at`,
      [
        req.user.userId,
        firstName,
        lastName,
        companyName,
        email,
        phone,
        addressLine1,
        addressLine2,
        postalCode,
        city,
        country,
        notes,
        isCompany,
        siret,
        vatNumber,
        legalForm,
        rcsNumber,
        apeCode,
        capitalSocial,
      ]
    )

    const client = result.rows[0]

    res.status(201).json({
      message: 'Client créé avec succès',
      client: {
        id: client.id,
        firstName: client.first_name,
        lastName: client.last_name,
        companyName: client.company_name,
        email: client.email,
        phone: client.phone,
        addressLine1: client.address_line1,
        addressLine2: client.address_line2,
        postalCode: client.postal_code,
        city: client.city,
        country: client.country,
        notes: client.notes,
        isCompany: client.is_company,
        siret: client.siret,
        vatNumber: client.vat_number,
        legalForm: client.legal_form,
        rcsNumber: client.rcs_number,
        apeCode: client.ape_code,
        capitalSocial: client.capital_social,
        createdAt: client.created_at,
        updatedAt: client.updated_at,
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /:id - Mettre à jour un client
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params
    console.log('PUT /clients payload reçu:', req.body)
    const { error, value } = clientSchema.validate(req.body)

    if (error) {
      console.log('Erreur de validation:', error.details)
      return res.status(400).json({
        error: 'Données invalides',
        details: error.details.map((detail) => detail.message),
      })
    }

    const {
      firstName,
      lastName,
      companyName,
      email,
      phone,
      addressLine1,
      addressLine2,
      postalCode,
      city,
      country,
      notes,
      isCompany,
      siret,
      vatNumber,
      legalForm,
      rcsNumber,
      apeCode,
      capitalSocial,
    } = value

    const result = await query(
      `UPDATE clients 
       SET first_name = $1, last_name = $2, company_name = $3, email = $4, phone = $5, address_line1 = $6, address_line2 = $7, postal_code = $8, city = $9, country = $10, notes = $11, is_company = $12, siret = $13, vat_number = $14, legal_form = $15, rcs_number = $16, ape_code = $17, capital_social = $18, updated_at = CURRENT_TIMESTAMP
       WHERE id = $19 AND user_id = $20
       RETURNING id, first_name, last_name, company_name, email, phone, address_line1, address_line2, postal_code, city, country, notes, is_company, siret, vat_number, legal_form, rcs_number, ape_code, capital_social, created_at, updated_at`,
      [
        firstName,
        lastName,
        companyName,
        email,
        phone,
        addressLine1,
        addressLine2,
        postalCode,
        city,
        country,
        notes,
        isCompany,
        siret,
        vatNumber,
        legalForm,
        rcsNumber,
        apeCode,
        capitalSocial,
        id,
        req.user.userId,
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Client non trouvé',
      })
    }

    const client = result.rows[0]

    res.json({
      message: 'Client mis à jour avec succès',
      client: {
        id: client.id,
        firstName: client.first_name,
        lastName: client.last_name,
        companyName: client.company_name,
        email: client.email,
        phone: client.phone,
        addressLine1: client.address_line1,
        addressLine2: client.address_line2,
        postalCode: client.postal_code,
        city: client.city,
        country: client.country,
        notes: client.notes,
        isCompany: client.is_company,
        siret: client.siret,
        vatNumber: client.vat_number,
        legalForm: client.legal_form,
        rcsNumber: client.rcs_number,
        apeCode: client.ape_code,
        capitalSocial: client.capital_social,
        createdAt: client.created_at,
        updatedAt: client.updated_at,
      },
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /:id - Supprimer un client
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params

    const result = await query(
      'DELETE FROM clients WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Client non trouvé',
      })
    }

    res.json({
      message: 'Client supprimé avec succès',
    })
  } catch (error) {
    next(error)
  }
})

// Schéma de validation pour l'import
const importClientSchema = Joi.object({
  firstName: Joi.string().min(2).max(100).required(),
  lastName: Joi.string().min(2).max(100).required(),
  companyName: Joi.string().max(255).optional().allow(''),
  email: Joi.string().email().optional().allow(''),
  phone: Joi.string().max(20).optional().allow(''),
  addressLine1: Joi.string().max(255).optional().allow(''),
  addressLine2: Joi.string().max(255).optional().allow(''),
  postalCode: Joi.string().max(10).optional().allow(''),
  city: Joi.string().max(100).optional().allow(''),
  country: Joi.string().max(100).default('France'),
  notes: Joi.string().optional().allow(''),
  isCompany: Joi.boolean().default(false),
  siret: Joi.string().max(14).optional().allow(''),
  vatNumber: Joi.string().max(20).optional().allow(''),
  legalForm: Joi.string().max(50).optional().allow(''),
  rcsNumber: Joi.string().max(50).optional().allow(''),
  apeCode: Joi.string().max(10).optional().allow(''),
  capitalSocial: Joi.number().positive().optional().allow(null),
})

// POST /import - Importer des clients depuis un CSV
router.post('/import', authenticateToken, async (req, res, next) => {
  try {
    const { clients } = req.body

    if (!Array.isArray(clients) || clients.length === 0) {
      return res.status(400).json({
        error: 'Données invalides',
        message: 'Un tableau de clients est requis',
      })
    }

    const results = {
      success: [],
      errors: [],
      total: clients.length,
    }

    // Traiter chaque client
    for (let i = 0; i < clients.length; i++) {
      const clientData = clients[i]

      try {
        // Validation
        const { error, value } = importClientSchema.validate(clientData)
        if (error) {
          results.errors.push({
            index: i + 1,
            data: clientData,
            error: error.details.map((detail) => detail.message).join(', '),
          })
          continue
        }

        // Vérifier si le client existe déjà (par email si fourni)
        if (value.email) {
          const existingClient = await query(
            'SELECT id FROM clients WHERE email = $1 AND user_id = $2',
            [value.email, req.user.userId]
          )

          if (existingClient.rows.length > 0) {
            results.errors.push({
              index: i + 1,
              data: clientData,
              error: 'Un client avec cet email existe déjà',
            })
            continue
          }
        }

        // Créer le client
        const result = await query(
          `INSERT INTO clients (
                        user_id, first_name, last_name, company_name, email, phone,
                        address_line1, address_line2, postal_code, city, country,
                        is_company, siret, vat_number, legal_form, rcs_number, ape_code, capital_social, notes
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                    RETURNING id, first_name, last_name, company_name, email`,
          [
            req.user.userId,
            value.firstName,
            value.lastName,
            value.companyName,
            value.email,
            value.phone,
            value.addressLine1,
            value.addressLine2,
            value.postalCode,
            value.city,
            value.country,
            value.isCompany,
            value.siret,
            value.vatNumber,
            value.legalForm,
            value.rcsNumber,
            value.apeCode,
            value.capitalSocial,
            value.notes,
          ]
        )

        results.success.push({
          index: i + 1,
          client: result.rows[0],
        })
      } catch (error) {
        results.errors.push({
          index: i + 1,
          data: clientData,
          error: error.message,
        })
      }
    }

    res.json({
      message: `Import terminé: ${results.success.length} clients importés, ${results.errors.length} erreurs`,
      results,
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
