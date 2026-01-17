# İşler Kitabevi - Şube Yönetim Karar Destek Sistemi (KDS)

## 📋 Proje Açıklaması

Bu proje, İzmir'de faaliyet gösteren **İşler Kitabevi** zincirinin 12 şubesinin performans takibi, kâr/zarar analizi ve stratejik karar desteği sağlamak amacıyla geliştirilmiş bir **Karar Destek Sistemi (KDS)** web uygulamasıdır.

### Kullanılan Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React + Vite |
| Backend | Node.js + Express.js |
| Veritabanı | MySQL |
| Harita | Leaflet.js |
| Grafikler | Chart.js |
| Kimlik Doğrulama | JWT + bcrypt |

---

## 📖 Senaryo Tanımı

**İşler Kitabevi**, İzmir'in farklı ilçelerinde 12 şubesi bulunan bir kitabevi zinciridir. Yönetim, şubelerin performansını takip etmek, zararlı şubeleri tespit etmek ve stratejik kararlar almak için bir sisteme ihtiyaç duymaktadır.

**Sistemin Çözdüğü Problemler:**
- Şube performanslarının gerçek zamanlı takibi
- Kârlı/zararlı şubelerin tespiti
- Risk altındaki şubelerin erken uyarı sistemi
- Senaryo simülasyonu ile gelecek projeksiyonları
- Coğrafi harita üzerinde görselleştirme
- Trigger ile otomatik gider uyarıları (50.000 TL+)

**Sistem Modülleri:**
1. **Gösterge Paneli** - KPI kartları, grafikler, trend analizi
2. **Şube Karşılaştırma** - 2-5 şube performans karşılaştırması
3. **Risk Analizi** - Şube risk skorları
4. **Senaryo Simülatörü** - What-if analizleri
5. **Harita Görünümü** - İzmir haritası, nüfus yoğunluğu
6. **Tahminleme** - Gelecek dönem tahminleri
7. **Grup Kararları** - Yorum ve oylama sistemi
8. **Kullanıcı Yönetimi** - Admin/Manager/Viewer rolleri

---

## 🚀 Kurulum Adımları

### Gereksinimler
- Node.js 18+
- MySQL 8.0+ (veya XAMPP)
- npm 9+

### 1. Projeyi Klonlayın
```bash
git clone https://github.com/KULLANICI_ADI/Isler-sube-yonetimi.git
cd Isler-sube-yonetimi
```

### 2. Backend Kurulumu
```bash
cd backend
npm install
cp .env.example .env
# .env dosyasını düzenleyin (MySQL şifresi vb.)
```

### 3. Frontend Kurulumu
```bash
cd frontend
npm install --legacy-peer-deps
cp .env.example .env
```

### 4. Veritabanı Kurulumu
```bash
# XAMPP'ta MySQL'i başlatın, ardından:
mysql -u root -p < backend/database/schema.sql
mysql -u root -p < backend/database/views.sql
mysql -u root -p < backend/database/seed.sql
mysql -u root -p < backend/database/triggers.sql
```

### 5. Uygulamayı Başlatın

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
# 🚀 Server running on http://localhost:3001
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
# ➜ Local: http://localhost:5173/
```

### 6. Tarayıcıda Açın
```
http://localhost:5173
```

**Giriş Bilgileri:**
| Rol | E-posta | Şifre |
|-----|---------|-------|
| Admin | admin@islerkitabevi.com | test1234 |
| Manager | manager@islerkitabevi.com | admin123 |

---

## 🌐 API Endpoint Listesi

### Kimlik Doğrulama
| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/auth/login` | POST | Kullanıcı girişi |
| `/auth/me` | GET | Mevcut kullanıcı bilgisi |
| `/auth/change-password` | POST | Şifre değiştirme |

### Şubeler
| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/branches` | GET | Tüm şubeleri listele |
| `/branches/:id` | GET | Şube detayı |
| `/branches/:id/sales` | GET | Şube satışları |
| `/branches/:id/expenses` | GET | Şube giderleri |
| `/branches/meta/districts` | GET | İlçe listesi |

### Analitik
| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/analytics/kpis` | GET | Dashboard KPI verileri |
| `/analytics/monthly-trend` | GET | Aylık trend verisi |
| `/analytics/revenue-expense` | GET | Gelir/gider karşılaştırması |
| `/analytics/margin-by-branch` | GET | Şube marj verileri |
| `/analytics/branch-comparison` | GET | Şube karşılaştırması |
| `/analytics/risk` | GET | Risk analizi |
| `/analytics/opportunity` | GET | Fırsat analizi |
| `/analytics/categories` | GET | Kategori dağılımı |
| `/analytics/alerts` | GET | Gider uyarıları (Trigger) |

### Senaryo Simülatörü
| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/scenarios/simulate` | POST | Senaryo simülasyonu |
| `/scenarios/presets` | GET | Hazır senaryolar |
| `/scenarios/branch/:id` | GET | Şube mevcut verileri |

### Harita
| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/map/branches` | GET | Şube konumları (GeoJSON) |
| `/map/districts` | GET | İlçe sınırları (GeoJSON) |
| `/map/heatmap-data` | GET | Isı haritası verileri |
| `/map/opportunity-overlay` | GET | Fırsat haritası |

### Tahminleme
| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/forecast/predict` | GET | Satış tahmini |
| `/forecast/seasonality` | GET | Mevsimsellik analizi |

### Dışa Aktarma
| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/export/pdf` | GET | PDF rapor indirme |
| `/export/csv` | GET | CSV veri indirme |

### Kullanıcı Yönetimi
| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/users` | GET | Kullanıcı listesi |
| `/users` | POST | Kullanıcı oluştur |
| `/users/:id` | PUT | Kullanıcı güncelle |
| `/users/:id` | DELETE | Kullanıcı sil |

### Grup Kararları
| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/decisions/notes` | GET/POST | Karar notları |
| `/decisions/notes/:id/comments` | GET/POST | Yorumlar |
| `/decisions/notes/:id/vote` | POST | Oylama |

---

## 🗄️ ER Diyagramı

ER diyagramı için `docs/ER_DIAGRAM.png` dosyasına bakınız.

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   users     │       │  branches   │       │   sales     │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │◄──────│ branch_id   │
│ name        │       │ name        │       │ id (PK)     │
│ email       │       │ district    │       │ date        │
│ password    │       │ latitude    │       │ category    │
│ role        │       │ longitude   │       │ quantity    │
└─────────────┘       │ status      │       │ revenue     │
                      └─────────────┘       └─────────────┘
                            │
                            │
                      ┌─────▼───────┐       ┌─────────────────┐
                      │  expenses   │       │ expense_alerts  │
                      ├─────────────┤       ├─────────────────┤
                      │ branch_id   │       │ branch_id (FK)  │
                      │ id (PK)     │──────►│ id (PK)         │
                      │ date        │       │ expense_type    │
                      │ expense_type│       │ amount          │
                      │ amount      │       │ alert_message   │
                      └─────────────┘       └─────────────────┘
```

---

## 📁 Proje Yapısı

```
Isler-sube-yonetimi/
├── backend/
│   ├── database/
│   │   ├── schema.sql          # Tablo tanımları
│   │   ├── views.sql           # SQL görünümleri
│   │   ├── seed.sql            # Örnek veriler
│   │   └── triggers.sql        # Gider uyarı trigger'ı
│   ├── src/
│   │   ├── config/             # Veritabanı config
│   │   ├── middleware/         # Auth middleware
│   │   ├── routes/             # API rotaları
│   │   ├── services/           # İş mantığı
│   │   └── app.js              # Express app
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/         # React bileşenleri
│   │   ├── pages/              # Sayfa bileşenleri
│   │   ├── context/            # Auth context
│   │   ├── hooks/              # Custom hooks
│   │   └── services/           # API servisleri
│   ├── .env.example
│   └── package.json
│
├── docs/
│   └── ER_DIAGRAM.png          # ER Diyagramı
│
└── README.md
```

---

## 🔧 Ortam Değişkenleri

`.env.example` dosyasını `.env` olarak kopyalayın ve değerleri düzenleyin.

**Backend (.env):**
```env
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=isler_kitabevi
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:5173
```

---

## 👤 Geliştirici

**Kerem Ören** - 2022469067

Dokuz Eylül Üniversitesi  
Yönetim Bilişim Sistemleri Bölümü  
YBS 3015 - Sunucu Taraflı Programlama

---

## 📝 Lisans

MIT License
