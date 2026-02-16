# Silo - Envanter Yönetim Sistemi

**Silo**, endüstriyel yem ve tahıl depolamanın verimli bir şekilde takibi için tasarlanmış modern, sunucusuz (serverless) bir envanter yönetim panelidir.

Stok seviyeleri için gerçek zamanlı **"Tek Doğruluk Kaynağı" (Single Source of Truth)**, kapsamlı işlem günlüğü ve günlük operasyonlar için kullanıcı dostu bir arayüz sağlar.

## 🚀 Özellikler

- **Merkezi Stok Kontrolü:**
    - Toplam mevcut stokun (kg/paket) büyük ve net gösterimi.
    - Stok sağlığını (Yüksek/Düşük/Kritik) temsil eden görsel ipuçları.
- **Envanter Yönetimi:**
    - **Stok Giriş:** Yeni sevkiyatları sisteme hızlıca kaydetme.
    - **Stok Çıkış:** Kullanım/tüketim işlemlerini anlık olarak düşme.
    - Negatif stok engelleme ve otomatik doğrulama mekanizmaları.
- **İşlem Şeffaflığı:**
    - Her hareketin (GİRİŞ/ÇIKIŞ) kullanıcı bilgisi ve zaman damgasıyla kaydı.
    - Geçmiş işlemlerin detaylı listesi ve filtrelenmesi.
- **Apex Entegrasyonu:**
    - Merkezi kimlik doğrulama ile güvenli erişim.
    - Kurumsal standartlara uygun oturum yönetimi.

## 🛠️ Teknolojiler

Silo, endüstriyel güvenilirlik ve modern web performansı için optimize edilmiştir:

### Frontend
- **Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)

### Backend
- **Runtime:** [Vercel Serverless Functions](https://vercel.com/docs/functions)
- **Database:** [MongoDB](https://www.mongodb.com/)

## 📦 Kurulum

Projeyi yerel ortamınızda çalıştırmak için:

### Gereksinimler
- Node.js (v18+)
- MongoDB Veritabanı

### Adımlar

1. **Repoyu klonlayın:**
   ```bash
   git clone <repo-url>
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
   ```

4. **Geliştirme Sunucusunu Başlatın:**
   ```bash
   npm run dev
   ```
   Uygulama `http://localhost:5173` adresinde çalışacaktır.

## 📂 Proje Yapısı

- `/src`: Frontend kaynak kodları.
- `/api`: Backend API fonksiyonları (Stok ve İşlem Yönetimi).
- `/public`: Statik dosyalar.

Detaylı teknik bilgi için [TECHNICAL.md](./TECHNICAL.md) dosyasına bakabilirsiniz.

## 📜 Lisans

Bu proje özel mülkiyettir. İzinsiz kopyalanması ve dağıtılması yasaktır.
