const db = require('../config/database');

/**
 * Analytics Service
 * Contains all business logic for analytics calculations
 */

/**
 * Get dashboard KPIs
 */
async function getKPIs(year, filters = {}) {
    const { district, branch_id, category } = filters;

    // Build dynamic WHERE clause
    let whereClause = 'YEAR(s.date) = ?';
    let expenseWhere = 'YEAR(e.date) = ?';
    const params = [year];
    const expenseParams = [year];

    if (district) {
        whereClause += ' AND b.district = ?';
        expenseWhere += ' AND b.district = ?';
        params.push(district);
        expenseParams.push(district);
    }

    if (branch_id) {
        whereClause += ' AND b.id = ?';
        expenseWhere += ' AND b.id = ?';
        params.push(branch_id);
        expenseParams.push(branch_id);
    }

    if (category) {
        whereClause += ' AND s.category = ?';
        params.push(category);
    }

    // Total Revenue
    const [revenueResult] = await db.execute(
        `SELECT COALESCE(SUM(s.revenue), 0) as total_revenue,
            COALESCE(SUM(s.quantity), 0) as total_quantity
     FROM sales s
     JOIN branches b ON s.branch_id = b.id
     WHERE ${whereClause}`,
        params
    );

    // Total Expenses
    const [expenseResult] = await db.execute(
        `SELECT COALESCE(SUM(e.amount), 0) as total_expenses
     FROM expenses e
     JOIN branches b ON e.branch_id = b.id
     WHERE ${expenseWhere}`,
        expenseParams
    );

    const totalRevenue = parseFloat(revenueResult[0].total_revenue) || 0;
    const totalExpenses = parseFloat(expenseResult[0].total_expenses) || 0;
    const netProfit = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0;

    // Best and Worst performing branches
    const [branchPerformance] = await db.execute(
        `SELECT 
      b.id,
      b.name,
      COALESCE(SUM(s.revenue), 0) as revenue,
      COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.branch_id = b.id AND YEAR(e.date) = ?), 0) as expenses,
      COALESCE(SUM(s.revenue), 0) - COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.branch_id = b.id AND YEAR(e.date) = ?), 0) as profit
     FROM branches b
     LEFT JOIN sales s ON b.id = s.branch_id AND YEAR(s.date) = ?
     WHERE b.status = 'Active'
     GROUP BY b.id, b.name
     ORDER BY profit DESC`,
        [year, year, year]
    );

    const bestBranch = branchPerformance[0] || null;
    const worstBranch = branchPerformance[branchPerformance.length - 1] || null;

    // Count profitable vs loss-making
    const profitableBranches = branchPerformance.filter(b => parseFloat(b.profit) > 0).length;
    const lossMakingBranches = branchPerformance.filter(b => parseFloat(b.profit) <= 0).length;

    // Previous year comparison
    const [prevYearRevenue] = await db.execute(
        `SELECT COALESCE(SUM(s.revenue), 0) as total
     FROM sales s
     JOIN branches b ON s.branch_id = b.id
     WHERE YEAR(s.date) = ?`,
        [year - 1]
    );

    const prevRevenue = parseFloat(prevYearRevenue[0].total) || 0;
    const yoyChange = prevRevenue > 0 ? (((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(2) : null;

    return {
        totalRevenue,
        totalExpenses,
        netProfit,
        margin: parseFloat(margin),
        totalQuantity: revenueResult[0].total_quantity,
        bestBranch: bestBranch ? {
            id: bestBranch.id,
            name: bestBranch.name,
            profit: parseFloat(bestBranch.profit)
        } : null,
        worstBranch: worstBranch ? {
            id: worstBranch.id,
            name: worstBranch.name,
            profit: parseFloat(worstBranch.profit)
        } : null,
        profitableBranches,
        lossMakingBranches,
        yoyChange: yoyChange ? parseFloat(yoyChange) : null,
        insight: generateKPIInsight(totalRevenue, totalExpenses, netProfit, yoyChange, profitableBranches, lossMakingBranches)
    };
}

/**
 * Generate insight text for KPIs
 */
function generateKPIInsight(revenue, expenses, profit, yoyChange, profitable, lossmaking) {
    let insight = '';

    if (profit > 0) {
        insight = `Toplam ${profitable} şube kârlı çalışmakta. `;
    } else {
        insight = `Dikkat: Genel zarar durumu söz konusu. `;
    }

    if (yoyChange !== null) {
        if (yoyChange > 0) {
            insight += `Geçen yıla göre %${yoyChange} büyüme sağlandı. `;
        } else if (yoyChange < 0) {
            insight += `Geçen yıla göre %${Math.abs(yoyChange)} düşüş yaşandı. `;
        }
    }

    if (lossmaking > 0) {
        insight += `${lossmaking} şube zarar etmekte ve değerlendirme gerektirebilir.`;
    }

    return insight;
}

/**
 * Get monthly profit/loss trend
 */
async function getMonthlyTrend(year, filters = {}) {
    const { district, branch_id } = filters;

    let branchFilter = '';
    let params = [year];

    if (district) {
        branchFilter += ' AND b.district = ?';
        params.push(district);
    }

    if (branch_id) {
        branchFilter += ' AND b.id = ?';
        params.push(branch_id);
    }

    // Get monthly revenue
    const [salesResults] = await db.execute(
        `SELECT 
      MONTH(s.date) as month_num,
      SUM(s.revenue) as revenue
     FROM sales s
     JOIN branches b ON s.branch_id = b.id
     WHERE YEAR(s.date) = ? ${branchFilter}
     GROUP BY MONTH(s.date)
     ORDER BY month_num`,
        params
    );

    // Get monthly expenses
    let expenseParams = [year];
    if (district) expenseParams.push(district);
    if (branch_id) expenseParams.push(branch_id);

    const [expenseResults] = await db.execute(
        `SELECT 
      MONTH(e.date) as month_num,
      SUM(e.amount) as expenses
     FROM expenses e
     JOIN branches b ON e.branch_id = b.id
     WHERE YEAR(e.date) = ? ${branchFilter}
     GROUP BY MONTH(e.date)
     ORDER BY month_num`,
        expenseParams
    );

    // Merge sales and expenses by month
    const expenseMap = {};
    expenseResults.forEach(e => {
        expenseMap[e.month_num] = parseFloat(e.expenses) || 0;
    });

    // Calculate profit and add moving average
    const trend = salesResults.map((row, index, arr) => {
        const revenue = parseFloat(row.revenue) || 0;
        const expenses = expenseMap[row.month_num] || 0;
        const profit = revenue - expenses;

        // 3-month moving average
        let movingAvg = null;
        if (index >= 2) {
            const prev3Profits = [];
            for (let i = index - 2; i <= index; i++) {
                const r = parseFloat(arr[i].revenue) || 0;
                const e = expenseMap[arr[i].month_num] || 0;
                prev3Profits.push(r - e);
            }
            movingAvg = prev3Profits.reduce((a, b) => a + b, 0) / 3;
        }

        return {
            month: `${year}-${String(row.month_num).padStart(2, '0')}`,
            monthNum: row.month_num,
            revenue,
            expenses,
            profit,
            movingAverage: movingAvg ? parseFloat(movingAvg.toFixed(2)) : null
        };
    });

    return trend;
}

/**
 * Get revenue vs expense by branch
 */
async function getRevenueVsExpense(year, filters = {}) {
    const { district } = filters;

    let whereClause = 'b.status = \'Active\'';
    const params = [year, year];

    if (district) {
        whereClause += ' AND b.district = ?';
        params.push(district);
    }

    const [results] = await db.execute(
        `SELECT 
      b.id,
      b.name,
      COALESCE(SUM(s.revenue), 0) as revenue,
      COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.branch_id = b.id AND YEAR(e.date) = ?), 0) as expenses
     FROM branches b
     LEFT JOIN sales s ON b.id = s.branch_id AND YEAR(s.date) = ?
     WHERE ${whereClause}
     GROUP BY b.id, b.name
     ORDER BY revenue DESC`,
        params
    );

    return results.map(row => ({
        id: row.id,
        name: row.name,
        revenue: parseFloat(row.revenue) || 0,
        expenses: parseFloat(row.expenses) || 0,
        profit: (parseFloat(row.revenue) || 0) - (parseFloat(row.expenses) || 0)
    }));
}

/**
 * Get margin by branch
 */
async function getMarginByBranch(year, filters = {}) {
    const { district } = filters;

    let whereClause = 'b.status = \'Active\'';
    const params = [year, year];

    if (district) {
        whereClause += ' AND b.district = ?';
        params.push(district);
    }

    const [results] = await db.execute(
        `SELECT 
      b.id,
      b.name,
      b.district,
      COALESCE(SUM(s.revenue), 0) as revenue,
      COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.branch_id = b.id AND YEAR(e.date) = ?), 0) as expenses
     FROM branches b
     LEFT JOIN sales s ON b.id = s.branch_id AND YEAR(s.date) = ?
     WHERE ${whereClause}
     GROUP BY b.id, b.name, b.district
     ORDER BY revenue DESC`,
        params
    );

    return results.map(row => {
        const revenue = parseFloat(row.revenue) || 0;
        const expenses = parseFloat(row.expenses) || 0;
        const profit = revenue - expenses;
        const margin = revenue > 0 ? ((profit / revenue) * 100) : 0;

        return {
            id: row.id,
            name: row.name,
            district: row.district,
            revenue,
            expenses,
            profit,
            margin: parseFloat(margin.toFixed(2))
        };
    });
}

/**
 * Compare multiple branches
 */
async function compareBranches(branchIds, year) {
    const placeholders = branchIds.map(() => '?').join(',');

    // Get branch details
    const [branches] = await db.execute(
        `SELECT 
      b.id, b.name, b.district, b.latitude, b.longitude, b.opened_at
     FROM branches b
     WHERE b.id IN (${placeholders})`,
        branchIds
    );

    // Get yearly metrics for each branch
    const comparison = await Promise.all(branches.map(async (branch) => {
        // Revenue and quantity by category
        const [salesByCategory] = await db.execute(
            `SELECT category, SUM(revenue) as revenue, SUM(quantity) as quantity
       FROM sales WHERE branch_id = ? AND YEAR(date) = ?
       GROUP BY category`,
            [branch.id, year]
        );

        // Monthly trend
        const [monthlyData] = await db.execute(
            `SELECT DATE_FORMAT(date, '%Y-%m') as month, SUM(revenue) as revenue
       FROM sales WHERE branch_id = ? AND YEAR(date) = ?
       GROUP BY DATE_FORMAT(date, '%Y-%m')
       ORDER BY month`,
            [branch.id, year]
        );

        // Expenses by type
        const [expensesByType] = await db.execute(
            `SELECT expense_type, SUM(amount) as amount
       FROM expenses WHERE branch_id = ? AND YEAR(date) = ?
       GROUP BY expense_type`,
            [branch.id, year]
        );

        // Calculate totals
        const totalRevenue = salesByCategory.reduce((sum, c) => sum + parseFloat(c.revenue || 0), 0);
        const totalExpenses = expensesByType.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
        const fixedCosts = expensesByType
            .filter(e => ['Rent', 'Salary'].includes(e.expense_type))
            .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

        return {
            ...branch,
            totalRevenue,
            totalExpenses,
            profit: totalRevenue - totalExpenses,
            margin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100).toFixed(2) : 0,
            fixedCostRatio: totalExpenses > 0 ? ((fixedCosts / totalExpenses) * 100).toFixed(2) : 0,
            salesByCategory: salesByCategory.reduce((obj, c) => {
                obj[c.category] = { revenue: parseFloat(c.revenue), quantity: parseInt(c.quantity) };
                return obj;
            }, {}),
            expensesByType: expensesByType.reduce((obj, e) => {
                obj[e.expense_type] = parseFloat(e.amount);
                return obj;
            }, {}),
            monthlyTrend: monthlyData.map(m => ({ month: m.month, revenue: parseFloat(m.revenue) }))
        };
    }));

    // Generate explainable differences
    const explanations = generateComparisonExplanations(comparison);

    return {
        branches: comparison,
        explanations,
        insight: generateComparisonInsight(comparison)
    };
}

/**
 * Generate explanations for branch differences
 */
function generateComparisonExplanations(branches) {
    if (branches.length < 2) return [];

    const explanations = [];
    const sorted = [...branches].sort((a, b) => b.profit - a.profit);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    // Revenue difference
    const revenueDiff = best.totalRevenue - worst.totalRevenue;
    if (revenueDiff > 0) {
        explanations.push({
            type: 'revenue',
            title: 'Gelir Farkı',
            description: `${best.name} şubesi, ${worst.name} şubesinden ₺${revenueDiff.toLocaleString('tr-TR')} daha fazla gelir elde etmiş.`,
            impact: 'high'
        });
    }

    // Cost structure
    const bestFixedRatio = parseFloat(best.fixedCostRatio);
    const worstFixedRatio = parseFloat(worst.fixedCostRatio);
    if (Math.abs(bestFixedRatio - worstFixedRatio) > 5) {
        explanations.push({
            type: 'costs',
            title: 'Maliyet Yapısı',
            description: `${worst.name} şubesinin sabit maliyet oranı (%${worstFixedRatio}) ${best.name}'den (%${bestFixedRatio}) daha yüksek.`,
            impact: bestFixedRatio < worstFixedRatio ? 'medium' : 'low'
        });
    }

    // Category mix analysis
    const categories = ['Books', 'Stationery', 'Kids', 'Gifts', 'OnlineOrders'];
    categories.forEach(cat => {
        const bestCatRevenue = best.salesByCategory[cat]?.revenue || 0;
        const worstCatRevenue = worst.salesByCategory[cat]?.revenue || 0;
        const diff = bestCatRevenue - worstCatRevenue;

        if (diff > best.totalRevenue * 0.1) { // If category difference is more than 10% of best's total
            explanations.push({
                type: 'category',
                title: `${cat} Kategorisi`,
                description: `${best.name} "${cat}" kategorisinde ₺${diff.toLocaleString('tr-TR')} daha fazla satış yapmış.`,
                impact: 'medium'
            });
        }
    });

    return explanations;
}

/**
 * Generate comparison insight
 */
function generateComparisonInsight(branches) {
    const sorted = [...branches].sort((a, b) => b.profit - a.profit);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    let insight = `${best.name} en yüksek kârlılık (₺${best.profit.toLocaleString('tr-TR')}) ile liderliği elinde tutarken, `;
    insight += `${worst.name} en düşük performansı (%${worst.margin} marj) göstermektedir. `;

    const avgMargin = branches.reduce((sum, b) => sum + parseFloat(b.margin), 0) / branches.length;
    insight += `Ortalama marj oranı %${avgMargin.toFixed(1)} seviyesindedir.`;

    return insight;
}

/**
 * Get risk analysis for all branches
 */
async function getRiskAnalysis() {
    try {
        const [branches] = await db.execute(
            `SELECT id, name, district, status FROM branches WHERE status = 'Active'`
        );

        if (branches.length === 0) {
            return { branches: [], closureCandidates: [], insight: 'Aktif şube bulunamadı.' };
        }

        const riskResults = [];

        for (const branch of branches) {
            try {
                // Get total revenue for this branch
                const [salesData] = await db.execute(
                    `SELECT COALESCE(SUM(revenue), 0) as total_revenue, COALESCE(SUM(quantity), 0) as total_qty FROM sales WHERE branch_id = ?`,
                    [branch.id]
                );

                // Get total expenses for this branch
                const [expenseData] = await db.execute(
                    `SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses WHERE branch_id = ?`,
                    [branch.id]
                );

                // Get fixed costs (Rent + Salary)
                const [fixedCostData] = await db.execute(
                    `SELECT COALESCE(SUM(amount), 0) as fixed_costs FROM expenses WHERE branch_id = ? AND expense_type IN ('Rent', 'Salary')`,
                    [branch.id]
                );

                const totalRevenue = parseFloat(salesData[0].total_revenue) || 0;
                const totalQty = parseFloat(salesData[0].total_qty) || 1;
                const totalExpenses = parseFloat(expenseData[0].total_expenses) || 0;
                const fixedCosts = parseFloat(fixedCostData[0].fixed_costs) || 0;

                const profit = totalRevenue - totalExpenses;
                const avgBasket = totalRevenue / totalQty;
                const fixedCostRatio = totalExpenses > 0 ? (fixedCosts / totalExpenses * 100) : 0;

                // Calculate risk score based on profit margin
                let riskScore = 50; // Base score

                // If loss, increase risk
                if (profit < 0) {
                    riskScore += 30;
                }

                // High fixed cost ratio increases risk
                if (fixedCostRatio > 80) {
                    riskScore += 15;
                } else if (fixedCostRatio > 70) {
                    riskScore += 10;
                }

                // Low revenue per unit increases risk
                if (avgBasket < 20) {
                    riskScore += 10;
                }

                // Profitable branches get lower risk
                if (profit > 0) {
                    const margin = (profit / totalRevenue) * 100;
                    if (margin > 15) riskScore -= 30;
                    else if (margin > 10) riskScore -= 20;
                    else if (margin > 5) riskScore -= 10;
                }

                riskScore = Math.min(100, Math.max(0, Math.round(riskScore)));

                riskResults.push({
                    id: branch.id,
                    name: branch.name,
                    district: branch.district,
                    riskScore,
                    riskLevel: getRiskLevel(riskScore),
                    factors: {
                        lossStreak: profit < 0 ? 3 : 0,
                        revenueTrend: 0,
                        fixedCostRatio: parseFloat(fixedCostRatio.toFixed(2)),
                        avgBasket: parseFloat(avgBasket.toFixed(2))
                    },
                    explanation: profit < 0
                        ? `${branch.name} zarar ediyor. Toplam gelir: ${totalRevenue.toFixed(0)} TL, Gider: ${totalExpenses.toFixed(0)} TL`
                        : `${branch.name} kârlı durumda. Marj: ${((profit / totalRevenue) * 100).toFixed(1)}%`
                });
            } catch (branchError) {
                console.error(`Error processing branch ${branch.id}:`, branchError);
                // Continue with other branches
            }
        }

        // Sort by risk score descending
        riskResults.sort((a, b) => b.riskScore - a.riskScore);

        // Identify closure candidates (risk score > 70)
        const closureCandidates = riskResults.filter(r => r.riskScore > 70);

        return {
            branches: riskResults,
            closureCandidates,
            insight: generateRiskInsight(riskResults, closureCandidates)
        };
    } catch (error) {
        console.error('getRiskAnalysis error:', error);
        throw error;
    }
}

/**
 * Calculate risk factors from monthly P/L data
 */
function calculateRiskFactors(monthlyPL, branchId) {
    let lossStreak = 0;
    let maxLossStreak = 0;

    for (const month of monthlyPL) {
        const profit = parseFloat(month.revenue || 0) - parseFloat(month.expenses || 0);
        if (profit < 0) {
            lossStreak++;
            maxLossStreak = Math.max(maxLossStreak, lossStreak);
        } else {
            lossStreak = 0;
        }
    }

    return {
        lossStreak: maxLossStreak,
        lossMonths: monthlyPL.filter(m => parseFloat(m.revenue || 0) - parseFloat(m.expenses || 0) < 0).length
    };
}

/**
 * Calculate composite risk score (0-100)
 */
function calculateRiskScore(factors, revenueTrend, fixedCostRatio, avgBasket) {
    // Weights
    const weights = {
        lossStreak: 30,      // Max 30 points for loss streak
        revenueTrend: 25,    // Max 25 points for declining revenue
        fixedCost: 25,       // Max 25 points for high fixed costs
        basket: 20           // Max 20 points for low basket size
    };

    let score = 0;

    // Loss streak factor (0-6 months = 0-30 points)
    score += Math.min(weights.lossStreak, factors.lossStreak * 5);

    // Revenue trend (negative = bad)
    if (revenueTrend < 0) {
        score += Math.min(weights.revenueTrend, Math.abs(revenueTrend) / 2);
    }

    // Fixed cost ratio (>70% is concerning)
    if (fixedCostRatio > 60) {
        score += Math.min(weights.fixedCost, (fixedCostRatio - 60) / 2);
    }

    // Basket size (lower than 25 is concerning)
    if (avgBasket < 30) {
        score += Math.min(weights.basket, (30 - avgBasket) * 2);
    }

    return Math.round(score);
}

/**
 * Get risk level from score
 */
function getRiskLevel(score) {
    if (score >= 70) return 'Yüksek';
    if (score >= 40) return 'Orta';
    return 'Düşük';
}

/**
 * Generate risk explanation text
 */
function generateRiskExplanation(branchName, score, factors, trend, fixedRatio) {
    let explanation = `${branchName} şubesi `;

    if (score >= 70) {
        explanation += 'yüksek risk grubunda yer almaktadır. ';
    } else if (score >= 40) {
        explanation += 'orta düzeyde risk taşımaktadır. ';
    } else {
        explanation += 'düşük risk grubundadır. ';
    }

    const reasons = [];

    if (factors.lossStreak >= 3) {
        reasons.push(`son ${factors.lossStreak} aydır zarar etmesi`);
    }

    if (trend < -10) {
        reasons.push(`gelirlerin %${Math.abs(trend).toFixed(0)} oranında düşmesi`);
    }

    if (fixedRatio > 70) {
        reasons.push(`sabit maliyet oranının %${fixedRatio.toFixed(0)} ile yüksek olması`);
    }

    if (reasons.length > 0) {
        explanation += `Başlıca faktörler: ${reasons.join(', ')}.`;
    }

    return explanation;
}

/**
 * Generate overall risk insight
 */
function generateRiskInsight(allBranches, closureCandidates) {
    let insight = '';

    if (closureCandidates.length === 0) {
        insight = 'Tüm şubeler kabul edilebilir risk seviyelerinde faaliyet göstermektedir. ';
    } else if (closureCandidates.length === 1) {
        insight = `${closureCandidates[0].name} şubesi kapatma riski taşımakta ve acil değerlendirme gerektirmektedir. `;
    } else {
        insight = `${closureCandidates.length} şube yüksek risk grubundadır: ${closureCandidates.map(c => c.name).join(', ')}. `;
    }

    const avgRisk = allBranches.reduce((sum, b) => sum + b.riskScore, 0) / allBranches.length;
    insight += `Ortalama risk skoru: ${avgRisk.toFixed(0)}/100.`;

    return insight;
}

/**
 * Get investment opportunity analysis by district
 */
async function getOpportunityAnalysis() {
    const [districts] = await db.execute(
        `SELECT * FROM population_districts ORDER BY density DESC`
    );

    const opportunities = await Promise.all(districts.map(async (district) => {
        // Branch count in district
        const [branchCount] = await db.execute(
            `SELECT COUNT(*) as count FROM branches WHERE district = ? AND status = 'Active'`,
            [district.district]
        );

        // Average performance of branches in district
        const [branchPerformance] = await db.execute(
            `SELECT 
        AVG(profit) as avg_profit,
        AVG(margin) as avg_margin
       FROM (
         SELECT 
           b.id,
           SUM(s.revenue) - COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.branch_id = b.id AND YEAR(e.date) = YEAR(CURDATE())), 0) as profit,
           CASE WHEN SUM(s.revenue) > 0 
             THEN (SUM(s.revenue) - COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.branch_id = b.id AND YEAR(e.date) = YEAR(CURDATE())), 0)) / SUM(s.revenue) * 100
             ELSE 0 
           END as margin
         FROM branches b
         LEFT JOIN sales s ON b.id = s.branch_id AND YEAR(s.date) = YEAR(CURDATE())
         WHERE b.district = ? AND b.status = 'Active'
         GROUP BY b.id
       ) as branch_metrics`,
            [district.district]
        );

        const count = branchCount[0].count;
        const population = district.population;
        const density = parseFloat(district.density);
        const populationPerBranch = count > 0 ? Math.round(population / count) : population;
        const avgProfit = parseFloat(branchPerformance[0].avg_profit) || 0;

        // Calculate opportunity score
        const score = calculateOpportunityScore(density, count, population, avgProfit);

        return {
            district: district.district,
            population,
            density,
            area_km2: parseFloat(district.area_km2) || 0,
            branchCount: count,
            populationPerBranch,
            avgBranchProfit: avgProfit,
            opportunityScore: score,
            opportunityLevel: getOpportunityLevel(score),
            latitude: parseFloat(district.latitude),
            longitude: parseFloat(district.longitude),
            recommendation: generateOpportunityRecommendation(district.district, score, count, density, avgProfit)
        };
    }));

    // Sort by opportunity score
    opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);

    // Top 3 opportunities
    const topOpportunities = opportunities.slice(0, 3);

    return {
        districts: opportunities,
        topOpportunities,
        insight: generateOpportunityInsight(opportunities, topOpportunities)
    };
}

/**
 * Calculate opportunity score (0-100)
 */
function calculateOpportunityScore(density, branchCount, population, avgProfit) {
    let score = 0;

    // Density factor (max 30 points)
    // Higher density = more foot traffic potential
    score += Math.min(30, density / 400);

    // Coverage gap factor (max 40 points)
    // Fewer branches relative to population = more opportunity
    if (branchCount === 0) {
        score += 40;
    } else if (branchCount === 1 && population > 100000) {
        score += 30;
    } else if (branchCount === 1) {
        score += 20;
    } else if (population / branchCount > 150000) {
        score += 15;
    } else {
        score += 5;
    }

    // Performance factor (max 30 points)
    // If existing branches are profitable, new ones might be too
    if (avgProfit > 100000) {
        score += 30;
    } else if (avgProfit > 50000) {
        score += 20;
    } else if (avgProfit > 0) {
        score += 10;
    } else if (branchCount === 0) {
        score += 15; // Unknown, moderate score
    }

    return Math.min(100, Math.round(score));
}

/**
 * Get opportunity level from score
 */
function getOpportunityLevel(score) {
    if (score >= 70) return 'Yüksek';
    if (score >= 40) return 'Orta';
    return 'Düşük';
}

/**
 * Generate opportunity recommendation
 */
function generateOpportunityRecommendation(district, score, count, density, profit) {
    if (score >= 70) {
        if (count === 0) {
            return `${district}'da hiç şube bulunmuyor. Yüksek nüfus yoğunluğu (${density.toFixed(0)}/km²) göz önünde bulundurularak yeni şube açılması önerilir.`;
        }
        return `${district}'da mevcut ${count} şubenin başarılı performansı, ek şube potansiyelini göstermektedir.`;
    }
    if (score >= 40) {
        return `${district}'da pazar araştırması yapılması ve rakip analizi önerilir.`;
    }
    return `${district}'da mevcut kapsama yeterli görülmektedir. Mevcut şubelerin performans iyileştirmesine odaklanılabilir.`;
}

/**
 * Generate overall opportunity insight
 */
function generateOpportunityInsight(all, top) {
    let insight = `İzmir genelinde ${all.filter(d => d.opportunityScore >= 70).length} ilçe yüksek yatırım potansiyeli taşımaktadır. `;

    if (top.length > 0) {
        insight += `En yüksek fırsat skoru: ${top[0].district} (%${top[0].opportunityScore}). `;
    }

    const nobranchDistricts = all.filter(d => d.branchCount === 0 && d.population > 50000);
    if (nobranchDistricts.length > 0) {
        insight += `${nobranchDistricts.map(d => d.district).join(', ')} ilçelerinde şube bulunmamaktadır ve değerlendirilmesi önerilir.`;
    }

    return insight;
}

/**
 * Get category breakdown
 */
async function getCategoryBreakdown(year, filters = {}) {
    const { branch_id } = filters;

    let whereClause = 'YEAR(s.date) = ?';
    const params = [year];

    if (branch_id) {
        whereClause += ' AND s.branch_id = ?';
        params.push(branch_id);
    }

    const [results] = await db.execute(
        `SELECT 
      s.category,
      SUM(s.revenue) as revenue,
      SUM(s.quantity) as quantity,
      COUNT(DISTINCT s.branch_id) as branch_count
     FROM sales s
     WHERE ${whereClause}
     GROUP BY s.category
     ORDER BY revenue DESC`,
        params
    );

    const total = results.reduce((sum, r) => sum + parseFloat(r.revenue || 0), 0);

    return results.map(r => ({
        category: r.category,
        revenue: parseFloat(r.revenue) || 0,
        quantity: parseInt(r.quantity) || 0,
        percentage: total > 0 ? parseFloat(((parseFloat(r.revenue) / total) * 100).toFixed(2)) : 0,
        avgPerBranch: r.branch_count > 0 ? parseFloat((parseFloat(r.revenue) / r.branch_count).toFixed(2)) : 0
    }));
}

module.exports = {
    getKPIs,
    getMonthlyTrend,
    getRevenueVsExpense,
    getMarginByBranch,
    compareBranches,
    getRiskAnalysis,
    getOpportunityAnalysis,
    getCategoryBreakdown
};
