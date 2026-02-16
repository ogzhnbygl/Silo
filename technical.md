# Silo - Teknik Dokümantasyon

Bu doküman, Silo projesinin teknik mimarisini, veritabanı yapısını ve API referanslarını detaylandırır.

## 🏗️ Mimari Genel Bakış

Silo, karmaşık olmayan ancak kritik veri bütünlüğü gerektiren bir envanter sistemidir.

- **Frontend:** React 19 + Vite.
- **Backend:** Node.js (Vercel Serverless Functions).
- **Veritabanı:** MongoDB. Singleton (Tekil) kayıt yapısı ve Transaction Log (İşlem Günlüğü) modeli kullanılır.

## 📂 Dizin Yapısı

```
Silo/
├── api/                # Backend API (Vercel Serverless Functions)
│   ├── inventory.js    # Stok işlemleri (GET, POST)
│   └── lib/            # Auth ve DB yardımcıları
├── src/                # Frontend Kaynak Kodları
│   ├── components/     # UI Bileşenleri (Dashboard, Forms)
│   ├── lib/            # Yardımcı Fonksiyonlar
│   └── App.jsx         # Ana Uygulama
└── public/             # Statik Dosyalar
```

## 🗄️ Veritabanı Şeması

### Koleksiyon: `inventory_stats`
Sistemin "anı" temsil eden, tek bir dokümandan oluşan koleksiyondur.
- **Anahtar:** `_id: "main"`
- **Alanlar:**
    - `totalStock`: `number` (Toplam ürün/paket sayısı)
    - `totalWeight`: `number` (Toplam ağırlık kg)

### Koleksiyon: `transactions`
Her envanter değişikliğinin (Log) saklandığı koleksiyondur.
- **Alanlar:**
    - `type`: `"IN" | "OUT"`
    - `amount`: `number`
    - `weight`: `number`
    - `user`: `string` (İşlemi yapan kullanıcı)
    - `date`: `Date`
    - `details`: `string` (Açıklama)

## 🔌 API Referansı

### `/api/inventory`

#### GET
Mevcut envanter istatistiklerini ve son işlem kayıtlarını getirir.
- **Yanıt:** `{ stats: {...}, recentActivity: [...] }`

#### POST
Bir envanter işlemi (Stok GİRİŞ veya Stok ÇIKIŞ) gerçekleştirir.
- **Body:** `{ type: "IN"|"OUT", amount: 10, weightPerPkg: 4 }`
- **İşlem:**
    1. Auth kontrolü yapılır.
    2. Stok yeterliliği (ÇIKIŞ için) kontrol edilir.
    3. `inventory_stats` güncellenir.
    4. `transactions` koleksiyonuna kayıt atılır.

## 🔐 Güvenlik

- **Auth:** Apex ile paylaşılan JWT tabanlı oturum.
- **Doğrulama:** Backend tarafında işlem öncesi stok kontrolü (Race condition yönetimi için MongoDB atomik operatörleri kullanılır).
