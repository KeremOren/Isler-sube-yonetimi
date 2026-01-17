const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();


router.get('/branch/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { months = 6 } = req.query;
        const forecastMonths = Math.min(parseInt(months), 12);

        
        const [branches] = await db.execute(
            'SELECT id, name, district FROM branches WHERE id = ?',
            [id]
        );

        if (branches.length === 0) {
            return res.status(404).json({ error: 'Şube bulunamadı.' });
        }

        const branch = branches[0];

        
        const [historicalData] = await db.execute(`
            SELECT 
                DATE_FORMAT(s.date, '%Y-%m') as month,
                SUM(s.revenue) as revenue,
                SUM(s.quantity) as quantity
            FROM sales s
            WHERE s.branch_id = ?
            GROUP BY DATE_FORMAT(s.date, '%Y-%m')
            ORDER BY month DESC
            LIMIT 24
        `, [id]);

        
        const [expenseData] = await db.execute(`
            SELECT 
                DATE_FORMAT(e.date, '%Y-%m') as month,
                SUM(e.amount) as expenses
            FROM expenses e
            WHERE e.branch_id = ?
            GROUP BY DATE_FORMAT(e.date, '%Y-%m')
            ORDER BY month DESC
            LIMIT 24
        `, [id]);

        
        const expenseMap = {};
        expenseData.forEach(e => {
            expenseMap[e.month] = parseFloat(e.expenses) || 0;
        });

        const historical = historicalData.reverse().map(h => ({
            month: h.month,
            revenue: parseFloat(h.revenue) || 0,
            expenses: expenseMap[h.month] || 0,
            profit: (parseFloat(h.revenue) || 0) - (expenseMap[h.month] || 0)
        }));

        
        const revenues = historical.map(h => h.revenue);
        const n = revenues.length;

        if (n < 3) {
            return res.status(400).json({ error: 'Yeterli geçmiş veri yok (en az 3 ay gerekli).' });
        }

        
        const xMean = (n - 1) / 2;
        const yMean = revenues.reduce((a, b) => a + b, 0) / n;

        let numerator = 0;
        let denominator = 0;

        revenues.forEach((y, x) => {
            numerator += (x - xMean) * (y - yMean);
            denominator += (x - xMean) * (x - xMean);
        });

        const slope = denominator !== 0 ? numerator / denominator : 0;
        const intercept = yMean - slope * xMean;

        
        const monthlyAverages = {};
        historical.forEach(h => {
            const monthNum = parseInt(h.month.split('-')[1]);
            if (!monthlyAverages[monthNum]) {
                monthlyAverages[monthNum] = { total: 0, count: 0 };
            }
            monthlyAverages[monthNum].total += h.revenue;
            monthlyAverages[monthNum].count++;
        });

        const overallAvg = yMean;
        const seasonalFactors = {};
        for (let m = 1; m <= 12; m++) {
            if (monthlyAverages[m] && monthlyAverages[m].count > 0) {
                const monthAvg = monthlyAverages[m].total / monthlyAverages[m].count;
                seasonalFactors[m] = monthAvg / overallAvg;
            } else {
                seasonalFactors[m] = 1;
            }
        }

        
        const totalRevenue = historical.reduce((a, b) => a + b.revenue, 0);
        const totalExpenses = historical.reduce((a, b) => a + b.expenses, 0);
        const expenseRatio = totalRevenue > 0 ? totalExpenses / totalRevenue : 0.8;

        
        const forecast = [];
        const lastDate = new Date(historical[historical.length - 1].month + '-01');

        for (let i = 1; i <= forecastMonths; i++) {
            const forecastDate = new Date(lastDate);
            forecastDate.setMonth(forecastDate.getMonth() + i);

            const monthStr = forecastDate.toISOString().substring(0, 7);
            const monthNum = forecastDate.getMonth() + 1;

            
            const trendValue = intercept + slope * (n + i - 1);

            
            const seasonalFactor = seasonalFactors[monthNum] || 1;
            const forecastRevenue = Math.max(0, trendValue * seasonalFactor);

            
            const forecastExpenses = forecastRevenue * expenseRatio;
            const forecastProfit = forecastRevenue - forecastExpenses;

            
            const stdDev = Math.sqrt(revenues.reduce((sum, r) => sum + Math.pow(r - yMean, 2), 0) / n);
            const confidenceMargin = stdDev * (1 + i * 0.1);

            forecast.push({
                month: monthStr,
                revenue: Math.round(forecastRevenue),
                expenses: Math.round(forecastExpenses),
                profit: Math.round(forecastProfit),
                confidenceLow: Math.round(Math.max(0, forecastRevenue - confidenceMargin)),
                confidenceHigh: Math.round(forecastRevenue + confidenceMargin),
                isOptimistic: forecastProfit > 0
            });
        }

       
        const forecastTotalRevenue = forecast.reduce((a, b) => a + b.revenue, 0);
        const forecastTotalProfit = forecast.reduce((a, b) => a + b.profit, 0);
        const profitableMonths = forecast.filter(f => f.profit > 0).length;

        
        const trendDirection = slope > 0 ? 'up' : slope < 0 ? 'down' : 'stable';
        const trendPercent = yMean > 0 ? ((slope * 12) / yMean * 100).toFixed(1) : 0;

        
        const insights = [];

        if (slope > 0) {
            insights.push({
                type: 'positive',
                message: `Yıllık büyüme trendi: %${Math.abs(trendPercent)}`
            });
        } else if (slope < 0) {
            insights.push({
                type: 'warning',
                message: `Yıllık düşüş trendi: %${Math.abs(trendPercent)}`
            });
        }

        if (profitableMonths === forecastMonths) {
            insights.push({
                type: 'success',
                message: `Önümüzdeki ${forecastMonths} ay boyunca kârlı olması bekleniyor.`
            });
        } else if (profitableMonths === 0) {
            insights.push({
                type: 'danger',
                message: `Önümüzdeki ${forecastMonths} ayda zarar bekleniyor.`
            });
        } else {
            insights.push({
                type: 'info',
                message: `${forecastMonths} aylık dönemde ${profitableMonths} ay kârlı, ${forecastMonths - profitableMonths} ay zararlı bekleniyor.`
            });
        }

        
        const peakMonth = Object.entries(seasonalFactors).reduce((a, b) =>
            parseFloat(b[1]) > parseFloat(a[1]) ? b : a
        );
        const lowMonth = Object.entries(seasonalFactors).reduce((a, b) =>
            parseFloat(b[1]) < parseFloat(a[1]) ? b : a
        );

        const monthNames = ['', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

        insights.push({
            type: 'info',
            message: `En yüksek satış dönemi: ${monthNames[parseInt(peakMonth[0])]}, En düşük: ${monthNames[parseInt(lowMonth[0])]}`
        });

        res.json({
            branch,
            historical: historical.slice(-12), 
            forecast,
            summary: {
                forecastMonths,
                totalForecastRevenue: forecastTotalRevenue,
                totalForecastProfit: forecastTotalProfit,
                profitableMonths,
                trendDirection,
                trendPercent: parseFloat(trendPercent),
                expenseRatio: (expenseRatio * 100).toFixed(1)
            },
            seasonalFactors,
            insights
        });

    } catch (error) {
        console.error('Forecast error:', error);
        res.status(500).json({ error: 'Tahminleme yapılamadı: ' + error.message });
    }
});


router.get('/compare', authenticate, async (req, res) => {
    try {
        const [branches] = await db.execute(`
            SELECT 
                b.id,
                b.name,
                b.district,
                COALESCE(SUM(s.revenue), 0) as yearly_revenue,
                COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.branch_id = b.id AND YEAR(e.date) = YEAR(CURDATE())), 0) as yearly_expenses
            FROM branches b
            LEFT JOIN sales s ON b.id = s.branch_id AND YEAR(s.date) = YEAR(CURDATE())
            WHERE b.status = 'Active'
            GROUP BY b.id
            ORDER BY yearly_revenue DESC
        `);

        
        const comparisons = await Promise.all(branches.map(async (branch) => {
            const [lastYear] = await db.execute(`
                SELECT COALESCE(SUM(revenue), 0) as revenue
                FROM sales
                WHERE branch_id = ? AND YEAR(date) = YEAR(CURDATE()) - 1
            `, [branch.id]);

            const lastYearRevenue = parseFloat(lastYear[0]?.revenue) || 0;
            const currentRevenue = parseFloat(branch.yearly_revenue) || 0;

            let growthRate = 0;
            if (lastYearRevenue > 0) {
                growthRate = ((currentRevenue - lastYearRevenue) / lastYearRevenue * 100);
            }

            
            const projectedRevenue = currentRevenue * (1 + growthRate / 100);
            const projectedExpenses = parseFloat(branch.yearly_expenses) * 1.03; // 3% expense increase
            const projectedProfit = projectedRevenue - projectedExpenses;

            return {
                id: branch.id,
                name: branch.name,
                district: branch.district,
                currentRevenue: Math.round(currentRevenue),
                currentProfit: Math.round(currentRevenue - parseFloat(branch.yearly_expenses)),
                growthRate: growthRate.toFixed(1),
                projectedRevenue: Math.round(projectedRevenue),
                projectedProfit: Math.round(projectedProfit),
                outlook: projectedProfit > 0 ? 'positive' : 'negative'
            };
        }));

        res.json({ comparisons });

    } catch (error) {
        console.error('Forecast compare error:', error);
        res.status(500).json({ error: 'Karşılaştırma yapılamadı.' });
    }
});

module.exports = router;
