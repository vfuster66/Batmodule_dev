const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Table notifications simple (si non existante)
async function ensureTable() {
    await query(`CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        body TEXT,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`);
}

// GET /api/notifications
router.get('/', authenticateToken, async (req, res, next) => {
    try {
        await ensureTable();
        const result = await query(
            'SELECT id, title, body, is_read, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
            [req.user.userId]
        );
        res.json({ notifications: result.rows });
    } catch (error) {
        next(error);
    }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticateToken, async (req, res, next) => {
    try {
        await ensureTable();
        const { id } = req.params;
        const result = await query(
            'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, req.user.userId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Notification non trouvée' });
        res.json({ message: 'Notification lue' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;


