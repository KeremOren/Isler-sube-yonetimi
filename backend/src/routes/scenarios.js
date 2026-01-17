const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();


router.post('/simulate', authenticate, async (req, res) => {
    try {
        const {
            branch_id,
            rent_change_percent = 0,
            salary_change_percent = 0,
            revenue_change_percent = 0,
            staff_change = 0,
            utility_change_percent = 0,
            months_to_simulate = 12
        } = req.body;

        if (!branch_id) {
            return res.status(400).json({ error: 'Şube seçimi zorunludur.' });
        }


        const [branchData] = await db.execute(`
            SELECT b.*, 
                   COALESCE(SUM(s.revenue), 0) as yearly_revenue,
                   COALESCE(SUM(s.quantity), 0) as yearly_quantity
            FROM branches b
            LEFT JOIN sales s ON b.id = s.branch_id AND YEAR(s.date) = 2024
            WHERE b.id = ?
            GROUP BY b.id
        `, [branch_id]);

        if (branchData.length === 0) {
            return res.status(404).json({ error: 'Şube bulunamadı.' });
        }

        const branch = branchData[0];


        const [expenses] = await db.execute(`
            SELECT 
                expense_type,
                SUM(amount) as total_amount
            FROM expenses
            WHERE branch_id = ? AND YEAR(date) = 2024
            GROUP BY expense_type
        `, [branch_id]);


        const expenseMap = {};
        let totalCurrentExpenses = 0;
        expenses.forEach(e => {
            expenseMap[e.expense_type] = parseFloat(e.total_amount) || 0;
            totalCurrentExpenses += expenseMap[e.expense_type];
        });

        const currentRent = expenseMap['Rent'] || 0;
        const currentSalary = expenseMap['Salary'] || 0;
        const currentUtilities = expenseMap['Utilities'] || 0;
        const currentOther = (expenseMap['Marketing'] || 0) + (expenseMap['Inventory'] || 0) + (expenseMap['Maintenance'] || 0) + (expenseMap['Other'] || 0);

        const currentRevenue = parseFloat(branch.yearly_revenue) || 0;
        const currentProfit = currentRevenue - totalCurrentExpenses;


        const simulatedRent = currentRent * (1 + rent_change_percent / 100);
        const simulatedSalary = currentSalary * (1 + salary_change_percent / 100);
        const simulatedUtilities = currentUtilities * (1 + utility_change_percent / 100);
        const simulatedRevenue = currentRevenue * (1 + revenue_change_percent / 100);


        const avgSalaryPerPerson = currentSalary / 3;
        const staffSalaryImpact = staff_change * avgSalaryPerPerson;
        const finalSalary = simulatedSalary + staffSalaryImpact;

        const simulatedTotalExpenses = simulatedRent + finalSalary + simulatedUtilities + currentOther;
        const simulatedProfit = simulatedRevenue - simulatedTotalExpenses;


        const monthlyProjection = [];
        let cumulativeProfit = 0;
        const monthlyRevenue = simulatedRevenue / 12;
        const monthlyExpense = simulatedTotalExpenses / 12;
        const monthlyProfit = monthlyRevenue - monthlyExpense;

        for (let i = 1; i <= months_to_simulate; i++) {
            cumulativeProfit += monthlyProfit;
            monthlyProjection.push({
                month: i,
                revenue: Math.round(monthlyRevenue),
                expense: Math.round(monthlyExpense),
                profit: Math.round(monthlyProfit),
                cumulativeProfit: Math.round(cumulativeProfit)
            });
        }


        const profitChange = simulatedProfit - currentProfit;
        const profitChangePercent = currentProfit !== 0 ? (profitChange / Math.abs(currentProfit)) * 100 : 0;
        const breakEvenMonths = monthlyProfit > 0 ? null : (monthlyProfit < 0 ? 'Never' : 0);
        const isNowProfitable = simulatedProfit > 0 && currentProfit <= 0;
        const isNowLosing = simulatedProfit <= 0 && currentProfit > 0;


        const insights = [];

        if (profitChange > 0) {
            insights.push({
                type: 'positive',
                message: `Bu senaryo ile yıllık kâr ${formatCurrency(profitChange)} artacak.`
            });
        } else if (profitChange < 0) {
            insights.push({
                type: 'negative',
                message: `Bu senaryo ile yıllık kâr ${formatCurrency(Math.abs(profitChange))} azalacak.`
            });
        }

        if (isNowProfitable) {
            insights.push({
                type: 'success',
                message: '🎉 Şube bu senaryo ile zararlı durumdan kârlı duruma geçecek!'
            });
        }

        if (isNowLosing) {
            insights.push({
                type: 'warning',
                message: '⚠️ Dikkat: Bu senaryo ile şube zarar etmeye başlayacak!'
            });
        }

        if (rent_change_percent < 0) {
            const rentSaving = currentRent * Math.abs(rent_change_percent) / 100;
            insights.push({
                type: 'info',
                message: `Kira indirimi ile yıllık ${formatCurrency(rentSaving)} tasarruf sağlanacak.`
            });
        }

        if (staff_change < 0) {
            insights.push({
                type: 'info',
                message: `${Math.abs(staff_change)} personel azaltımı ile maaş giderlerinde düşüş sağlanacak.`
            });
        }

        res.json({
            branch: {
                id: branch.id,
                name: branch.name,
                district: branch.district
            },
            current: {
                revenue: Math.round(currentRevenue),
                expenses: Math.round(totalCurrentExpenses),
                profit: Math.round(currentProfit),
                margin: currentRevenue > 0 ? ((currentProfit / currentRevenue) * 100).toFixed(1) : 0,
                breakdown: {
                    rent: Math.round(currentRent),
                    salary: Math.round(currentSalary),
                    utilities: Math.round(currentUtilities),
                    other: Math.round(currentOther)
                }
            },
            simulated: {
                revenue: Math.round(simulatedRevenue),
                expenses: Math.round(simulatedTotalExpenses),
                profit: Math.round(simulatedProfit),
                margin: simulatedRevenue > 0 ? ((simulatedProfit / simulatedRevenue) * 100).toFixed(1) : 0,
                breakdown: {
                    rent: Math.round(simulatedRent),
                    salary: Math.round(finalSalary),
                    utilities: Math.round(simulatedUtilities),
                    other: Math.round(currentOther)
                }
            },
            comparison: {
                profitChange: Math.round(profitChange),
                profitChangePercent: profitChangePercent.toFixed(1),
                revenueChange: Math.round(simulatedRevenue - currentRevenue),
                expenseChange: Math.round(simulatedTotalExpenses - totalCurrentExpenses),
                isNowProfitable,
                isNowLosing
            },
            projection: monthlyProjection,
            insights
        });

    } catch (error) {
        console.error('Scenario simulation error:', error);
        res.status(500).json({ error: 'Senaryo simülasyonu yapılamadı.' });
    }
});


router.get('/presets', authenticate, (req, res) => {
    const presets = [
        {
            id: 'rent_negotiation',
            name: 'Kira İndirimi Görüşmesi',
            description: 'Kira %20 düşürülürse',
            icon: '🏠',
            params: { rent_change_percent: -20 }
        },
        {
            id: 'staff_optimization',
            name: 'Personel Optimizasyonu',
            description: '1 personel azaltımı',
            icon: '👥',
            params: { staff_change: -1 }
        },
        {
            id: 'growth_scenario',
            name: 'Büyüme Senaryosu',
            description: 'Satışlar %25 artarsa',
            icon: '📈',
            params: { revenue_change_percent: 25 }
        },
        {
            id: 'cost_cutting',
            name: 'Maliyet Düşürme',
            description: 'Tüm giderler %15 azaltılırsa',
            icon: '✂️',
            params: { rent_change_percent: -15, salary_change_percent: -15, utility_change_percent: -15 }
        },
        {
            id: 'worst_case',
            name: 'En Kötü Senaryo',
            description: 'Satışlar %30 düşerse',
            icon: '📉',
            params: { revenue_change_percent: -30 }
        },
        {
            id: 'best_case',
            name: 'En İyi Senaryo',
            description: 'Satışlar artarken giderler düşerse',
            icon: '🌟',
            params: { revenue_change_percent: 20, rent_change_percent: -10 }
        }
    ];

    res.json({ presets });
});


function formatCurrency(value) {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

module.exports = router;
