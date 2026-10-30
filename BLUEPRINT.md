# Silo - Vizyon ve Blueprint

## 🌟 Vizyon

**Silo**, adını aldığı yapılar gibi, işletmenin en temel kaynaklarını koruyan ve yöneten güvenli bir depodur.

Konsept olarak, **"Endüstriyel Güvenilirlik"** (Industrial Reliability) üzerine kuruludur. Hata kabul etmeyen, her işlemin hesabını verebilen, sağlam ve kararlı bir sistemdir.

## 🏗️ Mimari

Silo, minimalist ancak güçlü bir mimariye sahiptir.

- **Tek Doğruluk Kaynağı (Single Source of Truth):** Envanter durumu ürün bazında anlık olarak tek bir merkezden yönetilir. Dağıtık veri karmaşasına izin verilmez.
- **İşlem Şeffaflığı:** Sistemde yapılan her değişiklik, "Kim, Ne Zaman, Hangi Yemden Ne Kadar Aldı/Ekledi?" sorularının cevabını barındıran silinemez bir kayıt (Log) oluşturur. Tedarikçi veya ürün değişimlerinde dahi geçmiş veriler korunur.

## 🎨 Tasarım Prensipleri

- **Endüstriyel Estetik:** Arayüz, temiz, net ve profesyoneldir. Gereksiz süslemelerden kaçınılır.
- **Hız ve İşlevsellik:** Depo operasyonları hızlıdır; yazılım buna ayak uydurmalıdır. Minimum tıklama ile maksimum işlev hedeflenir.
- **Görsel Geri Bildirim:** Kritik stok seviyeleri (`≤ 10 Paket / 100 kg` -> **Stok Az**) ve ürün ayrımları (**SAFE® A03** Mavi, **SAFE® A04** Mor) kullanıcıya görsel olarak anında iletilir.

## 🗺️ Yol Haritası (Roadmap)

### Faz 1: Temel Depo Yönetimi ve Concurrency (Tamamlandı ✅)
- [x] Gerçek zamanlı stok takibi ve transaction logs.
- [x] Stok giriş/çıkış işlemleri.
- [x] **Yarış Durumu Çözümü:** MongoDB atomik `$gte` filtresi ile çakışan çıkış işlemlerinde negatif stok oluşumunun engellenmesi.
- [x] Apex SSO kimlik doğrulama entegrasyonu.

### Faz 2: Standardizasyon, Analitik ve Raporlama (Tamamlandı ✅)
- [x] **Yönlendirme:** `react-router-dom` entegrasyonu.
- [x] **Zod Giriş Validasyonları:** Miktar ve ürün bilgilerinin sunucu tarafında veri şeması doğrulaması.
- [x] **Performans Optimizasyonu:** `IN` işlemlerinde `findOne` adımının kaldırılarak MongoDB düzeyinde `{ upsert: true }` ile direkt güncellenmesi.
- [x] **SSO Kullanıcı Kaydı:** İşlemi gerçekleştiren kullanıcı isminin oturumdan çekilerek loglara yansıtılması.
- [x] **Tüketim Grafiği & PDF Raporu:** Haftalık ve günlük (drill-down) tüketim grafiği ile Türkçe karakter destekli A4 PDF tüketim raporu çıktısı.

### Faz 3: Çoklu Yem Desteği — SAFE® A03 & SAFE® A04 Geçişi (Tamamlandı ✅)
- [x] **SAFE® A03 & SAFE® A04 (10 kg) Ürün Takibi:** Üreme & Büyüme yemi (**SAFE® A03**) ile Bakım & İdame yeminin (**SAFE® A04**) yan yana stok/durum kartları ve ürün seçmeli işlem penceresi ile bağımsız yönetimi.
- [x] **Geçmiş Veri Koruma (Optima 4 kg):** Eski 4 kg'lık Optima kayıtlarının silinmeden geçmiş hareketlerde, grafiklerde ve PDF raporlarında `Optima 4kg` olarak korunması.
- [x] **Ürün Bazlı Kritik Stok Eşiği:** Her bir yem için `≤ 10 Paket (100 kg)` seviyesinde bağımsız "Stok Az" uyarısı.
- [x] **Karşılaştırmalı Grafik & Raporlama:** Tüketim grafiğinde `Tümü | SAFE® A03 | SAFE® A04` filtreleri, yığın (stacked) renk kırılımı ve PDF raporunda ürün bazlı ayrı sütunlar.

### Faz 4: Akıllı Depo ve Otomasyon (Planlanıyor)
- [ ] **Otomatik Bildirimler:** Ürün stokları kritik seviyenin (`10 Paket`) altına düştüğünde e-posta veya anlık bildirim gönderimi.
- [ ] **Tüketim Tahminleri:** Geçmiş haftalık tüketim hızına göre A03 ve A04 stoklarının kaç gün yeteceğinin otomatik hesaplanması.
- [ ] **Tedarik Entegrasyonu:** Stok kritik seviyeye yaklaştığında otomatik satın alma/sipariş önerileri.
