
USE isler_kitabevi;


SELECT b.id, b.name, 
    (SELECT COALESCE(SUM(revenue), 0) FROM sales WHERE branch_id = b.id) as gelir,
    (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE branch_id = b.id) as gider
FROM branches b WHERE b.id IN (10, 12);


UPDATE expenses SET amount = amount * 3 WHERE branch_id = 12;

  
UPDATE expenses SET amount = amount * 2.5 WHERE branch_id = 10;


UPDATE sales SET revenue = revenue * 0.3 WHERE branch_id = 12;


UPDATE sales SET revenue = revenue * 0.4 WHERE branch_id = 10;


SELECT b.id, b.name, 
    ROUND((SELECT COALESCE(SUM(revenue), 0) FROM sales WHERE branch_id = b.id)) as gelir,
    ROUND((SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE branch_id = b.id)) as gider,
    ROUND((SELECT COALESCE(SUM(revenue), 0) FROM sales WHERE branch_id = b.id) - 
          (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE branch_id = b.id)) as kar_zarar
FROM branches b WHERE b.id IN (10, 12);
