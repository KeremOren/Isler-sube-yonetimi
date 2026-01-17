# İŞLER KİTABEVİ ŞUBE YÖNETİM SİSTEMİ
## Proje Raporu

---

# ÖZET

Bu proje, İzmir'de faaliyet gösteren "İşler Kitabevi" zincirinin 12 şubesinin performans takibi, kâr/zarar analizi ve stratejik karar desteği sağlamak amacıyla geliştirilmiş bir web tabanlı yönetim sistemidir. Sistem; gösterge paneli, şube karşılaştırma, risk analizi, senaryo simülasyonu, harita görünümü ve grup kararları gibi modüllerden oluşmaktadır. Proje, Node.js, React ve MySQL teknolojileri kullanılarak geliştirilmiştir. Veritabanında trigger mekanizması ile otomatik gider uyarı sistemi implementeedimiştir.

---

# GİRİŞ

Perakende sektöründe çoklu şube yönetimi, karar vericiler için önemli bir zorluk teşkil etmektedir. Her şubenin farklı performans göstergeleri, gider kalemleri ve kârlılık oranları bulunmaktadır. Bu verilerin manuel takibi hem zaman alıcı hem de hata payı yüksek bir süreçtir.

Bu proje, şube yöneticilerinin ve üst düzey karar vericilerin:
- Anlık performans verilerine erişebilmesini
- Şubeler arası karşılaştırma yapabilmesini
- Risk altındaki şubeleri tespit edebilmesini
- Senaryo analizleri ile gelecek projeksiyonları oluşturabilmesini
- Coğrafi verilerle birlikte performans görselleştirmesi yapabilmesini

sağlamak amacıyla geliştirilmiştir.

---

# BÖLÜM 1: PROBLEMİN TANIMLI İNCELENMESİ

## 1.1 Problem Tanımı

İşler Kitabevi'nin İzmir'deki 12 şubesinin yönetimi aşağıdaki sorunları barındırmaktadır:

1. **Veri Dağınıklığı**: Satış ve gider verileri farklı kaynaklarda tutulmakta, bütünleşik bir görünüm sağlanamamaktadır.

2. **Gecikmeli Raporlama**: Performans raporları manuel olarak hazırlandığından güncel verilere erişim gecikmektedir.

3. **Karşılaştırma Zorluğu**: Şubeler arası performans karşılaştırması yapılamamakta, en iyi/kötü performans gösteren şubeler tespit edilememektedir.

4. **Risk Tespiti**: Zarar eden veya risk altındaki şubelerin erken tespiti yapılamamaktadır.

5. **Karar Destek Eksikliği**: "Ne olur eğer" senaryoları ile gelecek projeksiyonları yapılamamaktadır.

## 1.2 Amaç ve Hedefler

**Ana Amaç**: Şube performanslarının gerçek zamanlı takibini ve stratejik karar desteğini sağlayan web tabanlı bir yönetim sistemi geliştirmek.

**Hedefler**:
- Tüm şubelerin KPI'larını tek panelde görüntüleme
- Şubeler arası performans karşılaştırması
- Risk skorlaması ile erken uyarı sistemi
- Senaryo simülasyonu ile projeksiyon yapma
- Coğrafi harita üzerinde görselleştirme
- Veritabanı trigger'ı ile otomatik uyarı sistemi

---

# BÖLÜM 2: YÖNTEM-METOD

## 2.1 Geliştirme Metodolojisi

Projede **Çevik (Agile)** geliştirme metodolojisi benimsenmiştir. Modüler yapı sayesinde her özellik bağımsız olarak geliştirilebilmiştir.

## 2.2 Teknoloji Seçimi

| Katman | Teknoloji | Seçim Gerekçesi |
|--------|-----------|-----------------|
| Frontend | React + Vite | Component tabanlı yapı, hızlı geliştirme |
| Backend | Node.js + Express.js | JavaScript ekosistemi, async yapı |
| Veritabanı | MySQL | İlişkisel veri modeli, trigger desteği |
| Harita | Leaflet.js | Açık kaynak, esnek kullanım |
| Grafikler | Chart.js | Kolay entegrasyon, zengin görsellik |
| Kimlik Doğrulama | JWT + bcrypt | Güvenli token tabanlı oturum |

## 2.3 Veritabanı Tasarımı

### 2.3.1 Tablo Yapısı

Veritabanı 8 ana tablodan oluşmaktadır:

1. **users**: Kullanıcı bilgileri (id, name, email, password, role)
2. **branches**: Şube bilgileri (id, name, district, latitude, longitude, status)
3. **sales**: Satış kayıtları (id, branch_id, date, category, quantity, revenue)
4. **expenses**: Gider kayıtları (id, branch_id, date, expense_type, amount)
5. **decision_notes**: Karar notları
6. **decision_comments**: Yorumlar
7. **decision_votes**: Oylar
8. **population_districts**: İlçe nüfus verileri
9. **expense_alerts**: Gider uyarıları (Trigger tarafından doldurulur)

### 2.3.2 İlişkiler

- branches (1) → sales (N): Bir şubenin birden fazla satışı olabilir
- branches (1) → expenses (N): Bir şubenin birden fazla gideri olabilir
- Foreign Key ile veri bütünlüğü sağlanmıştır

### 2.3.3 Index Kullanımı

Sorgu performansını artırmak için kritik sütunlarda index oluşturulmuştur:
```sql
INDEX idx_sales_branch_date (branch_id, date)
INDEX idx_expenses_branch_date (branch_id, date)
```

### 2.3.4 Trigger Mekanizması

50.000 TL üzeri giderler için otomatik uyarı oluşturan trigger implementeedimiştir:

```sql
CREATE TRIGGER trg_expense_alert
AFTER INSERT ON expenses
FOR EACH ROW
BEGIN
    IF NEW.amount > 50000 THEN
        INSERT INTO expense_alerts (branch_id, expense_type, amount, alert_message)
        VALUES (NEW.branch_id, NEW.expense_type, NEW.amount, 
                'Yüksek gider uyarısı tespit edildi.');
    END IF;
END
```

## 2.4 Güvenlik Önlemleri

1. **Şifre Hashleme**: bcrypt algoritması ile şifreler hashlenmiştir
2. **JWT Token**: Oturum yönetimi için JSON Web Token kullanılmıştır
3. **Prepared Statement**: SQL Injection saldırılarına karşı parametreli sorgular
4. **Role-Based Access Control**: Admin, Manager, Viewer yetki seviyeleri

---

# BÖLÜM 3: BULGULAR-UYGULAMA-YAZILIMLAR

## 3.1 Sistem Modülleri

### 3.1.1 Gösterge Paneli (Dashboard)
- Toplam gelir, gider, net kâr, ortalama marj KPI kartları
- En iyi ve en düşük performanslı şube gösterimi
- Gelir/gider karşılaştırma grafikleri
- Aylık kâr/zarar trend grafiği
- Trigger ile oluşan gider uyarıları

### 3.1.2 Şube Karşılaştırma
- 2-5 şube seçerek performans karşılaştırması
- Kategori bazlı satış analizi (Kitaplar, Kırtasiye, Çocuk, Hediyelik, Online)
- Yıl bazlı filtreleme

### 3.1.3 Risk Analizi
- Şubelerin risk skorları hesaplanması
- Düşük/Orta/Yüksek risk sınıflandırması
- Risk faktörlerinin görselleştirilmesi

### 3.1.4 Senaryo Simülatörü
- Kira değişikliği simülasyonu
- Maaş değişikliği simülasyonu
- Gelir değişikliği simülasyonu
- Personel değişikliği etkisi
- 12 aylık projeksiyon grafiği

### 3.1.5 Harita Görünümü
- İzmir ilçe haritası (Leaflet.js)
- Nüfus yoğunluğu katmanı
- Kârlı şubeler (yeşil marker)
- Zararlı şubeler (kırmızı marker)

### 3.1.6 Tahminleme
- Gelecek ay/yıl satış tahminleri
- Trend analizi

### 3.1.7 Grup Kararları
- Karar notu oluşturma
- Yorum ekleme
- Oylama sistemi (Onay/Red/Nötr)

### 3.1.8 Kullanıcı Yönetimi
- Kullanıcı CRUD işlemleri
- Rol atama (Admin/Manager/Viewer)
- Şifre değiştirme

## 3.2 Ekran Görüntüleri

(Bu bölüme projenin ekran görüntüleri eklenecektir)

## 3.3 API Yapısı

REST API mimarisi kullanılmıştır:

| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| /auth/login | POST | Kullanıcı girişi |
| /branches | GET | Şube listesi |
| /analytics/kpis | GET | KPI verileri |
| /analytics/alerts | GET | Gider uyarıları |
| /scenarios/simulate | POST | Senaryo simülasyonu |
| /map/branches | GET | Harita şube verileri |

---

# SONUÇ

Bu projede, İşler Kitabevi'nin 12 şubesinin yönetimi için kapsamlı bir web tabanlı sistem geliştirilmiştir. Sistem şunları sağlamaktadır:

1. **Gerçek Zamanlı Takip**: Tüm şubelerin performans verileri anlık olarak görüntülenebilmektedir.

2. **Karşılaştırmalı Analiz**: Şubeler arası performans karşılaştırması yapılabilmektedir.

3. **Erken Uyarı**: Trigger mekanizması ile yüksek giderler otomatik olarak tespit edilmektedir.

4. **Karar Desteği**: Senaryo simülasyonu ile gelecek projeksiyonları yapılabilmektedir.

5. **Görsel Analiz**: Harita ve grafiklerle verilerin görselleştirilmesi sağlanmıştır.

**Gelecek Geliştirmeler**:
- Mobil uygulama entegrasyonu
- E-posta bildirim sistemi
- Makine öğrenmesi ile tahminleme
- Daha fazla trigger kuralı

---

# REFERANSLAR

1. MySQL 8.0 Reference Manual - https://dev.mysql.com/doc/
2. React Documentation - https://react.dev/
3. Express.js Documentation - https://expressjs.com/
4. Leaflet.js Documentation - https://leafletjs.com/
5. Chart.js Documentation - https://www.chartjs.org/
6. JWT.io - JSON Web Tokens - https://jwt.io/
7. bcrypt npm package - https://www.npmjs.com/package/bcryptjs
