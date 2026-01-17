
USE isler_kitabevi;


UPDATE sales 
SET revenue = revenue * 2.5, quantity = quantity * 2
WHERE branch_id NOT IN (11, 12);


UPDATE expenses
SET amount = amount * 0.7
WHERE branch_id NOT IN (11, 12);


UPDATE sales 
SET revenue = revenue * 0.5
WHERE branch_id IN (11, 12);


UPDATE expenses
SET amount = amount * 1.3
WHERE branch_id IN (11, 12);


SELECT 
    b.id,
    b.name,
    b.district,
    COALESCE(SUM(s.revenue), 0) as total_revenue,
    COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.branch_id = b.id), 0) as total_expenses,
    COALESCE(SUM(s.revenue), 0) - COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.branch_id = b.id), 0) as profit,
    CASE 
        WHEN COALESCE(SUM(s.revenue), 0) - COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.branch_id = b.id), 0) >= 0 
        THEN 'Kârlı' 
        ELSE 'Zararlı' 
    END as status
FROM branches b
LEFT JOIN sales s ON b.id = s.branch_id
GROUP BY b.id, b.name, b.district
ORDER BY profit DESC;
