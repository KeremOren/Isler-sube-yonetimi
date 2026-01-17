
USE isler_kitabevi;


ALTER TABLE users ADD COLUMN branch_id INT NULL;
ALTER TABLE users ADD COLUMN district VARCHAR(50) NULL;


UPDATE users SET branch_id = 1, district = 'Konak' WHERE email = 'manager@islerkitabevi.com';


SELECT id, name, email, role, branch_id, district FROM users;
