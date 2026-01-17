USE isler_kitabevi;


CREATE TABLE IF NOT EXISTS decision_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT,
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
    id INT AUTO_INCREMENT PRIMARY KEY,
    note_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (note_id) REFERENCES decision_notes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS decision_votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    note_id INT NOT NULL,
    user_id INT NOT NULL,
    vote ENUM('approve', 'reject', 'neutral') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_vote (note_id, user_id),
    FOREIGN KEY (note_id) REFERENCES decision_notes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


INSERT IGNORE INTO decision_notes (branch_id, user_id, title, content, note_type, priority, status) VALUES
(7, 1, 'Buca Şubesi Değerlendirmesi', 'Son 6 aydır sürekli zarar eden Buca şubesi için kapatma veya küçültme seçenekleri değerlendirilmeli.', 'warning', 'critical', 'open'),
(12, 1, 'Menemen Şubesi Değerlendirmesi', 'Son 6 aydır sürekli zarar eden Menemen şubesi için kapatma veya küçültme seçenekleri değerlendirilmeli.', 'warning', 'critical', 'open'),
(2, 1, 'Alsancak Şubesi Genişleme Önerisi', 'Alsancak şubesi çok iyi performans gösteriyor. Yan dükkanın kiralanması ile genişleme düşünülebilir.', 'recommendation', 'high', 'open'),
(NULL, 1, 'Online Sipariş Sistemi İyileştirmesi', 'Müşteri şikayetleri doğrultusunda online sipariş sisteminde teslimat süresi garantisi eklenebilir.', 'insight', 'medium', 'open');
