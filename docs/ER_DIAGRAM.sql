-- İşler Kitabevi ER Diyagramı
-- ASCII Art representation

/*
================================================================================
                        İŞLER KİTABEVİ - ER DİYAGRAMI
================================================================================

┌─────────────────────────────────────────────────────────────────────────────┐
│                              ENTITY RELATIONSHIP DIAGRAM                     │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐
    │     USERS       │
    ├─────────────────┤
    │ id (PK)         │
    │ name            │
    │ email (UNIQUE)  │
    │ password        │
    │ role (ENUM)     │
    │ district        │
    │ branch_id (FK)  │──────────────────────────────────────────┐
    │ created_at      │                                          │
    └─────────────────┘                                          │
                                                                 │
                                                                 │
    ┌─────────────────┐         1:N          ┌─────────────────┐ │
    │   BRANCHES      │◄─────────────────────│     SALES       │ │
    ├─────────────────┤                      ├─────────────────┤ │
    │ id (PK)         │                      │ id (PK)         │ │
    │ name            │                      │ branch_id (FK)  │─┘
    │ district        │                      │ date            │
    │ latitude        │                      │ category (ENUM) │
    │ longitude       │                      │ quantity        │
    │ status (ENUM)   │                      │ revenue         │
    │ yearly_revenue  │                      │ created_at      │
    │ created_at      │                      └─────────────────┘
    └────────┬────────┘
             │
             │ 1:N
             │
             ▼
    ┌─────────────────┐         TRIGGER      ┌─────────────────────┐
    │   EXPENSES      │─────────────────────►│  EXPENSE_ALERTS     │
    ├─────────────────┤    (>50.000 TL)      ├─────────────────────┤
    │ id (PK)         │                      │ id (PK)             │
    │ branch_id (FK)  │                      │ branch_id (FK)      │
    │ date            │                      │ expense_type        │
    │ expense_type    │                      │ amount              │
    │ amount          │                      │ threshold_exceeded  │
    │ description     │                      │ alert_message       │
    │ created_at      │                      │ is_resolved         │
    └─────────────────┘                      │ created_at          │
                                             └─────────────────────┘


    ┌─────────────────┐
    │ DECISION_NOTES  │
    ├─────────────────┤         1:N          ┌─────────────────────┐
    │ id (PK)         │◄─────────────────────│ DECISION_COMMENTS   │
    │ user_id (FK)    │                      ├─────────────────────┤
    │ branch_id (FK)  │                      │ id (PK)             │
    │ title           │                      │ note_id (FK)        │
    │ content         │                      │ user_id (FK)        │
    │ priority (ENUM) │                      │ content             │
    │ status (ENUM)   │                      │ created_at          │
    │ created_at      │                      └─────────────────────┘
    └─────────┬───────┘
              │
              │ 1:N
              ▼
    ┌─────────────────────┐
    │  DECISION_VOTES     │
    ├─────────────────────┤
    │ id (PK)             │
    │ note_id (FK)        │
    │ user_id (FK)        │
    │ vote (ENUM)         │
    │ created_at          │
    └─────────────────────┘


    ┌─────────────────────────┐
    │  POPULATION_DISTRICTS   │
    ├─────────────────────────┤
    │ id (PK)                 │
    │ district                │
    │ population              │
    │ density                 │
    │ latitude                │
    │ longitude               │
    └─────────────────────────┘


================================================================================
                              İLİŞKİ ÖZETİ
================================================================================

┌──────────────────┬──────────────────┬─────────────┬─────────────────────────┐
│ TABLO 1          │ TABLO 2          │ İLİŞKİ      │ AÇIKLAMA                │
├──────────────────┼──────────────────┼─────────────┼─────────────────────────┤
│ branches         │ sales            │ 1:N         │ Bir şubenin çok satışı  │
│ branches         │ expenses         │ 1:N         │ Bir şubenin çok gideri  │
│ branches         │ users            │ 1:N         │ Şubeye atanmış manager  │
│ branches         │ expense_alerts   │ 1:N         │ Şube gider uyarıları    │
│ branches         │ decision_notes   │ 1:N         │ Şube karar notları      │
│ users            │ decision_notes   │ 1:N         │ Kullanıcı notları       │
│ users            │ decision_comments│ 1:N         │ Kullanıcı yorumları     │
│ users            │ decision_votes   │ 1:N         │ Kullanıcı oyları        │
│ decision_notes   │ decision_comments│ 1:N         │ Not yorumları           │
│ decision_notes   │ decision_votes   │ 1:N         │ Not oyları              │
│ expenses         │ expense_alerts   │ TRIGGER     │ 50K+ giderde uyarı      │
└──────────────────┴──────────────────┴─────────────┴─────────────────────────┘

================================================================================
                              ENUM DEĞERLERİ
================================================================================

users.role:
  - 'Admin'
  - 'Manager'
  - 'Viewer'

branches.status:
  - 'Active'
  - 'Inactive'

sales.category:
  - 'Books'
  - 'Stationery'
  - 'Kids'
  - 'Gifts'
  - 'OnlineOrders'

expenses.expense_type:
  - 'Rent'
  - 'Salary'
  - 'Utilities'
  - 'Marketing'
  - 'Inventory'
  - 'Maintenance'
  - 'Other'

decision_notes.priority:
  - 'low'
  - 'medium'
  - 'high'
  - 'critical'

decision_notes.status:
  - 'draft'
  - 'pending'
  - 'approved'
  - 'rejected'

decision_votes.vote:
  - 'approve'
  - 'reject'
  - 'neutral'

================================================================================
*/
