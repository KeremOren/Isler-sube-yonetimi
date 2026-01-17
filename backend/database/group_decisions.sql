
USE isler_kitabevi;


CREATE TABLE IF NOT EXISTS decision_notes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    branch_id INT NULL,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    note_type ENUM('insight', 'recommendation', 'warning', 'decision') DEFAULT 'insight',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    status ENUM('open', 'in_review', 'approved', 'rejected', 'implemented') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS decision_comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    note_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (note_id) REFERENCES decision_notes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS decision_votes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    note_id INT NOT NULL,
    user_id INT NOT NULL,
    vote ENUM('approve', 'reject', 'neutral') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_vote (note_id, user_id),
    FOREIGN KEY (note_id) REFERENCES decision_notes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


INSERT INTO decision_notes (branch_id, user_id, title, content, note_type, priority, status) VALUES
(11, 1, 'Menemen Şubesi Kapatma Önerisi', 'Son 6 aydır sürekli zarar eden Menemen şubesinin kapatılması veya küçültülmesi önerilmektedir. Kira maliyetleri gelire oranla çok yüksek.', 'recommendation', 'high', 'in_review'),
(12, 1, 'Torbalı Şubesi Strateji Değişikliği', 'Torbalı şubesinde ürün gamı değişikliği yapılarak okul malzemeleri ağırlıklı satışa geçilmesi düşünülebilir.', 'recommendation', 'medium', 'open'),
(1, 2, 'Alsancak Şubesi Genişleme Fırsatı', 'Alsancak şubesi yüksek performans gösteriyor. Yan dükkanın kiralanması ile genişleme yapılabilir.', 'insight', 'medium', 'open'),
(NULL, 1, 'Yeni Şube Açılışı - Bornova', 'Bornova bölgesinde üniversite yakınında yeni şube açılması değerlendirilmelidir. Nüfus yoğunluğu ve genç nüfus oranı yüksek.', 'recommendation', 'high', 'in_review');


INSERT INTO decision_comments (note_id, user_id, comment) VALUES
(1, 2, 'Kapatma yerine önce personel azaltma ve kira indirimi görüşmesi yapılmalı.'),
(1, 3, 'Bölgedeki rakip durumu da incelenmeli.'),
(4, 2, 'Üniversite kampüsü içinde kiosk şeklinde başlanabilir.');


INSERT INTO decision_votes (note_id, user_id, vote) VALUES
(1, 1, 'approve'),
(1, 2, 'neutral'),
(1, 3, 'reject'),
(4, 1, 'approve'),
(4, 2, 'approve');

SELECT 'Group decision tables created successfully!' as result;
