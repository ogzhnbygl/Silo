# Silo - Vizyon ve Blueprint

## 🌟 Vizyon

**Silo**, adını aldığı yapılar gibi, işletmenin en temel kaynaklarını koruyan ve yöneten güvenli bir depodur.

Konsept olarak, **"Endüstriyel Güvenilirlik"** (Industrial Reliability) üzerine kuruludur. Hata kabul etmeyen, her işlemin hesabını verebilen, sağlam ve kararlı bir sistemdir.

## 🏗️ Mimari

Silo, minimalist ancak güçlü bir mimariye sahiptir.

- **Tek Doğruluk Kaynağı (Single Source of Truth):** Envanter durumu anlık olarak tek bir noktadan yönetilir. Dağıtık veri karmaşasına izin verilmez.
- **İşlem Şeffaflığı:** Sistemde yapılan her değişiklik, "Kim, Ne Zaman, Ne Yaptı?" sorularının cevabını barındıran silinemez bir kayıt (Log) oluşturur.

## 🎨 Tasarım Prensipleri

- **Endüstriyel Estetik:** Arayüz, temiz, net ve profesyoneldir. Gereksiz süslemelerden kaçınılır.
- **Hız ve İşlevsellik:** Depo operasyonları hızlıdır; yazılım buna ayak uydurmalıdır. Minimum tıklama ile maksimum işlev hedeflenir.
- **Görsel Geri Bildirim:** Kritik stok seviyeleri (Düşük Stok!) kullanıcıya görsel olarak (renkler, barlar) anında iletilir.

## 🗺️ Yol Haritası (Roadmap)

### Faz 1: Temel Depo Yönetimi ve Concurrency (Tamamlandı ✅)
- [x] Gerçek zamanlı stok takibi ve transaction logs.
- [x] Stok giriş/çıkış işlemleri.
- [x] **Yarış Durumu Çözümü:** MongoDB atomik `$gte` filtresi ile çakışan çıkış işlemlerinde negatif stok oluşumunun engellenmesi.
- [x] Apex auth entegrasyonu.

### Faz 2: Standardizasyon, Doğrulama ve Yönlendirme (Tamamlandı ✅)
- [x] **Yönlendirme:** `react-router-dom` entegrasyonu ile URL tabanlı yönlendirme (`/`, `/transactions`, `/products`).
- [x] **Zod Giriş Validasyonları:** Miktar ve ağırlık bilgilerinin sunucu tarafında veri şeması doğrulaması.
- [x] **Performans Optimizasyonu:** IN işlemlerinde `findOne` adımının kaldırılarak MongoDB düzeyinde `{ upsert: true }` ile direkt güncellenmesi.
- [x] **SSO JWT Genişlemesi:** İşlemi gerçekleştiren kullanıcı isminin JWT'deki `name` alanından çekilerek loglara yansıtılması.

> [!NOTE]
> Faz 2 kapsamındaki Adım 5 geliştirmesi olan **Çoklu Ürün Desteği (Ürün Kataloğu)** kullanıcı isteği doğrultusunda kapsam dışı tutulmuştur.

### Faz 3: Akıllı Depo ve Çoklu Ürün (Planlanıyor)
- [ ] Çoklu Ürün Desteği (Katalog ve ürün bazlı envanter/işlem takibi).
- [ ] **Kritik Seviye Uyarıları:** Ürün stokları kritik seviyenin altına düştüğünde ön yüz ve e-posta bildirimleri.
- [ ] **Tüketim Tahminleri:** Geçmiş tüketim hızına göre stokların kaç gün yeteceğinin otomatik hesaplanması.
- [ ] **Tedarik Entegrasyonu:** Stok kritik seviyeye yaklaştığında otomatik satın alma/sipariş önerileri.

