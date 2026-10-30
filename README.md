# Silo - Envanter Yönetim Sistemi

**Silo**, laboratuvar kemirgen yemlerinin (**SAFE® A03** ve **SAFE® A04**) depolama ve tüketim süreçlerini yüksek doğrulukla takip etmek için tasarlanmış modern, sunucusuz (serverless) bir envanter yönetim panelidir.

Stok seviyeleri için gerçek zamanlı **"Tek Doğruluk Kaynağı" (Single Source of Truth)**, kapsamlı işlem günlüğü, haftalık/günlük tüketim analizi ve indirilebilir PDF raporlama sunar.

## 🚀 Özellikler

- **Çoklu Yem Takibi (SAFE® A03 & SAFE® A04):**
    - **SAFE® A03** (*Üreme & Büyüme Yemi — 10 kg/Paket*) ve **SAFE® A04** (*Bakım & İdame Yemi — 10 kg/Paket*) stoklarının yan yana bağımsız kartlarda anlık takibi.
    - Yem başına **10 paket ve altı (`≤ 100 kg`)** seviyesinde otomatik **"Stok Az"**, üzerinde ise **"Optimal Seviye"** görsel durum bildirimi.
    - Eski **Optima (4 kg)** işlem kayıtlarının veri kaybı olmadan geçmiş hareketlerde, grafiklerde ve raporlarda korunması.
- **Atomik Stok Kontrolü ve Doğrulama:**
    - **Stok Giriş (`IN`) & Paket Çıkışı (`OUT`):** Yem seçimi ve paket adediyle hızlı teslimat alma / stoktan düşme ve canlı ağırlık (`kg`) hesaplaması.
    - **Race Condition Engelleme:** Stok çıkış (`OUT`) işlemlerinde ürün bazlı MongoDB atomik bakiye kontrolü (`totalStock: { $gte: amount }`) ile negatif stok oluşumu engellenir.
    - **Upsert Optimizasyonu & Zod v4 Validasyonu:** Giriş işlemlerinde `{ upsert: true }` ile tek sorguda güncelleme ve sunucu tarafında Zod şema doğrulaması.
- **İnteraktif Tüketim Grafiği & PDF Raporlama:**
    - Son 7 haftalık yem tüketimini gösteren, geçmiş haftalarda gezinilebilir ve üzerine tıklandığında **günlük detaya (drill-down)** inebilen sütun grafiği.
    - Grafik üzerinde **`Tümü | SAFE® A03 | SAFE® A04`** filtreleme ve ürün bazlı yığın (stacked) renk gösterimi.
    - Türkçe karakter destekli (`Tinos` font gömülü) `jsPDF` + `jspdf-autotable` ile ürün kırılımlı **A4 Yem Tüketim Raporu (PDF)** indirme.
- **Güvenli Oturum (Apex SSO) & İşlem Şeffaflığı:**
    - `wildtype.app` (`Apex_db`) merkezi kimlik doğrulamasına entegre `interapp_session` JWT çerez ve uygulama yetki kontrolü.
    - Her stok hareketinin kullanıcı adı, yem türü, paket/kg miktarı ve zaman damgasıyla silinemez `transactions` koleksiyonuna kaydedilmesi.

## 🛠️ Teknolojiler

### Frontend
- **Framework:** [React 19](https://react.dev/) + [React Router v7](https://reactrouter.com/)
- **Build Tool:** [Vite 7](https://vite.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **PDF Raporlama:** [jsPDF](https://github.com/parallax/jsPDF) & [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable)

### Backend
- **Runtime:** [Vercel Serverless Functions](https://vercel.com/docs/functions) (Node.js ESM)
- **Database:** [MongoDB](https://www.mongodb.com/) (`Silo_db` & `Apex_db`)
- **Validation:** [Zod v4](https://zod.dev/)

## 📦 Kurulum

Projeyi yerel ortamınızda çalıştırmak için:

### Gereksinimler
- Node.js (v20.19+ veya v22.12+)
- MongoDB Veritabanı

### Adımlar

1. **Repoyu klonlayın:**
   ```bash
   git clone https://github.com/ogzhnbygl/Silo.git
   cd Silo
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **Çevresel Değişkenleri Ayarlayın:**
   `.env` dosyasını oluşturun:
   ```env
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=...
   ```

4. **Geliştirme Sunucusunu Başlatın:**
   ```bash
   npm run dev
   ```
   Uygulama `http://localhost:5173` adresinde çalışacaktır (`vite.config.js` içerisindeki özel ara katman `/api/*` uçlarını yerel ortamda da çalıştırır).

## 📂 Proje Yapısı

- `/src`: React bileşenleri (`Dashboard`, `ProductStockCard`, `TransactionModal`, `ConsumptionChart`, `ActivityList`), Auth context ve PDF üretici yardımcılar.
- `/api`: Vercel Serverless API uçları (`/api/inventory`, `/api/auth/session`).
- `/lib`: Hem sunucu hem istemci tarafından paylaşılan ürün sabitleri (`products.js`), MongoDB bağlantısı ve JWT doğrulama yardımcıları.
- `/public`: Statik dosyalar ve PDF raporlamada kullanılan `Tinos` font dosyaları.

Detaylı teknik bilgi için [TECHNICAL.md](./TECHNICAL.md) ve ürün vizyonu için [BLUEPRINT.md](./BLUEPRINT.md) dosyalarına bakabilirsiniz.

## 📜 Lisans

Bu proje özel mülkiyettir. İzinsiz kopyalanması ve dağıtılması yasaktır.
