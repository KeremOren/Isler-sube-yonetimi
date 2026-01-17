const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const analyticsService = require('../services/analytics');

const router = express.Router();


router.get('/kpis', authenticate, async (req, res) => {
    try {
        const { year, district, branch_id, category } = req.query;
        const targetYear = year || new Date().getFullYear();

        const kpis = await analyticsService.getKPIs(targetYear, { district, branch_id, category });

        res.json(kpis);

    } catch (error) {
        console.error('Get KPIs error:', error);
        res.status(500).json({ error: 'KPI verileri alınamadı.' });
    }
});


router.get('/monthly-trend', authenticate, async (req, res) => {
    try {
        const { year, district, branch_id } = req.query;
        const targetYear = year || new Date().getFullYear();

        const trend = await analyticsService.getMonthlyTrend(targetYear, { district, branch_id });

        res.json({ trend });

    } catch (error) {
        console.error('Get monthly trend error:', error);
        res.status(500).json({ error: 'Aylık trend verileri alınamadı.' });
    }
});


router.get('/revenue-expense', authenticate, async (req, res) => {
    try {
        const { year, district } = req.query;
        const targetYear = year || new Date().getFullYear();

        const data = await analyticsService.getRevenueVsExpense(targetYear, { district });

        res.json({ data });

    } catch (error) {
        console.error('Get revenue vs expense error:', error);
        res.status(500).json({ error: 'Gelir/Gider verileri alınamadı.' });
    }
});


router.get('/margin-by-branch', authenticate, async (req, res) => {
    try {
        const { year, district } = req.query;
        const targetYear = year || new Date().getFullYear();

        const margins = await analyticsService.getMarginByBranch(targetYear, { district });

        res.json({ margins });

    } catch (error) {
        console.error('Get margin by branch error:', error);
        res.status(500).json({ error: 'Marj verileri alınamadı.' });
    }
});


router.get('/branch-comparison', authenticate, async (req, res) => {
    try {
        const { branch_ids, year } = req.query;

        if (!branch_ids) {
            return res.status(400).json({ error: 'En az 2 şube ID\'si gereklidir.' });
        }

        const ids = branch_ids.split(',').map(id => parseInt(id.trim()));

        if (ids.length < 2 || ids.length > 5) {
            return res.status(400).json({ error: '2 ile 5 arasında şube karşılaştırılabilir.' });
        }

        const targetYear = year || new Date().getFullYear();
        const comparison = await analyticsService.compareBranches(ids, targetYear);

        res.json(comparison);

    } catch (error) {
        console.error('Branch comparison error:', error);
        res.status(500).json({ error: 'Şube karşılaştırması yapılamadı.' });
    }
});


router.get('/risk', authenticate, async (req, res) => {
    try {
        const riskData = await analyticsService.getRiskAnalysis();

        res.json(riskData);

    } catch (error) {
        console.error('Risk analysis error:', error);
        res.status(500).json({ error: 'Risk analizi yapılamadı.' });
    }
});


router.get('/opportunity', authenticate, async (req, res) => {
    try {
        const opportunities = await analyticsService.getOpportunityAnalysis();

        res.json(opportunities);

    } catch (error) {
        console.error('Opportunity analysis error:', error);
        res.status(500).json({ error: 'Fırsat analizi yapılamadı.' });
    }
});


router.get('/categories', authenticate, async (req, res) => {
    try {
        const { year, branch_id } = req.query;
        const targetYear = year || new Date().getFullYear();

        const categories = await analyticsService.getCategoryBreakdown(targetYear, { branch_id });

        res.json({ categories });

    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Kategori verileri alınamadı.' });
    }
});

router.get('/alerts', authenticate, async (req, res) => {
    try {
        const [alerts] = await db.execute(`
            SELECT ea.*, b.name as branch_name
            FROM expense_alerts ea
            LEFT JOIN branches b ON ea.branch_id = b.id
            WHERE ea.is_resolved = FALSE
            ORDER BY ea.created_at DESC
            LIMIT 10
        `);

        const [countResult] = await db.execute(`
            SELECT COUNT(*) as total FROM expense_alerts WHERE is_resolved = FALSE
        `);

        res.json({
            alerts,
            totalUnresolved: countResult[0].total
        });

    } catch (error) {
        console.error('Get alerts error:', error);
        res.json({ alerts: [], totalUnresolved: 0 });
    }
});

module.exports = router;
