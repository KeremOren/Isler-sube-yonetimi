const express = require('express');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();


router.get('/', authenticate, async (req, res) => {
    try {
        const { district, status, search } = req.query;

        let query = `
      SELECT 
        b.id,
        b.name,
        b.district,
        b.region,
        b.latitude,
        b.longitude,
        b.opened_at,
        b.status,
        b.created_at
      FROM branches b
      WHERE 1=1
    `;
        const params = [];

        if (district) {
            query += ' AND b.district = ?';
            params.push(district);
        }

        if (status) {
            query += ' AND b.status = ?';
            params.push(status);
        }

        if (search) {
            query += ' AND (b.name LIKE ? OR b.district LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY b.name';

        const [branches] = await db.execute(query, params);

        res.json({ branches });

    } catch (error) {
        console.error('Get branches error:', error);
        res.status(500).json({ error: 'Şubeler alınırken bir hata oluştu.' });
    }
});


router.get('/meta/districts', authenticate, async (req, res) => {
    try {
        const [districts] = await db.execute(
            'SELECT DISTINCT district FROM branches ORDER BY district'
        );

        res.json({ districts: districts.map(d => d.district) });

    } catch (error) {
        console.error('Get districts error:', error);
        res.status(500).json({ error: 'İlçeler alınamadı.' });
    }
});


router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        const [branches] = await db.execute(
            `SELECT 
        b.*,
        (SELECT SUM(s.revenue) FROM sales s WHERE s.branch_id = b.id AND YEAR(s.date) = YEAR(CURDATE())) as ytd_revenue,
        (SELECT SUM(e.amount) FROM expenses e WHERE e.branch_id = b.id AND YEAR(e.date) = YEAR(CURDATE())) as ytd_expenses
      FROM branches b
      WHERE b.id = ?`,
            [id]
        );

        if (branches.length === 0) {
            return res.status(404).json({ error: 'Şube bulunamadı.' });
        }

        const branch = branches[0];
        branch.ytd_profit = (branch.ytd_revenue || 0) - (branch.ytd_expenses || 0);

        res.json({ branch });

    } catch (error) {
        console.error('Get branch error:', error);
        res.status(500).json({ error: 'Şube bilgileri alınamadı.' });
    }
});


router.get('/:id/sales', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { year, category } = req.query;

        let query = `
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        category,
        SUM(quantity) as total_quantity,
        SUM(revenue) as total_revenue
      FROM sales
      WHERE branch_id = ?
    `;
        const params = [id];

        if (year) {
            query += ' AND YEAR(date) = ?';
            params.push(year);
        }

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        query += ' GROUP BY DATE_FORMAT(date, \'%Y-%m\'), category ORDER BY month, category';

        const [sales] = await db.execute(query, params);

        res.json({ sales });

    } catch (error) {
        console.error('Get branch sales error:', error);
        res.status(500).json({ error: 'Satış verileri alınamadı.' });
    }
});


router.get('/:id/expenses', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { year, expense_type } = req.query;

        let query = `
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        expense_type,
        SUM(amount) as total_amount
      FROM expenses
      WHERE branch_id = ?
    `;
        const params = [id];

        if (year) {
            query += ' AND YEAR(date) = ?';
            params.push(year);
        }

        if (expense_type) {
            query += ' AND expense_type = ?';
            params.push(expense_type);
        }

        query += ' GROUP BY DATE_FORMAT(date, \'%Y-%m\'), expense_type ORDER BY month, expense_type';

        const [expenses] = await db.execute(query, params);

        res.json({ expenses });
    } catch (error) {
        console.error('Get branch expenses error:', error);
        res.status(500).json({ error: 'Gider verileri alınamadı.' });
    }
});

module.exports = router;
