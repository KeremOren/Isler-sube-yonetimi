

USE isler_kitabevi;


INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@islerkitabevi.com', '$2a$10$rPQvWV8fUl0vJeH.LDsFUOL6oVrK9VaAqYUJsVpyPu8FQrPJvzWXe', 'Admin'),
('Manager User', 'manager@islerkitabevi.com', '$2a$10$rPQvWV8fUl0vJeH.LDsFUOL6oVrK9VaAqYUJsVpyPu8FQrPJvzWXe', 'Manager'),
('Viewer User', 'viewer@islerkitabevi.com', '$2a$10$rPQvWV8fUl0vJeH.LDsFUOL6oVrK9VaAqYUJsVpyPu8FQrPJvzWXe', 'Viewer');


INSERT INTO branches (name, district, region, latitude, longitude, opened_at, status) VALUES
('Konak Merkez', 'Konak', 'İzmir', 38.4192, 27.1287, '2018-01-15', 'Active'),
('Alsancak', 'Konak', 'İzmir', 38.4320, 27.1416, '2018-03-01', 'Active'),
('Karşıyaka Çarşı', 'Karşıyaka', 'İzmir', 38.4557, 27.1126, '2018-06-15', 'Active'),
('Bostanlı', 'Karşıyaka', 'İzmir', 38.4639, 27.0928, '2019-01-10', 'Active'),
('Bornova', 'Bornova', 'İzmir', 38.4622, 27.2210, '2018-09-01', 'Active'),
('Bayraklı', 'Bayraklı', 'İzmir', 38.4710, 27.1720, '2019-05-01', 'Active'),
('Buca', 'Buca', 'İzmir', 38.3912, 27.1970, '2019-08-15', 'Active'),
('Gaziemir', 'Gaziemir', 'İzmir', 38.3246, 27.1345, '2020-02-01', 'Active'),
('Balçova', 'Balçova', 'İzmir', 38.3952, 27.0537, '2020-06-01', 'Active'),
('Narlıdere', 'Narlıdere', 'İzmir', 38.3966, 27.0045, '2021-01-15', 'Active'),
('Çiğli', 'Çiğli', 'İzmir', 38.4913, 27.0707, '2021-06-01', 'Active'),
('Menemen', 'Menemen', 'İzmir', 38.6076, 27.0610, '2022-01-01', 'Active');


INSERT INTO population_districts (district, population, density, area_km2, latitude, longitude) VALUES
('Konak', 355000, 12500.00, 28.40, 38.4192, 27.1287),
('Karşıyaka', 335000, 8500.00, 39.41, 38.4557, 27.1126),
('Bornova', 450000, 3200.00, 140.63, 38.4622, 27.2210),
('Bayraklı', 315000, 9500.00, 33.16, 38.4710, 27.1720),
('Buca', 520000, 4500.00, 115.56, 38.3912, 27.1970),
('Gaziemir', 140000, 2800.00, 50.00, 38.3246, 27.1345),
('Balçova', 80000, 5600.00, 14.29, 38.3952, 27.0537),
('Narlıdere', 70000, 4200.00, 16.67, 38.3966, 27.0045),
('Çiğli', 210000, 1800.00, 116.67, 38.4913, 27.0707),
('Menemen', 180000, 450.00, 400.00, 38.6076, 27.0610),
('Güzelbahçe', 35000, 1200.00, 29.17, 38.3700, 26.8900),
('Urla', 70000, 180.00, 388.89, 38.3220, 26.7650),
('Seferihisar', 45000, 150.00, 300.00, 38.1970, 26.8380),
('Torbalı', 180000, 350.00, 514.29, 38.1570, 27.3580),
('Kemalpaşa', 110000, 220.00, 500.00, 38.4270, 27.4180);



DELIMITER //

CREATE PROCEDURE generate_sales_data()
BEGIN
    DECLARE v_branch_id INT;
    DECLARE v_date DATE;
    DECLARE v_category VARCHAR(20);
    DECLARE v_base_qty INT;
    DECLARE v_base_revenue DECIMAL(12,2);
    DECLARE v_multiplier DECIMAL(4,2);
    DECLARE v_seasonal DECIMAL(4,2);
    DECLARE v_month INT;
    DECLARE v_year INT;
    DECLARE v_categories VARCHAR(100) DEFAULT 'Books,Stationery,Kids,Gifts,OnlineOrders';
    DECLARE v_cat_index INT;
    
    
    SET v_date = DATE_SUB(CURDATE(), INTERVAL 24 MONTH);
    SET v_date = DATE_FORMAT(v_date, '%Y-%m-01');
    
    
    WHILE v_date <= CURDATE() DO
        SET v_month = MONTH(v_date);
        SET v_year = YEAR(v_date);
        
        
        SET v_seasonal = CASE 
            WHEN v_month IN (9, 10) THEN 1.4  
            WHEN v_month IN (11, 12) THEN 1.5 
            WHEN v_month IN (1, 2) THEN 0.8   
            WHEN v_month IN (6, 7, 8) THEN 0.9 
            ELSE 1.0
        END;
        
       
        SET v_branch_id = 1;
        WHILE v_branch_id <= 12 DO
            
            SET v_multiplier = CASE v_branch_id
                WHEN 1 THEN 1.3   
                WHEN 2 THEN 1.4   
                WHEN 3 THEN 1.2   
                WHEN 4 THEN 0.9   
                WHEN 5 THEN 1.1   
                WHEN 6 THEN 0.8   
                WHEN 7 THEN 0.95  
                WHEN 8 THEN 0.7   
                WHEN 9 THEN 0.85  
                WHEN 10 THEN 0.6  
                WHEN 11 THEN 0.75 
                WHEN 12 THEN 0.5  
            END;
            
            
            SET v_multiplier = v_multiplier * (1 + (v_year - 2022) * 0.05);
            
            
            IF v_branch_id = 12 THEN
                SET v_multiplier = v_multiplier * (1 - (DATEDIFF(v_date, '2023-01-01') / 365) * 0.15);
            END IF;
            
            
            SET v_base_qty = FLOOR(800 + RAND() * 400);
            SET v_base_revenue = v_base_qty * (25 + RAND() * 15);
            INSERT INTO sales (branch_id, date, category, quantity, revenue)
            VALUES (v_branch_id, v_date, 'Books', 
                    FLOOR(v_base_qty * v_multiplier * v_seasonal),
                    ROUND(v_base_revenue * v_multiplier * v_seasonal, 2));
            
            
            SET v_base_qty = FLOOR(500 + RAND() * 300);
            SET v_base_revenue = v_base_qty * (8 + RAND() * 7);
            INSERT INTO sales (branch_id, date, category, quantity, revenue)
            VALUES (v_branch_id, v_date, 'Stationery', 
                    FLOOR(v_base_qty * v_multiplier * v_seasonal * 1.2),
                    ROUND(v_base_revenue * v_multiplier * v_seasonal, 2));
            
            
            SET v_base_qty = FLOOR(200 + RAND() * 150);
            SET v_base_revenue = v_base_qty * (20 + RAND() * 20);
            INSERT INTO sales (branch_id, date, category, quantity, revenue)
            VALUES (v_branch_id, v_date, 'Kids', 
                    FLOOR(v_base_qty * v_multiplier * v_seasonal),
                    ROUND(v_base_revenue * v_multiplier * v_seasonal, 2));
            
            
            SET v_base_qty = FLOOR(100 + RAND() * 100);
            SET v_base_revenue = v_base_qty * (35 + RAND() * 25);
            INSERT INTO sales (branch_id, date, category, quantity, revenue)
            VALUES (v_branch_id, v_date, 'Gifts', 
                    FLOOR(v_base_qty * v_multiplier * v_seasonal * 1.3),
                    ROUND(v_base_revenue * v_multiplier * v_seasonal * 1.1, 2));
            
            
            SET v_base_qty = FLOOR(150 + RAND() * 100);
            SET v_base_revenue = v_base_qty * (30 + RAND() * 20);
            INSERT INTO sales (branch_id, date, category, quantity, revenue)
            VALUES (v_branch_id, v_date, 'OnlineOrders', 
                    FLOOR(v_base_qty * v_multiplier * v_seasonal * (1 + (v_year - 2022) * 0.2)),
                    ROUND(v_base_revenue * v_multiplier * v_seasonal * (1 + (v_year - 2022) * 0.2), 2));
            
            SET v_branch_id = v_branch_id + 1;
        END WHILE;
        
        
        SET v_date = DATE_ADD(v_date, INTERVAL 1 MONTH);
    END WHILE;
END //

DELIMITER ;

CALL generate_sales_data();
DROP PROCEDURE generate_sales_data;



DELIMITER //

CREATE PROCEDURE generate_expenses_data()
BEGIN
    DECLARE v_branch_id INT;
    DECLARE v_date DATE;
    DECLARE v_rent DECIMAL(12,2);
    DECLARE v_salary DECIMAL(12,2);
    DECLARE v_utilities DECIMAL(12,2);
    DECLARE v_marketing DECIMAL(12,2);
    DECLARE v_inventory DECIMAL(12,2);
    DECLARE v_maintenance DECIMAL(12,2);
    
    
    SET v_date = DATE_SUB(CURDATE(), INTERVAL 24 MONTH);
    SET v_date = DATE_FORMAT(v_date, '%Y-%m-01');
    
    
    WHILE v_date <= CURDATE() DO
        
        SET v_branch_id = 1;
        WHILE v_branch_id <= 12 DO
            
            SET v_rent = CASE v_branch_id
                WHEN 1 THEN 25000  
                WHEN 2 THEN 30000  
                WHEN 3 THEN 22000  
                WHEN 4 THEN 18000  
                WHEN 5 THEN 20000  
                WHEN 6 THEN 15000  
                WHEN 7 THEN 16000  
                WHEN 8 THEN 12000  
                WHEN 9 THEN 14000  
                WHEN 10 THEN 11000 
                WHEN 11 THEN 13000 
                WHEN 12 THEN 10000 
            END;
           
            SET v_rent = v_rent * (1 + (YEAR(v_date) - 2022) * 0.1);
            
            
            SET v_salary = CASE v_branch_id
                WHEN 1 THEN 45000  
                WHEN 2 THEN 50000  
                WHEN 3 THEN 40000  
                WHEN 4 THEN 32000  
                WHEN 5 THEN 38000  
                WHEN 6 THEN 28000  
                WHEN 7 THEN 30000  
                WHEN 8 THEN 25000  
                WHEN 9 THEN 27000  
                WHEN 10 THEN 22000 
                WHEN 11 THEN 26000 
                WHEN 12 THEN 20000 
            END;
            
            SET v_salary = v_salary * (1 + (YEAR(v_date) - 2022) * 0.15);
            
            
            SET v_utilities = (3000 + RAND() * 2000) * (1 + (YEAR(v_date) - 2022) * 0.2);
            
            
            SET v_marketing = CASE 
                WHEN MONTH(v_date) IN (9, 10, 11, 12) THEN 5000 + RAND() * 3000
                ELSE 2000 + RAND() * 2000
            END;
            
            
            SET v_inventory = 8000 + RAND() * 5000;
            
            
            SET v_maintenance = CASE 
                WHEN RAND() < 0.3 THEN 1000 + RAND() * 3000
                ELSE 500 + RAND() * 500
            END;
            
            
            INSERT INTO expenses (branch_id, date, expense_type, amount) VALUES
            (v_branch_id, v_date, 'Rent', ROUND(v_rent, 2)),
            (v_branch_id, v_date, 'Salary', ROUND(v_salary, 2)),
            (v_branch_id, v_date, 'Utilities', ROUND(v_utilities, 2)),
            (v_branch_id, v_date, 'Marketing', ROUND(v_marketing, 2)),
            (v_branch_id, v_date, 'Inventory', ROUND(v_inventory, 2)),
            (v_branch_id, v_date, 'Maintenance', ROUND(v_maintenance, 2));
            
            SET v_branch_id = v_branch_id + 1;
        END WHILE;
        
        
        SET v_date = DATE_ADD(v_date, INTERVAL 1 MONTH);
    END WHILE;
END //

DELIMITER ;

CALL generate_expenses_data();
DROP PROCEDURE generate_expenses_data;
