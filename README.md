# Silo

**Silo**, endüstriyel yem ve tahıl depolamanın verimli bir şekilde takibi için tasarlanmış modern, sunucusuz (serverless) bir envanter yönetim panelidir. Stok seviyeleri için gerçek zamanlı "Tek Doğruluk Kaynağı" (Single Source of Truth), kapsamlı işlem günlüğü ve günlük operasyonlar için kullanıcı dostu bir arayüz sağlar.

## 📚 Dökümantasyon

Proje hakkında daha detaylı bilgi için lütfen aşağıdaki belgelere göz atın:

- **[Blueprint](./BLUEPRINT.md)**: Kavramsal genel bakış, temel hedefler ve üst düzey mimari.
- **[Teknik Dökümantasyon](./technical.md)**: Detaylı teknoloji yığını, API referansı ve veritabanı şeması.

## 🚀 Başlarken

### Gereksinimler

- [Node.js](https://nodejs.org/) (v18 veya üzeri)
- [MongoDB](https://www.mongodb.com/) (Yerel veya Atlas)
- [Vercel CLI](https://vercel.com/docs/cli) (dağıtım için)

### Kurulum

1. **Depoyu klonlayın**
   ```bash
   git clone <repository_url>
   cd Silo
   ```

2. **Bağımlılıkları yükleyin**
   ```bash
   npm install
   ```

3. **Ortam Değişkenlerini Yapılandırın**
   Kök dizinde bir `.env` dosyası oluşturun ve MongoDB bağlantı dizesini ekleyin:
   ```env
   MONGODB_URI=mongodb+srv://<kullanici>:<sifre>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```

4. **Geliştirme Sunucusunu Başlatın**
   ```bash
   npm run dev
   ```
   Uygulama `http://localhost:5173` adresinde çalışacaktır.

## 🛠️ Komutlar (Scripts)

- `npm run dev`: Vite geliştirme sunucusunu başlatır.
- `npm run build`: Uygulamayı üretim (production) için derler.
- `npm run preview`: Üretim derlemesini yerel olarak önizler.
- `npm run lint`: Kod kalitesi sorunlarını kontrol etmek için ESLint'i çalıştırır.

## ☁️ Dağıtım

Bu proje [Vercel](https://vercel.com) üzerinde dağıtım için optimize edilmiştir.

1. Vercel CLI'ı yükleyin:
   ```bash
   npm i -g vercel
   ```

2. Dağıtın:
   ```bash
   vercel
   ```

Vercel proje ayarlarında `MONGODB_URI` ortam değişkenini tanımladığınızdan emin olun.

## 📝 Lisans
[MIT](LICENSE)
