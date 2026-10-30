# Silo - Teknik Dokümantasyon

Bu doküman, Silo projesinin teknik mimarisini, ürün kataloğu yapısını, veritabanı şemasını ve API referanslarını detaylandırır.

## 🏗️ Mimari Genel Bakış

Silo, yüksek veri bütünlüğü ve hızlı operasyon için tasarlanmış sunucusuz (serverless) bir envanter sistemidir.

- **Frontend:** React 19 + Vite 7 + Tailwind CSS.
- **Backend:** Node.js ESM (Vercel Serverless Functions).
- **Veritabanı:** MongoDB (`Silo_db` envanter ve işlem verileri için, `Apex_db` merkezi kullanıcı ve yetki kontrolü için).
- **Raporlama:** İstemci tarafında `jsPDF` + `jspdf-autotable` (`Tinos` TTF font gömülü Türkçe PDF üretimi).

## 📂 Dizin Yapısı

```text
Silo/
├── api/                        # Backend API (Vercel Serverless Functions)
│   ├── auth/
│   │   └── session.js          # Aktif kullanıcı oturum kontrolü (GET)
│   ├── lib/
│   │   └── auth.js             # Silo uygulama bazlı yetki doğrulayıcı
│   └── inventory.js            # Stok durumu, tüketim analizi ve işlem API'si (GET, POST)
├── lib/                        # İstemci ve sunucu ortak modülleri
│   ├── auth.js                 # JWT imza doğrulama ve Apex_db yetki kontrolü
│   ├── mongodb.js              # MongoDB bağlantı havuzu (clientPromise)
│   └── products.js             # SAFE® A03, SAFE® A04 ve eski Optima ürün sabitleri
├── src/                        # Frontend Kaynak Kodları
│   ├── components/
│   │   ├── Dashboard.jsx       # Ana ekran ve veri yönetimi
│   │   ├── ProductStockCard.jsx# Ürün bazlı stok, kg ve kritik seviye kartı
│   │   ├── ActionCard.jsx      # Teslimat Al / Paket Çıkışı aksiyon butonları
│   │   ├── TransactionModal.jsx# Native <dialog> tabanlı yem seçmeli işlem formu
│   │   ├── ConsumptionChart.jsx# Filtreli, yığın (stacked) haftalık/günlük tüketim grafiği
│   │   ├── ActivityList.jsx    # Ürün etiketli geçmiş hareketler listesi
│   │   └── Layout.jsx          # Üst bar ve sayfa düzeni
│   ├── context/
│   │   └── AuthContext.jsx     # Oturum durumu yönetimi
│   ├── utils/
│   │   └── pdfGenerator.js     # A4 PDF tüketim raporu oluşturucu
│   └── App.jsx                 # Uygulama yönlendiricisi
└── public/                     # Statik dosyalar ve Tinos TTF fontları
```

## 📦 Ürün Tanımları (`lib/products.js`)

| Ürün Kodu | Görünen Ad | Kullanım Amacı | Paket Ağırlığı | Kritik Stok Eşiği | Durum |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `A03` | **SAFE® A03** | Üreme & Büyüme Yemi (*Breeding*) | `10 kg` | `≤ 10 Paket` (`100 kg`) | Aktif |
| `A04` | **SAFE® A04** | Bakım & İdame Yemi (*Maintenance*) | `10 kg` | `≤ 10 Paket` (`100 kg`) | Aktif |
| `OPTIMA` | **Optima 4kg** | Eski Tedarikçi Yemi | `4 kg` | - | Salt-Okunur (Geçmiş) |

## 🗄️ Veritabanı Şeması (`Silo_db`)

### Koleksiyon: `inventory_stats`
Aktif yemlerin anlık stok durumunu ürün bazlı tekil dokümanlar halinde tutar (eski `_id: "main"` dokümanı geçmiş bütünlüğü için silinmeden korunur).
- **Anahtar:** `_id: "A03" | "A04"`
- **Alanlar:**
    - `productCode`: `"A03" | "A04"`
    - `weightPerPkg`: `10` (Paket başına ağırlık, kg)
    - `totalStock`: `number` (Mevcut toplam paket sayısı)
    - `totalWeight`: `number` (Mevcut toplam ağırlık, kg)

### Koleksiyon: `transactions`
Her envanter hareketinin (Log) silinemez şekilde saklandığı koleksiyondur.
- **Alanlar:**
    - `type`: `"IN" | "OUT"`
    - `product`: `"A03" | "A04"` *(Eski kayıtlarda bu alan bulunmaz; okuma sırasında otomatik olarak `"OPTIMA"` / `4 kg` olarak yorumlanır)*
    - `productName`: `"SAFE® A03" | "SAFE® A04"`
    - `weightPerPkg`: `number` (`10`, eski kayıtlarda `4`)
    - `amount`: `number` (İşlem yapılan paket adedi)
    - `weight`: `number` (İşlem yapılan toplam ağırlık, kg)
    - `user`: `string` (İşlemi yapan kullanıcının adı)
    - `date`: `Date` (İşlem zamanı)
    - `details`: `"Teslimat Alındı" | "Paket Çıkışı"`

## 🔌 API Referansı

### 1. Envanter API (`/api/inventory`)

#### `GET /api/inventory`
Güncel ürün bazlı stok istatistiklerini, son hareketleri ve `Europe/Istanbul` saat dilimine göre hesaplanmış haftalık/günlük tüketim verilerini döner.
- **Sorgu Parametreleri (Query Params):**
    - `all=true` *(opsiyonel)*: Varsayılan son 10 işlem sınırı yerine tüm işlem geçmişini döner.
    - `weekOffset=<sayı>` *(opsiyonel)*: Tüketim grafiğinde geçmiş 7 haftalık periyotlara (`offset * 7` hafta geriye) gitmek için kullanılır.
    - `report=true` *(opsiyonel)*: PDF raporu için ilk `OUT` işleminden bugüne kadarki tüm haftaların ürün kırılımlı tüketim özetini döner.
- **Yanıt Yapısı:**
    - `stats`: `{ totalStock, totalWeight, products: { A03: {...}, A04: {...} } }`
    - `recentActivity`: Ürün bilgisi normalize edilmiş işlem listesi.
    - `weeklyConsumption`: Her hafta ve içerisindeki 7 gün (`days`) için toplam `weight`, `packages` ve `byProduct: { A03, A04, OPTIMA }` kırılımı.

#### `POST /api/inventory`
Yeni bir stok giriş (`IN`) veya çıkış (`OUT`) hareketi işler. İstek gövdesi **Zod v4** şeması ile doğrulanır:
```json
{
  "type": "IN",
  "product": "A03",
  "amount": 5
}
```
- **`IN` (Teslimat Al) Optimizasyonu:** `{ _id: product }` dokümanı üzerinde `{ upsert: true }` ve `$inc` kullanılarak ekstra okuma sorgusu olmadan tek adımda stok ve ağırlık (`amount * 10`) artırılır.
- **`OUT` (Paket Çıkışı) Concurrency Çözümü:** Aynı anda yapılan çıkış isteklerinde negatif stok oluşmasını önlemek için MongoDB sorgusunda `{ _id: product, totalStock: { $gte: amount } }` atomik filtresi kullanılır. Stok yetersizse `modifiedCount === 0` döner ve `400` hatası ile işlem reddedilir.

### 2. Oturum API (`/api/auth/session`)
- **`GET /api/auth/session`**: İstemcinin `interapp_session` çerezini doğrular ve aktif kullanıcı bilgilerini (`email`, `name`, `role`, `apps`) döner.

---

## 📊 Görselleştirme, Erişilebilirlik ve Raporlama

- **Native `<dialog>` İşlem Penceresi (`TransactionModal.jsx`):** Tarayıcı yerleşik modal katmanı (`showModal()`), arka plan kaydırma kilidi (`overscroll-behavior: contain`) ve klavye/ekran okuyucu uyumlu `<fieldset>` radyo kartları ile çalışır.
- **Haftalık & Günlük Tüketim Grafiği (`ConsumptionChart.jsx`):** `Tümü`, `SAFE® A03` ve `SAFE® A04` filtrelerini destekler. `Tümü` görünümünde ürünlerin o haftaki veya gündeki tüketim oranları yığın (stacked) sütun olarak renklendirilir.
- **PDF Raporu (`pdfGenerator.js`):** `/public/Tinos-Regular.ttf` ve `/public/Tinos-Bold.ttf` fontlarını çalışma zamanında VFS'e gömerek Türkçe karakter ve `®` sembolü kaybı olmadan **SAFE® A03**, **SAFE® A04** (ve varsa geçmiş **Optima 4kg**) sütunlarını içeren A4 tüketim raporu üretir.

---

## 🔐 Güvenlik ve Doğrulama

- **Token ve Yetki Kontrolü:** Tüm API istekleri `verifyUser` ara katmanı ile korunur. `interapp_session` JWT çerezi HMAC-SHA256 (`JWT_SECRET`) ile doğrulanır ve `Apex_db.users` koleksiyonundan kullanıcının `admin` rolü veya `apps` dizisinde `silo` yetkisi olup olmadığı kontrol edilir.
- **İstemci Koruması:** Oturumu olmayan veya yetkisiz (`403`) kullanıcılar `AuthContext` üzerinden otomatik olarak `https://wildtype.app` giriş sayfasına yönlendirilir.
