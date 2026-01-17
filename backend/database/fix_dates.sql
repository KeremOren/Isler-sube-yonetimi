
USE isler_kitabevi;


UPDATE sales SET date = DATE_ADD(date, INTERVAL 1 YEAR) WHERE YEAR(date) < 2024;


UPDATE expenses SET date = DATE_ADD(date, INTERVAL 1 YEAR) WHERE YEAR(date) < 2024;


SELECT 'Satış' as Tablo, YEAR(date) as Yil, COUNT(*) as Kayit FROM sales GROUP BY YEAR(date)
UNION ALL
SELECT 'Gider' as Tablo, YEAR(date) as Yil, COUNT(*) as Kayit FROM expenses GROUP BY YEAR(date);
