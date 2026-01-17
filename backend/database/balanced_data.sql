USE isler_kitabevi;

DELETE FROM sales;
DELETE FROM expenses;


INSERT INTO sales (branch_id, date, category, quantity, revenue) VALUES
(1,'2024-01-01','Books',600,30000),(1,'2024-01-01','Stationery',400,20000),(1,'2024-01-01','Kids',250,12500),
(1,'2024-06-01','Books',580,29000),(1,'2024-06-01','Stationery',380,19000),(1,'2024-06-01','Kids',240,12000),
(1,'2024-12-01','Books',720,36000),(1,'2024-12-01','Stationery',480,24000),(1,'2024-12-01','Kids',300,15000);
INSERT INTO expenses (branch_id, date, expense_type, amount) VALUES
(1,'2024-01-01','Rent',18000),(1,'2024-01-01','Salary',20000),(1,'2024-01-01','Utilities',6000),
(1,'2024-06-01','Rent',18000),(1,'2024-06-01','Salary',20000),(1,'2024-06-01','Utilities',7000),
(1,'2024-12-01','Rent',18000),(1,'2024-12-01','Salary',20000),(1,'2024-12-01','Utilities',6500);

-- Branch 2: Alsancak (KARLI - premium lokasyon)
INSERT INTO sales (branch_id, date, category, quantity, revenue) VALUES
(2,'2024-01-01','Books',550,27500),(2,'2024-01-01','Stationery',350,17500),(2,'2024-01-01','Kids',220,11000),
(2,'2024-06-01','Books',530,26500),(2,'2024-06-01','Stationery',340,17000),(2,'2024-06-01','Kids',210,10500),
(2,'2024-12-01','Books',680,34000),(2,'2024-12-01','Stationery',430,21500),(2,'2024-12-01','Kids',270,13500);
INSERT INTO expenses (branch_id, date, expense_type, amount) VALUES
(2,'2024-01-01','Rent',16000),(2,'2024-01-01','Salary',18000),(2,'2024-01-01','Utilities',5500),
(2,'2024-06-01','Rent',16000),(2,'2024-06-01','Salary',18000),(2,'2024-06-01','Utilities',6500),
(2,'2024-12-01','Rent',16000),(2,'2024-12-01','Salary',18000),(2,'2024-12-01','Utilities',6000);


INSERT INTO sales (branch_id, date, category, quantity, revenue) VALUES
(3,'2024-01-01','Books',480,24000),(3,'2024-01-01','Stationery',320,16000),(3,'2024-01-01','Kids',200,10000),
(3,'2024-06-01','Books',460,23000),(3,'2024-06-01','Stationery',310,15500),(3,'2024-06-01','Kids',190,9500),
(3,'2024-12-01','Books',600,30000),(3,'2024-12-01','Stationery',400,20000),(3,'2024-12-01','Kids',250,12500);
INSERT INTO expenses (branch_id, date, expense_type, amount) VALUES
(3,'2024-01-01','Rent',14000),(3,'2024-01-01','Salary',16000),(3,'2024-01-01','Utilities',5000),
(3,'2024-06-01','Rent',14000),(3,'2024-06-01','Salary',16000),(3,'2024-06-01','Utilities',5800),
(3,'2024-12-01','Rent',14000),(3,'2024-12-01','Salary',16000),(3,'2024-12-01','Utilities',5400);


INSERT INTO sales (branch_id, date, category, quantity, revenue) VALUES
(4,'2024-01-01','Books',420,21000),(4,'2024-01-01','Stationery',280,14000),(4,'2024-01-01','Kids',180,9000),
(4,'2024-06-01','Books',400,20000),(4,'2024-06-01','Stationery',270,13500),(4,'2024-06-01','Kids',170,8500),
(4,'2024-12-01','Books',520,26000),(4,'2024-12-01','Stationery',350,17500),(4,'2024-12-01','Kids',220,11000);
INSERT INTO expenses (branch_id, date, expense_type, amount) VALUES
(4,'2024-01-01','Rent',12000),(4,'2024-01-01','Salary',14000),(4,'2024-01-01','Utilities',4500),
(4,'2024-06-01','Rent',12000),(4,'2024-06-01','Salary',14000),(4,'2024-06-01','Utilities',5200),
(4,'2024-12-01','Rent',12000),(4,'2024-12-01','Salary',14000),(4,'2024-12-01','Utilities',4800);


INSERT INTO sales (branch_id, date, category, quantity, revenue) VALUES
(5,'2024-01-01','Books',520,26000),(5,'2024-01-01','Stationery',380,19000),(5,'2024-01-01','Kids',160,8000),
(5,'2024-06-01','Books',450,22500),(5,'2024-06-01','Stationery',320,16000),(5,'2024-06-01','Kids',140,7000),
(5,'2024-12-01','Books',640,32000),(5,'2024-12-01','Stationery',460,23000),(5,'2024-12-01','Kids',200,10000);
INSERT INTO expenses (branch_id, date, expense_type, amount) VALUES
(5,'2024-01-01','Rent',15000),(5,'2024-01-01','Salary',17000),(5,'2024-01-01','Utilities',5200),
(5,'2024-06-01','Rent',15000),(5,'2024-06-01','Salary',17000),(5,'2024-06-01','Utilities',6000),
(5,'2024-12-01','Rent',15000),(5,'2024-12-01','Salary',17000),(5,'2024-12-01','Utilities',5600);


INSERT INTO sales (branch_id, date, category, quantity, revenue) VALUES
(6,'2024-01-01','Books',380,19000),(6,'2024-01-01','Stationery',250,12500),(6,'2024-01-01','Kids',160,8000),
(6,'2024-06-01','Books',360,18000),(6,'2024-06-01','Stationery',240,12000),(6,'2024-06-01','Kids',150,7500),
(6,'2024-12-01','Books',480,24000),(6,'2024-12-01','Stationery',320,16000),(6,'2024-12-01','Kids',200,10000);
INSERT INTO expenses (branch_id, date, expense_type, amount) VALUES
(6,'2024-01-01','Rent',11000),(6,'2024-01-01','Salary',13000),(6,'2024-01-01','Utilities',4000),
(6,'2024-06-01','Rent',11000),(6,'2024-06-01','Salary',13000),(6,'2024-06-01','Utilities',4800),
(6,'2024-12-01','Rent',11000),(6,'2024-12-01','Salary',13000),(6,'2024-12-01','Utilities',4400);


INSERT INTO sales (branch_id, date, category, quantity, revenue) VALUES
(7,'2024-01-01','Books',120,6000),(7,'2024-01-01','Stationery',80,4000),(7,'2024-01-01','Kids',60,3000),
(7,'2024-06-01','Books',100,5000),(7,'2024-06-01','Stationery',65,3250),(7,'2024-06-01','Kids',50,2500),
(7,'2024-12-01','Books',150,7500),(7,'2024-12-01','Stationery',100,5000),(7,'2024-12-01','Kids',75,3750);
INSERT INTO expenses (branch_id, date, expense_type, amount) VALUES
(7,'2024-01-01','Rent',22000),(7,'2024-01-01','Salary',18000),(7,'2024-01-01','Utilities',4500),
(7,'2024-06-01','Rent',22000),(7,'2024-06-01','Salary',18000),(7,'2024-06-01','Utilities',5200),
(7,'2024-12-01','Rent',22000),(7,'2024-12-01','Salary',18000),(7,'2024-12-01','Utilities',4800);


INSERT INTO sales (branch_id, date, category, quantity, revenue) VALUES
(8,'2024-01-01','Books',340,17000),(8,'2024-01-01','Stationery',220,11000),(8,'2024-01-01','Kids',140,7000),
(8,'2024-06-01','Books',320,16000),(8,'2024-06-01','Stationery',210,10500),(8,'2024-06-01','Kids',130,6500),
(8,'2024-12-01','Books',420,21000),(8,'2024-12-01','Stationery',280,14000),(8,'2024-12-01','Kids',180,9000);
INSERT INTO expenses (branch_id, date, expense_type, amount) VALUES
(8,'2024-01-01','Rent',10000),(8,'2024-01-01','Salary',12000),(8,'2024-01-01','Utilities',3500),
(8,'2024-06-01','Rent',10000),(8,'2024-06-01','Salary',12000),(8,'2024-06-01','Utilities',4200),
(8,'2024-12-01','Rent',10000),(8,'2024-12-01','Salary',12000),(8,'2024-12-01','Utilities',3800);


INSERT INTO sales (branch_id, date, category, quantity, revenue) VALUES
(9,'2024-01-01','Books',360,18000),(9,'2024-01-01','Stationery',240,12000),(9,'2024-01-01','Kids',150,7500),
(9,'2024-06-01','Books',340,17000),(9,'2024-06-01','Stationery',230,11500),(9,'2024-06-01','Kids',145,7250),
(9,'2024-12-01','Books',450,22500),(9,'2024-12-01','Stationery',300,15000),(9,'2024-12-01','Kids',190,9500);
INSERT INTO expenses (branch_id, date, expense_type, amount) VALUES
(9,'2024-01-01','Rent',10500),(9,'2024-01-01','Salary',12500),(9,'2024-01-01','Utilities',3800),
(9,'2024-06-01','Rent',10500),(9,'2024-06-01','Salary',12500),(9,'2024-06-01','Utilities',4500),
(9,'2024-12-01','Rent',10500),(9,'2024-12-01','Salary',12500),(9,'2024-12-01','Utilities',4100);


INSERT INTO sales (branch_id, date, category, quantity, revenue) VALUES
(10,'2024-01-01','Books',300,15000),(10,'2024-01-01','Stationery',200,10000),(10,'2024-01-01','Kids',130,6500),
(10,'2024-06-01','Books',280,14000),(10,'2024-06-01','Stationery',190,9500),(10,'2024-06-01','Kids',120,6000),
(10,'2024-12-01','Books',380,19000),(10,'2024-12-01','Stationery',250,12500),(10,'2024-12-01','Kids',160,8000);
INSERT INTO expenses (branch_id, date, expense_type, amount) VALUES
(10,'2024-01-01','Rent',9000),(10,'2024-01-01','Salary',11000),(10,'2024-01-01','Utilities',3200),
(10,'2024-06-01','Rent',9000),(10,'2024-06-01','Salary',11000),(10,'2024-06-01','Utilities',3800),
(10,'2024-12-01','Rent',9000),(10,'2024-12-01','Salary',11000),(10,'2024-12-01','Utilities',3500);


INSERT INTO sales (branch_id, date, category, quantity, revenue) VALUES
(11,'2024-01-01','Books',320,16000),(11,'2024-01-01','Stationery',210,10500),(11,'2024-01-01','Kids',135,6750),
(11,'2024-06-01','Books',300,15000),(11,'2024-06-01','Stationery',200,10000),(11,'2024-06-01','Kids',125,6250),
(11,'2024-12-01','Books',400,20000),(11,'2024-12-01','Stationery',270,13500),(11,'2024-12-01','Kids',170,8500);
INSERT INTO expenses (branch_id, date, expense_type, amount) VALUES
(11,'2024-01-01','Rent',9500),(11,'2024-01-01','Salary',11500),(11,'2024-01-01','Utilities',3400),
(11,'2024-06-01','Rent',9500),(11,'2024-06-01','Salary',11500),(11,'2024-06-01','Utilities',4000),
(11,'2024-12-01','Rent',9500),(11,'2024-12-01','Salary',11500),(11,'2024-12-01','Utilities',3700);


INSERT INTO sales (branch_id, date, category, quantity, revenue) VALUES
(12,'2024-01-01','Books',90,4500),(12,'2024-01-01','Stationery',55,2750),(12,'2024-01-01','Kids',40,2000),
(12,'2024-06-01','Books',75,3750),(12,'2024-06-01','Stationery',45,2250),(12,'2024-06-01','Kids',32,1600),
(12,'2024-12-01','Books',115,5750),(12,'2024-12-01','Stationery',70,3500),(12,'2024-12-01','Kids',50,2500);
INSERT INTO expenses (branch_id, date, expense_type, amount) VALUES
(12,'2024-01-01','Rent',18000),(12,'2024-01-01','Salary',16000),(12,'2024-01-01','Utilities',3800),
(12,'2024-06-01','Rent',18000),(12,'2024-06-01','Salary',16000),(12,'2024-06-01','Utilities',4400),
(12,'2024-12-01','Rent',18000),(12,'2024-12-01','Salary',16000),(12,'2024-12-01','Utilities',4000);
