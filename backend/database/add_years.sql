USE isler_kitabevi;


INSERT INTO sales (branch_id, date, category, quantity, revenue)
SELECT branch_id, DATE_SUB(date, INTERVAL 1 YEAR), category, 
       FLOOR(quantity * 0.9), FLOOR(revenue * 0.9)
FROM sales WHERE YEAR(date) = 2024;

INSERT INTO expenses (branch_id, date, expense_type, amount)
SELECT branch_id, DATE_SUB(date, INTERVAL 1 YEAR), expense_type, 
       FLOOR(amount * 0.95)
FROM expenses WHERE YEAR(date) = 2024;


INSERT INTO sales (branch_id, date, category, quantity, revenue)
SELECT branch_id, DATE_ADD(date, INTERVAL 1 YEAR), category, 
       FLOOR(quantity * 1.15), FLOOR(revenue * 1.15)
FROM sales WHERE YEAR(date) = 2024;

INSERT INTO expenses (branch_id, date, expense_type, amount)
SELECT branch_id, DATE_ADD(date, INTERVAL 1 YEAR), expense_type, 
       FLOOR(amount * 1.08)
FROM expenses WHERE YEAR(date) = 2024;
