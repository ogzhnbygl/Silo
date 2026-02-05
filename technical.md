# Silo Teknik Dökümantasyon

## 1. Teknoloji Yığını

### Ön Yüz (Frontend)
- **Framework**: React 19
- **Derleme Aracı**: Vite
- **Stillendirme**: Tailwind CSS (dinamik sınıflar için `tailwind-merge` ve `clsx` ile)
- **İkonlar**: Lucide React
- **HTTP İstemcisi**: Yerel (Native) `fetch` API

### Arka Uç (Backend)
- **Çalışma Zamanı**: Node.js (Vercel Serverless Functions)
- **Yönlendirme**: `/api` dizininde dosya tabanlı yönlendirme

### Veritabanı
- **Sistem**: MongoDB
- **Sürücü**: `mongodb` (Yerel Node.js sürücüsü)

## 2. API Referansı

### Temel URL: `/api`

### 2.1 Envanter Yönetimi (`/api/inventory`)

#### GET
Mevcut envanter istatistiklerini ve son işlem kayıtlarını getirir.

- **Yanıt**: `200 OK`
  ```json
  {
    "stats": {
      "_id": "main",
      "totalStock": 150,
      "totalWeight": 600
    },
    "recentActivity": [
      {
        "type": "IN", // veya "OUT"
        "amount": 10,
        "weight": 40,
        "user": "Kullanıcı Adı",
        "date": "2023-10-27T10:00:00.000Z",
        "details": "Teslimat Alındı"
      }
    ]
  }
  ```

#### POST
Bir envanter işlemi (Stok GİRİŞ veya Stok ÇIKIŞ) gerçekleştirir.

- **Başlıklar (Headers)**:
  - `Content-Type`: `application/json`
  - `Cookie`: Geçerli oturum çerezi gereklidir (`verifyUser` ile kontrol edilir)

- **Gövde Parametreleri (Body)**:
  - `type`: `string` ("IN" veya "OUT") - **Zorunlu**
  - `amount`: `number` (Birim/paket cinsinden miktar) - **Zorunlu**
  - `weightPerPkg`: `number` (Paket başına kg ağırlığı, varsayılan: 4) - *Opsiyonel*

- **Yanıt**: `200 OK`
  ```json
  {
    "success": true
  }
  ```
- **Hatalar**:
  - `400 Bad Request`: Geçersiz miktar, yetersiz stok (ÇIKIŞ için) veya geçersiz işlem tipi.
  - `401 Unauthorized`: Kullanıcı giriş yapmamış.
  - `500 Internal Server Error`: Veritabanı işlemi başarısız.

## 3. Veritabanı Şeması

### Koleksiyon: `inventory_stats`
Toplam envanter durumunun tekil kaydını (singleton record) saklar.
- **Anahtar Doküman**: `_id: "main"`
  - `totalStock`: `number` (Toplam ürün/paket sayısı)
  - `totalWeight`: `number` (Toplam ağırlık kg)

### Koleksiyon: `transactions`
Her envanter değişikliğinin kaydını (log) saklar.
- **Doküman Yapısı**:
  - `type`: `"IN" | "OUT"`
  - `amount`: `number`
  - `weight`: `number`
  - `user`: `string` (İşlemi yapan kullanıcının adı)
  - `date`: `Date`
  - `details`: `string` (Açıklama, örn. "Teslimat Alındı")

## 4. Kimlik Doğrulama
- `./lib/auth.js` içindeki `verifyUser` aracılığıyla paylaşılan bir kimlik doğrulama mekanizması kullanır.
- İstek çerezlerinde geçerli bir oturum belirteci (JWT) bekler.
- Çözümlenen kullanıcı bilgileri (örn. `user.name`) işlem kayıtlarına eklenir.

## 5. Geliştirme & Dağıtım
- **Yerel Geliştirme**: `npm run dev` (Vite geliştirme sunucusunu başlatır).
- **Linting**: `npm run lint` (ESLint).
- **Dağıtım**: Vercel üzerinden dağıtılır. `MONGODB_URI` ortam değişkeni gerektirir.
