

USE isler_kitabevi;


UPDATE users SET password = '$2a$10$rOvHPLZdH2QVTOvXxVdWW.8WInJLsDEP6N8MNL7RfD4VLxzMxnKHi' WHERE email = 'admin@islerkitabevi.com';


SELECT id, email, role, password FROM users WHERE email = 'admin@islerkitabevi.com';
