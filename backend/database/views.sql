

USE isler_kitabevi;


DROP VIEW IF EXISTS monthly_pnl_per_branch;
CREATE VIEW monthly_pnl_per_branch AS
SELECT 
    b.id AS branch_id,
    b.name AS branch_name,
    b.district,
    DATE_FORMAT(s.date, '%Y-%m') AS month,
    YEAR(s.date) AS year,
    MONTH(s.date) AS month_num,
    COALESCE(SUM(s.revenue), 0) AS total_revenue,
    COALESCE((
        SELECT SUM(e.amount) 
        FROM expenses e 
        WHERE e.branch_id = b.id 
        AND DATE_FORMAT(e.date, '%Y-%m') = DATE_FORMAT(s.date, '%Y-%m')
    ), 0) AS total_expenses,
    COALESCE(SUM(s.revenue), 0) - COALESCE((
        SELECT SUM(e.amount) 
        FROM expenses e 
        WHERE e.branch_id = b.id 
        AND DATE_FORMAT(e.date, '%Y-%m') = DATE_FORMAT(s.date, '%Y-%m')
    ), 0) AS profit_loss,
    CASE 
        WHEN COALESCE(SUM(s.revenue), 0) = 0 THEN 0
        ELSE ROUND(
            (COALESCE(SUM(s.revenue), 0) - COALESCE((
                SELECT SUM(e.amount) 
                FROM expenses e 
                WHERE e.branch_id = b.id 
                AND DATE_FORMAT(e.date, '%Y-%m') = DATE_FORMAT(s.date, '%Y-%m')
            ), 0)) / COALESCE(SUM(s.revenue), 0) * 100, 2
        )
    END AS margin_percent
FROM branches b
LEFT JOIN sales s ON b.id = s.branch_id
GROUP BY b.id, b.name, b.district, DATE_FORMAT(s.date, '%Y-%m'), YEAR(s.date), MONTH(s.date)
ORDER BY b.id, month;


DROP VIEW IF EXISTS yearly_branch_summary;
CREATE VIEW yearly_branch_summary AS
SELECT 
    b.id AS branch_id,
    b.name AS branch_name,
    b.district,
    YEAR(s.date) AS year,
    COALESCE(SUM(s.revenue), 0) AS total_revenue,
    COALESCE(SUM(s.quantity), 0) AS total_quantity,
    COALESCE((
        SELECT SUM(e.amount) 
        FROM expenses e 
        WHERE e.branch_id = b.id 
        AND YEAR(e.date) = YEAR(s.date)
    ), 0) AS total_expenses,
    COALESCE(SUM(s.revenue), 0) - COALESCE((
        SELECT SUM(e.amount) 
        FROM expenses e 
        WHERE e.branch_id = b.id 
        AND YEAR(e.date) = YEAR(s.date)
    ), 0) AS profit_loss,
    CASE 
        WHEN COALESCE(SUM(s.revenue), 0) = 0 THEN 0
        ELSE ROUND(
            (COALESCE(SUM(s.revenue), 0) - COALESCE((
                SELECT SUM(e.amount) 
                FROM expenses e 
                WHERE e.branch_id = b.id 
                AND YEAR(e.date) = YEAR(s.date)
            ), 0)) / COALESCE(SUM(s.revenue), 0) * 100, 2
        )
    END AS margin_percent,
    COUNT(DISTINCT DATE_FORMAT(s.date, '%Y-%m')) AS months_active
FROM branches b
LEFT JOIN sales s ON b.id = s.branch_id
GROUP BY b.id, b.name, b.district, YEAR(s.date)
ORDER BY year DESC, profit_loss DESC;


DROP VIEW IF EXISTS margin_analysis;
CREATE VIEW margin_analysis AS
SELECT 
    b.id AS branch_id,
    b.name AS branch_name,
    s.category,
    YEAR(s.date) AS year,
    SUM(s.revenue) AS category_revenue,
    SUM(s.quantity) AS category_quantity,
    CASE 
        WHEN SUM(s.quantity) = 0 THEN 0
        ELSE ROUND(SUM(s.revenue) / SUM(s.quantity), 2)
    END AS avg_basket_size,
    ROUND(
        SUM(s.revenue) / (
            SELECT SUM(s2.revenue) 
            FROM sales s2 
            WHERE s2.branch_id = b.id 
            AND YEAR(s2.date) = YEAR(s.date)
        ) * 100, 2
    ) AS category_share_percent
FROM branches b
JOIN sales s ON b.id = s.branch_id
GROUP BY b.id, b.name, s.category, YEAR(s.date)
ORDER BY b.id, year, category_revenue DESC;


DROP VIEW IF EXISTS risk_indicators;
CREATE VIEW risk_indicators AS
SELECT 
    b.id AS branch_id,
    b.name AS branch_name,
    b.district,
    b.status,
    
    
    (
        SELECT COUNT(*) 
        FROM (
            SELECT DATE_FORMAT(s2.date, '%Y-%m') AS m,
                   SUM(s2.revenue) AS rev,
                   COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.branch_id = b.id AND DATE_FORMAT(e.date, '%Y-%m') = DATE_FORMAT(s2.date, '%Y-%m')), 0) AS exp
            FROM sales s2 
            WHERE s2.branch_id = b.id 
            AND s2.date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(s2.date, '%Y-%m')
            HAVING rev < exp
        ) AS loss_months
    ) AS loss_month_count,
    
    
    ROUND((
        SELECT AVG(daily_rev)
        FROM (
            SELECT DATE(s3.date) AS d, SUM(s3.revenue) AS daily_rev
            FROM sales s3 
            WHERE s3.branch_id = b.id 
            AND s3.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
            GROUP BY DATE(s3.date)
        ) AS recent
    ) / NULLIF((
        SELECT AVG(daily_rev)
        FROM (
            SELECT DATE(s4.date) AS d, SUM(s4.revenue) AS daily_rev
            FROM sales s4 
            WHERE s4.branch_id = b.id 
            AND s4.date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            AND s4.date < DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
            GROUP BY DATE(s4.date)
        ) AS older
    ), 0) * 100 - 100, 2) AS revenue_trend_percent,
    
    
    ROUND((
        SELECT SUM(e.amount) 
        FROM expenses e 
        WHERE e.branch_id = b.id 
        AND e.expense_type IN ('Rent', 'Salary')
        AND e.date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    ) / NULLIF((
        SELECT SUM(e2.amount) 
        FROM expenses e2 
        WHERE e2.branch_id = b.id
        AND e2.date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    ), 0) * 100, 2) AS fixed_cost_ratio,
    
    
    ROUND((
        SELECT SUM(s5.revenue) / NULLIF(SUM(s5.quantity), 0)
        FROM sales s5 
        WHERE s5.branch_id = b.id
        AND s5.date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    ), 2) AS avg_basket_size

FROM branches b
WHERE b.status = 'Active'
GROUP BY b.id, b.name, b.district, b.status;


DROP VIEW IF EXISTS opportunity_score_by_district;
CREATE VIEW opportunity_score_by_district AS
SELECT 
    pd.district,
    pd.population,
    pd.density,
    pd.area_km2,
    
    
    (SELECT COUNT(*) FROM branches b WHERE b.district = pd.district AND b.status = 'Active') AS branch_count,
    
    
    CASE 
        WHEN (SELECT COUNT(*) FROM branches b WHERE b.district = pd.district AND b.status = 'Active') = 0 
        THEN pd.population
        ELSE ROUND(pd.population / (SELECT COUNT(*) FROM branches b WHERE b.district = pd.district AND b.status = 'Active'), 0)
    END AS population_per_branch,
    
    
    (
        SELECT ROUND(AVG(yearly.profit_loss), 2)
        FROM (
            SELECT b.id, 
                   SUM(s.revenue) - COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.branch_id = b.id AND YEAR(e.date) = YEAR(CURDATE())), 0) AS profit_loss
            FROM branches b
            JOIN sales s ON b.id = s.branch_id
            WHERE b.district = pd.district 
            AND b.status = 'Active'
            AND YEAR(s.date) = YEAR(CURDATE())
            GROUP BY b.id
        ) AS yearly
    ) AS avg_branch_profit,
    
    
    ROUND(
        (pd.density / 10000 * 30) + 
        (CASE 
            WHEN (SELECT COUNT(*) FROM branches b WHERE b.district = pd.district) = 0 THEN 40
            WHEN (SELECT COUNT(*) FROM branches b WHERE b.district = pd.district) = 1 THEN 25
            ELSE 10
        END) + 
        (
            COALESCE((
                SELECT CASE WHEN AVG(profit) > 0 THEN 30 ELSE 15 END
                FROM (
                    SELECT SUM(s.revenue) - COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.branch_id = b.id), 0) AS profit
                    FROM branches b
                    JOIN sales s ON b.id = s.branch_id
                    WHERE b.district = pd.district
                    GROUP BY b.id
                ) AS p
            ), 20)
        ) 
    , 2) AS opportunity_score

FROM population_districts pd
ORDER BY opportunity_score DESC;
