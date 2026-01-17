-- Gider Uyarı Trigger'ı - İşler Kitabevi
-- 50.000 TL üzeri giderlerde otomatik uyarı oluşturur

USE isler_kitabevi;

-- Uyarı tablosu oluştur
CREATE TABLE IF NOT EXISTS expense_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    expense_type VARCHAR(50) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    threshold_exceeded DECIMAL(12,2) NOT NULL,
    alert_message VARCHAR(255) NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- Mevcut trigger'ı sil (varsa)
DROP TRIGGER IF EXISTS trg_expense_alert;

-- Gider uyarı trigger'ı
DELIMITER //
CREATE TRIGGER trg_expense_alert
AFTER INSERT ON expenses
FOR EACH ROW
BEGIN
    IF NEW.amount > 50000 THEN
        INSERT INTO expense_alerts (branch_id, expense_type, amount, threshold_exceeded, alert_message)
        VALUES (NEW.branch_id, NEW.expense_type, NEW.amount, 50000, 
                CONCAT('Yüksek gider uyarısı: ', NEW.expense_type, ' için ', FORMAT(NEW.amount, 2), ' TL harcama yapıldı.'));
    END IF;
END //
DELIMITER ;

-- Trigger'ı kontrol et
SHOW TRIGGERS LIKE 'expenses';

SELECT 'Gider Uyarı Trigger başarıyla oluşturuldu!' as Mesaj;
