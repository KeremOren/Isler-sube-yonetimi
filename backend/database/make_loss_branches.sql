
USE isler_kitabevi;


UPDATE expenses 
SET amount = amount * 2.5 
WHERE branch_id = 12;


UPDATE expenses 
SET amount = amount * 2 
WHERE branch_id = 10;


UPDATE sales 
SET revenue = revenue * 0.4 
WHERE branch_id = 12;


UPDATE sales 
SET revenue = revenue * 0.5 
WHERE branch_id = 10;


SELECT 
    b.name,
    COALESCE(SUM(s.revenue), 0) as gelir,
    COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.branch_id = b.id), 0) as gider,
    COALESCE(SUM(s.revenue), 0) - COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.branch_id = b.id), 0) as kar_zarar
FROM branches b
LEFT JOIN sales s ON b.id = s.branch_id
WHERE b.id IN (10, 12)
GROUP BY b.id, b.name;
