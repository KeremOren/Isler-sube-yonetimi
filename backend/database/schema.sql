
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


CREATE INDEX idx_branches_district ON branches(district);
CREATE INDEX idx_branches_status ON branches(status);
