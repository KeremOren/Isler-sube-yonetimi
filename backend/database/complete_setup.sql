
DROP DATABASE IF EXISTS isler_kitabevi;
CREATE DATABASE isler_kitabevi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE isler_kitabevi;


CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Manager', 'Viewer') NOT NULL DEFAULT 'Viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    district VARCHAR(50) NOT NULL,
    region VARCHAR(50) DEFAULT 'İzmir',
    latitude DECIMAL(10, 6) NOT NULL,
    longitude DECIMAL(10, 6) NOT NULL,
    opened_at DATE NOT NULL,
    status ENUM('Active', 'Inactive', 'Closed') NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    date DATE NOT NULL,
    category ENUM('Books', 'Stationery', 'Kids', 'Gifts', 'OnlineOrders') NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    revenue DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    INDEX idx_sales_branch_date (branch_id, date),
    INDEX idx_sales_date (date),
    INDEX idx_sales_category (category)
);


CREATE TABLE expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    date DATE NOT NULL,
    expense_type ENUM('Rent', 'Salary', 'Utilities', 'Marketing', 'Inventory', 'Maintenance', 'Other') NOT NULL,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    INDEX idx_expenses_branch_date (branch_id, date),
    INDEX idx_expenses_date (date),
    INDEX idx_expenses_type (expense_type)
);


CREATE TABLE population_districts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    district VARCHAR(50) NOT NULL UNIQUE,
    population INT NOT NULL DEFAULT 0,
    density DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    area_km2 DECIMAL(10, 2) DEFAULT NULL,
    latitude DECIMAL(10, 6) DEFAULT NULL,
    longitude DECIMAL(10, 6) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE decision_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT DEFAULT NULL,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    note_type ENUM('opinion', 'suggestion', 'warning', 'decision') NOT NULL DEFAULT 'opinion',
    priority ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    status ENUM('open', 'in_discussion', 'resolved', 'rejected') NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE decision_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    note_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (note_id) REFERENCES decision_notes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE decision_votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    note_id INT NOT NULL,
    user_id INT NOT NULL,
    vote ENUM('approve', 'reject', 'neutral') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (note_id) REFERENCES decision_notes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vote (note_id, user_id)
);


CREATE INDEX idx_branches_district ON branches(district);
CREATE INDEX idx_branches_status ON branches(status);
CREATE INDEX idx_decision_notes_status ON decision_notes(status);
CREATE INDEX idx_decision_notes_branch ON decision_notes(branch_id);


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


INSERT INTO decision_notes (branch_id, user_id, title, content, note_type, priority, status) VALUES
(12, 1, 'Menemen Şubesi Değerlendirmesi', 'Son 6 aydır sürekli zarar eden Menemen şubesi için kapatma veya küçültme seçenekleri değerlendirilmeli.', 'warning', 'critical', 'in_discussion'),
(2, 1, 'Alsancak Şubesi Genişleme Önerisi', 'Alsancak şubesi çok iyi performans gösteriyor. Yan dükkanın kiralanması ile genişleme düşünülebilir.', 'suggestion', 'high', 'open'),
(NULL, 2, 'Online Sipariş Sistemi İyileştirmesi', 'Müşteri şikayetleri doğrultusunda online sipariş sisteminde teslimat süresi garantisi eklenebilir.', 'opinion', 'medium', 'open');


INSERT INTO sales (branch_id, date, category, quantity, revenue)
SELECT 
    b.id,
    DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL n.num MONTH), '%Y-%m-01') as date,
    cat.category,
    FLOOR(100 + RAND() * 900 * m.mult) as quantity,
    ROUND((100 + RAND() * 900 * m.mult) * (15 + RAND() * 25), 2) as revenue
FROM branches b
CROSS JOIN (SELECT 0 as num UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 
            UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11) n
CROSS JOIN (SELECT 'Books' as category UNION SELECT 'Stationery' UNION SELECT 'Kids' UNION SELECT 'Gifts' UNION SELECT 'OnlineOrders') cat
CROSS JOIN (SELECT 1 as id, 1.3 as mult UNION SELECT 2, 1.4 UNION SELECT 3, 1.2 UNION SELECT 4, 0.9 UNION SELECT 5, 1.1 
            UNION SELECT 6, 0.8 UNION SELECT 7, 0.95 UNION SELECT 8, 0.7 UNION SELECT 9, 0.85 
            UNION SELECT 10, 0.6 UNION SELECT 11, 0.75 UNION SELECT 12, 0.5) m
WHERE b.id = m.id;


INSERT INTO expenses (branch_id, date, expense_type, amount)
SELECT 
    b.id,
    DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL n.num MONTH), '%Y-%m-01') as date,
    'Rent',
    ROUND(r.rent * (1 + n.num * 0.008), 2)
FROM branches b
CROSS JOIN (SELECT 0 as num UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 
            UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11) n
CROSS JOIN (SELECT 1 as id, 25000 as rent UNION SELECT 2, 30000 UNION SELECT 3, 22000 UNION SELECT 4, 18000 
            UNION SELECT 5, 20000 UNION SELECT 6, 15000 UNION SELECT 7, 16000 UNION SELECT 8, 12000 
            UNION SELECT 9, 14000 UNION SELECT 10, 11000 UNION SELECT 11, 13000 UNION SELECT 12, 10000) r
WHERE b.id = r.id;

INSERT INTO expenses (branch_id, date, expense_type, amount)
SELECT 
    b.id,
    DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL n.num MONTH), '%Y-%m-01') as date,
    'Salary',
    ROUND(s.salary * (1 + n.num * 0.01), 2)
FROM branches b
CROSS JOIN (SELECT 0 as num UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 
            UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11) n
CROSS JOIN (SELECT 1 as id, 45000 as salary UNION SELECT 2, 50000 UNION SELECT 3, 40000 UNION SELECT 4, 32000 
            UNION SELECT 5, 38000 UNION SELECT 6, 28000 UNION SELECT 7, 30000 UNION SELECT 8, 25000 
            UNION SELECT 9, 27000 UNION SELECT 10, 22000 UNION SELECT 11, 26000 UNION SELECT 12, 20000) s
WHERE b.id = s.id;

INSERT INTO expenses (branch_id, date, expense_type, amount)
SELECT 
    b.id,
    DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL n.num MONTH), '%Y-%m-01') as date,
    'Utilities',
    ROUND(3000 + RAND() * 2000, 2)
FROM branches b
CROSS JOIN (SELECT 0 as num UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 
            UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11) n;


SELECT 'Veritabanı başarıyla oluşturuldu!' as Mesaj;
SELECT CONCAT('Kullanıcı sayısı: ', COUNT(*)) as Info FROM users;
SELECT CONCAT('Şube sayısı: ', COUNT(*)) as Info FROM branches;
SELECT CONCAT('Satış kaydı: ', COUNT(*)) as Info FROM sales;
SELECT CONCAT('Gider kaydı: ', COUNT(*)) as Info FROM expenses;
