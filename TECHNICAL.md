# Silo - Kapsamlı Teknik Dokümantasyon

Bu doküman, **Silo** envanter yönetim sisteminin teknik mimarisini, veri modellerini, atomik veritabanı işlemlerini, API uç noktalarını, istemci bileşen hiyerarşisini ve güvenlik katmanlarını derinlemesine açıklar.

---

## 🏛️ Mimari ve Ekosistem Rolü

Silo, Antigravity ekosistemi içerisinde bir **"Spoke"** (uydu uygulama) olarak çalışır. Kimlik ve yetkilendirme doğrulaması merkezi **"Hub"** olan **Apex** (`wildtype.app`) üzerinden gerçekleştirilirken; envanter ve stok hareketleri Silo'ya tahsis edilmiş izole veritabanı (`Silo_db`) üzerinde saklanır.

### Hub & Spoke Entegrasyon ve Veri Akış Şeması

```mermaid
flowchart TD
    subgraph ApexHub["Apex Hub (wildtype.app)"]
        ApexAuth["Apex Auth / Login"]
        ApexDB[("MongoDB: Apex_db<br/>users koleksiyonu")]
    end

    subgraph Client["İstemci Katmanı (Tarayıcı)"]
        Browser["React 19 SPA (Vite 7)"]
        CookieStorage["HttpOnly Cookie:<br/>interapp_session"]
    end

    subgraph SiloSpoke["Silo Spoke (silo.wildtype.app)"]
        VercelGateway["Vercel Serverless Gateway"]
        AuthMiddleware["verifyAuthWithStatus (HMAC-SHA256)"]
        API_Inventory["/api/inventory (GET & POST)"]
        API_Session["/api/auth/session (GET & DELETE)"]
        PDF_Engine["jsPDF Engine (Client VFS)"]
    end

    subgraph SiloStorage["Veri Depolama Katmanı"]
        SiloDB[("MongoDB: Silo_db")]
        Coll_Stats[("inventory_stats")]
        Coll_Tx[("transactions")]
    end

    ApexAuth -->|Oturum Başlatma| CookieStorage
    Browser -->|API İsteği + Cookie| VercelGateway
    VercelGateway --> AuthMiddleware
    AuthMiddleware -->|Kullanıcı & Apps Yetki Kontrolü| ApexDB
    AuthMiddleware -->|Yetki Onayı| API_Inventory
    AuthMiddleware -->|Yetki Onayı| API_Session
    API_Inventory -->|Atomik Güncelleme & Agregasyon| SiloDB
    SiloDB --> Coll_Stats
    SiloDB --> Coll_Tx
    API_Inventory -->|Rapor Verisi| PDF_Engine
```

---

## 📂 Derinlemesine Dizin Yapısı ve Modül Sorumlulukları

```text
/Users/oguzhan/Antigravity/Silo/
├── api/                                    # Vercel Serverless İşlevleri (Node.js ESM)
│   ├── auth/
│   │   └── session.js                      # GET: Kullanıcı oturumunu doğrular. DELETE/POST: interapp_session çerezini temizler.
│   ├── lib/
│   │   └── auth.js                         # verifyUser: Silo iznini denetleyen API ara katmanı; yetkisiz ise 401/403 fırlatır.
│   └── inventory.js                        # GET: Stok, hareketler ve haftalık agregasyon. POST: Zod doğrulamalı atomik stok değişimi.
├── lib/                                    # İstemci & Sunucu Tarafından Paylaşılan Çekirdek Modüller
│   ├── auth.js                             # verifyToken (HMAC-SHA256), timingSafeEqual, hasRequiredAppAccess, clearSessionCookie.
│   ├── mongodb.js                          # MongoClient singleton bağlantı havuzu, isProdEnv, getDbName, getSessionCookieName.
│   └── products.js                         # SAFE A03, SAFE A04 ve eski OPTIMA ürün sabitleri ve getProductInfo çözümleyicisi.
├── public/                                 # Statik Varlıklar
│   ├── Tinos-Bold.ttf                      # jsPDF için gömülebilir kalın Türkçe serif font.
│   ├── Tinos-Regular.ttf                   # jsPDF için gömülebilir normal Türkçe serif font.
│   └── favicon.ico                         # Uygulama sekme ikonu.
├── src/                                    # Frontend Kaynak Dosyaları (React 19)
│   ├── assets/                             # Statik grafikler.
│   ├── components/                         # React Arayüz Bileşenleri
│   │   ├── ActionCard.jsx                  # Büyük tıklanabilir aksiyon kartları ("Teslimat Al", "Paket Çıkışı").
│   │   ├── ActivityList.jsx                # Son 10 veya tüm depo hareketlerini listeleyen, ürün rozetli bileşen.
│   │   ├── ConsumptionChart.jsx            # 7 haftalık gezintili, ürün filtreli, drill-down günlük detaya inebilen sütun grafiği.
│   │   ├── Dashboard.jsx                   # Veri çekme döngüsü, hata durumları ve modal/grafik koordinasyonunu yöneten ana sayfa.
│   │   ├── Layout.jsx                      # Apex gezinme butonunu, test ortamı etiketini ve kullanıcı bilgisini barındıran üst şablon.
│   │   ├── ProductStockCard.jsx            # SAFE A03 ve SAFE A04 için paket sayısı, kilogram ve kritik stok rozetini gösteren kart.
│   │   └── TransactionModal.jsx            # Native <dialog> öğesini kullanan, erişilebilir, klavye/light-dismiss destekli işlem penceresi.
│   ├── context/
│   │   └── AuthContext.jsx                 # Oturum doğrulama (`/api/auth/session`), Apex yönlendirmeleri ve oturum kapatma state'i.
│   ├── utils/
│   │   └── pdfGenerator.js                 # ArrayBuffer üzerinden Tinos fontlarını VFS'e ekleyip A4 PDF raporu oluşturan motor.
│   ├── App.jsx                             # React Router v7 yönlendirme tanımları.
│   ├── index.css                           # Tailwind CSS taban direktifleri ve özel modal animasyonları.
│   └── main.jsx                            # React root montajı ve yerel geliştirme fetch interceptor'ı.
├── vercel.json                             # SPA yönlendirmeleri için rewrites kuralı (/((?!api/|.*\\..*).*) -> /index.html).
└── vite.config.js                          # Vite konfigürasyonu ve yerel ortamda Serverless API'leri simüle eden middleware.
```

---

## 🗄️ Veritabanı ve Şema Spesifikasyonu

Silo, MongoDB veritabanı üzerinde çalışır. Üretim ortamında `Silo_db`, test/önizleme ortamlarında `Silo_test_db` kullanılır. Merkezi kullanıcı doğrulaması ise `Apex_db` (veya `Apex_test_db`) üzerinden gerçekleştirilir.

### 1. `inventory_stats` Koleksiyonu
Aktif yemlerin güncel stok adetlerini tutan tekil durum koleksiyonudur.

```json
{
  "_id": "A03",
  "productCode": "A03",
  "weightPerPkg": 10,
  "totalStock": 24,
  "totalWeight": 240
}
```

#### Alan Tanımları
| Alan Adı | Tip | Zorunlu | Açıklama |
| :--- | :--- | :--- | :--- |
| `_id` | `string` | Evet | Ürün tanımlayıcısı (`"A03"` veya `"A04"`). |
| `productCode` | `string` | Evet | Ürün kodu (`"A03"` veya `"A04"`). |
| `weightPerPkg` | `number` | Evet | Paket başına düşen net ağırlık (`10` kg). |
| `totalStock` | `number` | Evet | Depodaki mevcut toplam paket adedi (`>= 0`). |
| `totalWeight` | `number` | Evet | Depodaki toplam ağırlık (`totalStock * weightPerPkg`). |

> [!NOTE]
> Eski sürümlerde kullanılan tekil `_id: "main"` dokümanı silinmemiş, geriye dönük veri arşiv bütünlüğü için olduğu gibi korunmuştur.

---

### 2. `transactions` Koleksiyonu
Depoya giren veya depodan çıkan tüm hareketlerin zaman damgasıyla tutulduğu, değiştirilemez denetim (audit log) koleksiyonudur.

```json
{
  "_id": { "$oid": "665c829e2f491c10d8a514b2" },
  "type": "OUT",
  "product": "A03",
  "productName": "SAFE® A03",
  "weightPerPkg": 10,
  "amount": 2,
  "weight": 20,
  "user": "oguzhan",
  "date": { "$date": "2026-10-31T09:15:00.000Z" },
  "details": "Paket Çıkışı"
}
```

#### Alan Tanımları
| Alan Adı | Tip | Zorunlu | Açıklama |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Otomatik | MongoDB birincil anahtarı. |
| `type` | `string` | Evet | İşlem yönü: `"IN"` (Teslimat Al) veya `"OUT"` (Paket Çıkışı). |
| `product` | `string` | Evet | Ürün kodu: `"A03"`, `"A04"` *(Eski kayıtlarda `null` olabilir)*. |
| `productName` | `string` | Evet | Ürün ticari adı: `"SAFE® A03"`, `"SAFE® A04"` *(Eski kayıtlarda otomatik `"Optima 4kg"`)*. |
| `weightPerPkg` | `number` | Evet | Paket ağırlığı: A03 ve A04 için `10`, eski Optima için `4`. |
| `amount` | `number` | Evet | İşleme konu olan tam sayı paket miktarı. |
| `weight` | `number` | Evet | Toplam ağırlık değişimi (`amount * weightPerPkg`). |
| `user` | `string` | Evet | İşlemi gerçekleştiren kullanıcının adı veya e-posta öneki. |
| `date` | `Date` | Evet | İşlemin gerçekleştirildiği UTC zaman damgası. |
| `details` | `string` | Evet | İşlem detayı: `"Teslimat Alındı"` veya `"Paket Çıkışı"`. |

#### İndeks Önerileri
- `db.transactions.createIndex({ date: -1 })` -> Son hareketlerin hızlı çekilmesi için.
- `db.transactions.createIndex({ type: 1, date: 1 })` -> Haftalık agregasyon filtreleri için.

---

### 3. `Apex_db.users` Koleksiyonu (Merkezi Kimlik)
Apex tarafından yönetilen, Silo'nun sadece okuma yaptığı kullanıcı koleksiyonudur.

| Alan Adı | Tip | Açıklama |
| :--- | :--- | :--- |
| `email` | `string` | Kullanıcı e-posta adresi (tekil). |
| `role` | `string` | `"admin"` veya `"user"`. Admin kullanıcılar tüm Spoke uygulamalara yetkilidir. |
| `apps` | `Array<string>` | Kullanıcının erişebileceği uygulamalar dizisi (örn: `["silo", "circa"]`). |
| `name` | `string` | Kullanıcının tam adı. |

---

## 🔌 Kapsamlı API Referansı

### 1. Envanter Yönetimi (`/api/inventory`)

Tüm isteklerde `interapp_session` çerezi zorunludur.

#### `GET /api/inventory`
Depo özetini, son hareketleri ve haftalık tüketim analizini getirir.

- **URL:** `/api/inventory`
- **Metot:** `GET`
- **Yetkilendirme:** Oturum açmış ve `silo` iznine sahip kullanıcı.
- **Sorgu Parametreleri (Query Parameters):**
  - `all` (`string`, opsiyonel): `"true"` ise son 10 yerine koleksiyondaki tüm hareketleri döner.
  - `weekOffset` (`number`, opsiyonel): Tüketim grafiğinde geçmiş 7 haftalık bloklar halinde geriye gitmeyi sağlar (`0` = güncel son 7 hafta, `1` = 7-14 hafta öncesi vb.).
  - `report` (`string`, opsiyonel): `"true"` ise veritabanındaki en eski `OUT` işleminden bugüne kadar olan tüm haftalık tüketim verisini döner (PDF raporu için).

##### Başarılı Yanıt (HTTP 200 OK)
```json
{
  "stats": {
    "totalStock": 38,
    "totalWeight": 380,
    "products": {
      "A03": {
        "id": "A03",
        "name": "SAFE® A03",
        "subtitle": "Üreme & Büyüme Yemi (Breeding)",
        "weightPerPkg": 10,
        "lowStockThreshold": 10,
        "totalStock": 18,
        "totalWeight": 180
      },
      "A04": {
        "id": "A04",
        "name": "SAFE® A04",
        "subtitle": "Bakım & İdame Yemi (Maintenance)",
        "weightPerPkg": 10,
        "lowStockThreshold": 10,
        "totalStock": 20,
        "totalWeight": 200
      }
    }
  },
  "recentActivity": [
    {
      "_id": "665c829e2f491c10d8a514b2",
      "type": "OUT",
      "product": "A03",
      "productName": "SAFE® A03",
      "weightPerPkg": 10,
      "amount": 2,
      "weight": 20,
      "user": "oguzhan",
      "date": "2026-10-31T09:15:00.000Z",
      "details": "Paket Çıkışı"
    }
  ],
  "weeklyConsumption": [
    {
      "weekIndex": 0,
      "weekNum": 44,
      "weekLabel": "44. Hafta",
      "dateRangeLabel": "26 - 1 Kas 2026",
      "weight": 40,
      "packages": 4,
      "byProduct": {
        "A03": { "weight": 20, "packages": 2 },
        "A04": { "weight": 20, "packages": 2 },
        "OPTIMA": { "weight": 0, "packages": 0 }
      },
      "days": [
        {
          "date": "2026-10-26",
          "dayName": "Pzt",
          "weight": 20,
          "packages": 2,
          "byProduct": {
            "A03": { "weight": 20, "packages": 2 },
            "A04": { "weight": 0, "packages": 0 },
            "OPTIMA": { "weight": 0, "packages": 0 }
          }
        }
      ]
    }
  ]
}
```

---

#### `POST /api/inventory`
Yeni bir stok girişi (`IN`) veya paket çıkışı (`OUT`) gerçekleştirir.

- **URL:** `/api/inventory`
- **Metot:** `POST`
- **İçerik Tipi:** `application/json`
- **Zod v4 İstek Doğrulama Şeması:**
```javascript
const inventoryPostSchema = z.object({
    type: z.enum(['IN', 'OUT']),
    product: z.enum(['A03', 'A04'], {
        message: 'Geçerli bir yem türü seçilmelidir (SAFE® A03 veya SAFE® A04).'
    }),
    amount: z.number().int().positive('Miktar pozitif bir tam sayı olmalıdır.')
});
```

##### İstek Gövdesi (Payload Örneği)
```json
{
  "type": "OUT",
  "product": "A03",
  "amount": 3
}
```

##### Atomik Veritabanı İşlemleri ve Concurrency Mantığı
1. **Giriş İşlemi (`IN`):**
   ```javascript
   await statsCollection.updateOne(
       { _id: product },
       {
           $inc: { totalStock: amount, totalWeight: totalWeightChange },
           $set: { productCode: product, weightPerPkg: pkgWeight }
       },
       { upsert: true }
   );
   ```
   *Önceden kayıt olmasa dahi tek sorguda oluşturulur veya artırılır.*

2. **Çıkış İşlemi (`OUT`):**
   ```javascript
   const result = await statsCollection.updateOne(
       { _id: product, totalStock: { $gte: amount } },
       {
           $inc: { totalStock: -amount, totalWeight: -totalWeightChange }
       }
   );
   if (result.modifiedCount === 0) {
       return res.status(400).json({ error: `${productMeta.name} için yetersiz stok veya envanter güncellenemedi.` });
   }
   ```
   *MongoDB motor düzeyinde `totalStock: { $gte: amount }` koşulu ile atomik kilitlenme sağlanır; stok asla eksiye düşmez.*

##### Yanıt Kodları:
- `200 OK`: `{"success": true}`
- `400 Bad Request`: `{"error": "SAFE® A03 için yetersiz stok veya envanter güncellenemedi."}` veya Zod validasyon hatası.
- `401 Unauthorized`: `{"error": "Oturum bulunamadı."}`
- `403 Forbidden`: `{"error": "Bu uygulamaya erişim yetkiniz bulunmamaktadır."}`
- `405 Method Not Allowed`: GET veya POST dışında bir metot kullanıldığında.
- `500 Internal Server Error`: `{"error": "İşlem başarısız"}`

---

### 2. Oturum API'si (`/api/auth/session`)

#### `GET /api/auth/session`
İstemcinin sahip olduğu çerezi doğrular ve aktif kullanıcının temizlenmiş profil nesnesini döner.

##### Başarılı Yanıt (HTTP 200 OK)
```json
{
  "email": "laborant@wildtype.app",
  "role": "user",
  "apps": ["silo"],
  "name": "Laborant"
}
```

#### `POST` veya `DELETE /api/auth/session`
Kullanıcı oturumunu sonlandırır ve tarayıcıdaki `interapp_session` çerezinin süresini (`Max-Age=0`) sıfırlar.

##### Başarılı Yanıt (HTTP 200 OK)
```json
{
  "message": "Logged out"
}
```

---

## 🕒 Saat Dilimi ve Hafta Hesaplama Algoritması

Silo, sunucunun çalıştığı fiziksel lokasyondan bağımsız olarak tüm tüketim ve tarih gruplamalarını **`Europe/Istanbul` (UTC+3)** saat diliminde işler.

1. **Pazartesi Çapa Tarihi (Monday Anchor):**
   ```javascript
   function getIstanbulDateString(date) {
       return new Intl.DateTimeFormat('en-CA', {
           timeZone: 'Europe/Istanbul',
           year: 'numeric',
           month: '2-digit',
           day: '2-digit'
       }).format(date);
   }

   function getMondayAnchor(date) {
       const dateStr = getIstanbulDateString(date);
       const anchor = new Date(`${dateStr}T12:00:00Z`);
       const day = anchor.getUTCDay();
       const distanceToMonday = day === 0 ? 6 : day - 1;
       return new Date(anchor.getTime() - distanceToMonday * 86400000);
   }
   ```
2. **ISO Hafta Numaralandırması:**
   Perşembe gününü içeren hafta temel alınarak `getIsoWeekNumber()` fonksiyonu ile standart uluslararası hafta numarası (`1` - `53`) üretilir.

---

## 💻 Frontend Mimarisi ve Bileşenler

### 1. Sayfa Yönlendirme (Routing)
Uygulama `react-router-dom` v7 kullanır:
- `/` -> `<Layout><Dashboard /></Layout>`

### 2. Arayüz Bileşen Detayları
- **`Layout.jsx`:** Üst barda Silo marka logosu, Apex ana ekrana dönüş ikonu (`LayoutGrid`), çıkış butonu (`LogOut`) ve eğer `isPreviewHost()` doğruysa **"Test Ortamı"** rozeti sunar.
- **`ProductStockCard.jsx`:** A03 için mavi, A04 için mor tema kullanır. Mevcut stok paket adedini, toplam kg miktarını ve `totalStock <= 10` kontrolü ile dinamik `CheckCircle` / `AlertTriangle` rozetlerini render eder.
- **`TransactionModal.jsx`:**
  - Modern web standartlarına tam uyumlu yerleşik `<dialog>` öğesi üzerine kurulmuştur.
  - `dialog.showModal()` ve `dialog.close()` metotları ile senkronize çalışır.
  - Progressive enhancement: Yeni nesil tarayıcılarda `closedby="any"` özniteliği kullanılırken; desteklemeyen tarayıcılarda `pointerdown`/`pointerup` koordinat kontrolü ile modal dışına tıklanarak kapatma (light dismiss) sağlanır.
  - Erişilebilirlik (a11y): Ekran okuyucular için `<fieldset>`, `<legend>`, `aria-labelledby`, `role="status"` ve `aria-live="polite"` etiketleriyle donatılmıştır.
- **`ConsumptionChart.jsx`:**
  - 7 haftalık tüketimi sütun grafiği olarak çizer.
  - `Tümü`, `SAFE® A03`, `SAFE® A04` filtreleri barındırır.
  - Tıklanan haftanın 7 günlük tüketim dökümünü (`days`) animasyonlu olarak açan drill-down yeteneğine sahiptir.
- **`pdfGenerator.js`:**
  - `jsPDF` ve `jspdf-autotable` kütüphanelerini yönetir.
  - `/public/Tinos-Regular.ttf` ve `/public/Tinos-Bold.ttf` fontlarını `fetch -> arrayBuffer -> btoa` adımlarıyla çalışma zamanında sanal dosya sistemine (VFS) ekler.
  - Türkçe karakter ve tescil işareti (`®`) bozulmalarını tamamen engeller.
  - Ürün bazlı mevcut stok kartlarını ve haftalık tüketim tablosunu A4 formatında dışa aktarır.

---

## ⚙️ Ortam Değişkenleri Spesifikasyonu

| Değişken Adı | Zorunlu mu? | Örnek Değer | Açıklama |
| :--- | :--- | :--- | :--- |
| `MONGODB_URI` | **Evet** | `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true` | MongoDB bağlantı dizesi. Eksikse uygulama ayağa kalkmaz. |
| `JWT_SECRET` | **Evet** | `d4e5f6...` | Apex Hub ile paylaşılan, HMAC-SHA256 imzası için ortak gizli anahtar. |
| `VERCEL_ENV` | Hayır | `production` / `preview` / `development` | Vercel tarafından otomatik sağlanan ortam bilgisi. |
| `FORCE_PROD_DB` | Hayır | `true` / `false` | Test ortamında bile gerçek `Silo_db` ve `interapp_session` kullanımını zorlamak için. |
| `NODE_ENV` | Hayır | `development` / `production` | Yerel geliştirme ve derleme ortamı belirteci. |

---

## 🛡️ Güvenlik ve Doğrulama Mekanizmaları

1. **HMAC-SHA256 Token Doğrulaması:**
   Gelen JWT jetonunun başlık (header) algoritması kesinlikle `HS256` olmalıdır. İmza karşılaştırması `crypto.timingSafeEqual` ile yapılır; bu sayede zamanlama analizi ile imza kaba kuvvet saldırıları (brute-force timing attacks) tamamen engellenir.
2. **Çerez Güvenliği (clearSessionCookie):**
   Oturum sonlandırılırken `wildtype.app` ve alt etki alanları (`.wildtype.app`) için `Domain`, `HttpOnly`, `SameSite=Lax` ve `Secure` nitelikleri ile çerez güvenle temizlenir.
3. **Local Dev Bearer Bypass:**
   Yalnızca yerel geliştirme modunda (`NODE_ENV === 'development'` ve `VERCEL_ENV` tanımsızken) `Authorization: Bearer <email>` başlığı ile oturum simülasyonu yapılabilir. Üretim veya önizleme ortamlarında bu mekanizma tamamen devre dışıdır.
4. **Zod v4 Tip Sıkılığı:**
   Kullanıcıdan gelen miktar değerleri float, negatif veya sıfır olamaz (`z.number().int().positive()`). Yem türü yalnızca `"A03"` veya `"A04"` olabilir.
