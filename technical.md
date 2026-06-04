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

## 🔌 API Referansı & Rotalar

### Ön Yüz Rotaları (`react-router-dom`)
- `/` - Dashboard (Stok Giriş/Çıkış modal formları ve hızlı özet kartları)
- `/transactions` - Tüm geçmiş envanter hareketlerinin (Log) listelendiği sayfa
- `/products` - Ürün Tanımlama / Katalog Ekranı

### Sunucu API Endpoint'leri (Zod Validasyonlu)

#### Envanter API (`/api/inventory`)
- **GET `/api/inventory`**: Güncel stok istatistiklerini (`inventory_stats`) ve en son yapılan işlemleri (`transactions`) döner.
- **POST `/api/inventory`**: Yeni bir stok hareketi (GİRİŞ veya ÇIKIŞ) işler. İstek gövdesi Zod şeması ile doğrulanır (miktar ve ağırlık pozitif sayı olmalıdır).
    - **IN (Stok Giriş) Optimizasyonu:** Performansı artırmak amacıyla sunucu tarafındaki ilk `findOne` okuması kaldırılmıştır. MongoDB `updateOne` sorgusuna doğrudan `{ upsert: true }` parametresi verilerek veritabanı gidiş-dönüş süresi (RTT) yarı yarıya düşürülmüştür.
    - **OUT (Stok Çıkış) Concurrency Çözümü:** İki kullanıcının aynı anda stok düşmeye çalışması durumunda negatif stoka düşülmesini engellemek için, MongoDB güncellemesinde atomik filtreleme (`$gte` ile stok miktarı kontrolü) kullanılır. Stok yetersizse güncelleme yapılmaz ve hata döndürülür.

> [!IMPORTANT]
> **Çoklu Ürün Desteği (Katalog):** Faz 2 kapsamında yapılması planlanan, bağımsız ürün tanımlama ve her ürünün stok seviyesini ayrı ayrı izleme özelliği (Adım 5), kullanıcı kararı doğrultusunda kapsam dışı tutulmuştur.

---

## 🔐 Güvenlik ve Doğrulama

- **Token Kontrolü:** Silo API istekleri Apex `verifyUser` ara katmanı ile korunur. SSO çerezi doğrulanarak işlem yapan kullanıcının Adı ve Soyadı (`transactions` kaydına yazılmak üzere) JWT payload'undan çekilir.
- **Güvenli Rotalar:** Yetkisiz kullanıcıların doğrudan tarayıcı linki yazarak işlemlere veya Dashboard'a erişimi ön yüzde React Router data loaders ve AuthGuard koruyucuları ile kısıtlanmıştır.

