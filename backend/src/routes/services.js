const express = require('express');
const Joi = require('joi');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Schémas de validation
const serviceSchema = Joi.object({
    category_id: Joi.string().uuid().optional(),
    name: Joi.string().min(2).max(255).required(),
    description: Joi.string().optional(),
    unit: Joi.string().max(50).default('m²'),
    price_ht: Joi.number().positive().required(),
    price_ttc: Joi.number().positive().required(),
    vat_rate: Joi.number().min(0).max(100).default(20.00),
    is_active: Joi.boolean().default(true)
});

const categorySchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().optional(),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#004AAD')
});

// === CATÉGORIES ===

// GET /categories - Récupérer toutes les catégories
router.get('/categories', authenticateToken, async (req, res, next) => {
    try {
        const result = await query(
            `SELECT id, name, description, color, created_at, updated_at
       FROM service_categories 
       WHERE user_id = $1
       ORDER BY name`,
            [req.user.userId]
        );

        res.json({
            categories: result.rows.map(category => ({
                id: category.id,
                name: category.name,
                description: category.description,
                color: category.color,
                createdAt: category.created_at,
                updatedAt: category.updated_at
            }))
        });

    } catch (error) {
        next(error);
    }
});

// POST /categories - Créer une nouvelle catégorie
router.post('/categories', authenticateToken, async (req, res, next) => {
    try {
        const { error, value } = categorySchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Données invalides',
                details: error.details.map(detail => detail.message)
            });
        }

        const { name, description, color } = value;

        const result = await query(
            `INSERT INTO service_categories (user_id, name, description, color)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, color, created_at, updated_at`,
            [req.user.userId, name, description, color]
        );

        const category = result.rows[0];

        res.status(201).json({
            message: 'Catégorie créée avec succès',
            category: {
                id: category.id,
                name: category.name,
                description: category.description,
                color: category.color,
                createdAt: category.created_at,
                updatedAt: category.updated_at
            }
        });

    } catch (error) {
        next(error);
    }
});

// === SERVICES ===

// GET / - Récupérer tous les services
router.get('/', authenticateToken, async (req, res, next) => {
    try {
        // Supporter à la fois category_id (frontend) et categoryId (legacy)
        const {
            category_id: categoryIdSnake,
            categoryId: categoryIdCamel,
            search = '',
            page = 1,
            limit = 20,
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        const categoryId = categoryIdSnake || categoryIdCamel || null;

        const pageNum = parseInt(page, 10) || 1;
        const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
        const offset = (pageNum - 1) * limitNum;

        let whereClause = 'WHERE s.user_id = $1';
        let queryParams = [req.user.userId];
        let paramCount = 1;

        if (categoryId) {
            paramCount++;
            whereClause += ` AND s.category_id = $${paramCount}`;
            queryParams.push(categoryId);
        }

        if (search) {
            paramCount++;
            whereClause += ` AND s.name ILIKE $${paramCount}`;
            queryParams.push(`%${search}%`);
        }

        // Whitelist des colonnes de tri
        const sortableColumns = {
            name: 's.name',
            created_at: 's.created_at',
            price_ht: 's.price_ht',
            price_ttc: 's.price_ttc'
        };
        const orderColumn = sortableColumns[sortBy] || 's.name';
        const orderDirection = String(sortOrder).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        const result = await query(
            `SELECT s.id, s.category_id, s.name, s.description, s.unit, s.price_ht, s.price_ttc, s.vat_rate, s.is_active, s.created_at, s.updated_at,
              sc.name as category_name, sc.color as category_color
       FROM services s
       LEFT JOIN service_categories sc ON s.category_id = sc.id
       ${whereClause}
       ORDER BY ${orderColumn} ${orderDirection}
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
            [...queryParams, limitNum, offset]
        );

        // Compter le total
        const countResult = await query(
            `SELECT COUNT(*) as total FROM services s ${whereClause}`,
            queryParams
        );

        res.json({
            services: result.rows.map(service => ({
                id: service.id,
                category_id: service.category_id,
                category_name: service.category_name,
                category_color: service.category_color,
                name: service.name,
                description: service.description,
                unit: service.unit,
                price_ht: parseFloat(service.price_ht),
                price_ttc: parseFloat(service.price_ttc),
                vat_rate: parseFloat(service.vat_rate),
                is_active: service.is_active,
                created_at: service.created_at,
                updated_at: service.updated_at
            })),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: parseInt(countResult.rows[0].total, 10),
                pages: Math.ceil(countResult.rows[0].total / limitNum)
            }
        });

    } catch (error) {
        next(error);
    }
});

// GET /:id - Récupérer un service spécifique
router.get('/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT s.id, s.category_id, s.name, s.description, s.unit, s.price_ht, s.price_ttc, s.vat_rate, s.is_active, s.created_at, s.updated_at,
              sc.name as category_name, sc.color as category_color
       FROM services s
       LEFT JOIN service_categories sc ON s.category_id = sc.id
       WHERE s.id = $1 AND s.user_id = $2`,
            [id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Service non trouvé'
            });
        }

        const service = result.rows[0];

        res.json({
            service: {
                id: service.id,
                category_id: service.category_id,
                category_name: service.category_name,
                category_color: service.category_color,
                name: service.name,
                description: service.description,
                unit: service.unit,
                price_ht: parseFloat(service.price_ht),
                price_ttc: parseFloat(service.price_ttc),
                vat_rate: parseFloat(service.vat_rate),
                is_active: service.is_active,
                created_at: service.created_at,
                updated_at: service.updated_at
            }
        });

    } catch (error) {
        next(error);
    }
});

// POST / - Créer un nouveau service
router.post('/', authenticateToken, async (req, res, next) => {
    try {
        const { error, value } = serviceSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Données invalides',
                details: error.details.map(detail => detail.message)
            });
        }

        const { category_id, name, description, unit, price_ht, price_ttc, vat_rate, is_active } = value;

        const result = await query(
            `INSERT INTO services (user_id, category_id, name, description, unit, price_ht, price_ttc, vat_rate, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, category_id, name, description, unit, price_ht, price_ttc, vat_rate, is_active, created_at, updated_at`,
            [req.user.userId, category_id, name, description, unit, price_ht, price_ttc, vat_rate, is_active]
        );

        const service = result.rows[0];

        res.status(201).json({
            message: 'Service créé avec succès',
            service: {
                id: service.id,
                category_id: service.category_id,
                name: service.name,
                description: service.description,
                unit: service.unit,
                price_ht: parseFloat(service.price_ht),
                price_ttc: parseFloat(service.price_ttc),
                vat_rate: parseFloat(service.vat_rate),
                is_active: service.is_active,
                created_at: service.created_at,
                updated_at: service.updated_at
            }
        });

    } catch (error) {
        next(error);
    }
});

// PUT /:id - Mettre à jour un service
router.put('/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { error, value } = serviceSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                error: 'Données invalides',
                details: error.details.map(detail => detail.message)
            });
        }

        const { category_id, name, description, unit, price_ht, price_ttc, vat_rate, is_active } = value;

        const result = await query(
            `UPDATE services 
       SET category_id = $1, name = $2, description = $3, unit = $4, price_ht = $5, price_ttc = $6, vat_rate = $7, is_active = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 AND user_id = $10
       RETURNING id, category_id, name, description, unit, price_ht, price_ttc, vat_rate, is_active, created_at, updated_at`,
            [category_id, name, description, unit, price_ht, price_ttc, vat_rate, is_active, id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Service non trouvé'
            });
        }

        const service = result.rows[0];

        res.json({
            message: 'Service mis à jour avec succès',
            service: {
                id: service.id,
                category_id: service.category_id,
                name: service.name,
                description: service.description,
                unit: service.unit,
                price_ht: parseFloat(service.price_ht),
                price_ttc: parseFloat(service.price_ttc),
                vat_rate: parseFloat(service.vat_rate),
                is_active: service.is_active,
                created_at: service.created_at,
                updated_at: service.updated_at
            }
        });

    } catch (error) {
        next(error);
    }
});

// DELETE /:id - Supprimer un service
router.delete('/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await query(
            'DELETE FROM services WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Service non trouvé'
            });
        }

        res.json({
            message: 'Service supprimé avec succès'
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
