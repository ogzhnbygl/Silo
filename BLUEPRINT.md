# Silo Proje Blueprint

## 1. Konsept
**Silo**, endüstriyel yem ve tahıl depolamanın verimli bir şekilde takibi için tasarlanmış özelleşmiş bir envanter yönetim sistemidir. "Silo" ismi, temel amacını yansıtır: Temel kaynaklar (özellikle yem/tahıl) için güvenli, organize bir depo. Hem Türkçe hem de İngilizce'de endüstriyel güvenilirlik ve prestij sembolü olarak aynı anlama gelir.

## 2. Temel Hedefler
- **Merkezi Stok Kontrolü**: Stok seviyeleri için gerçek zamanlı "Tek Doğruluk Kaynağı" (Single Source of Truth) sağlamak.
- **İşlem Şeffaflığı**: Her hareketi (GİRİŞ/ÇIKIŞ) kullanıcı sorumluluğu ve zaman damgası ile kaydetmek.
- **Operasyonel Verimlilik**: Stok ekleme (teslimatlar) ve stok düşme (paket tüketimi) süreçlerini hızlandırmak.
- **Görsel Analitik**: Stok durumu ve son aktiviteler hakkında anlık görsel geri bildirim sağlamak.

## 3. Mimari Genel Bakış
Silo, ölçeklenebilirlik ve düşük bakım maliyeti sağlamak için modern, sunucusuz (serverless) bir web uygulaması olarak inşa edilmiştir.

- **Ön Yüz (Frontend)**: **React** ve **Vite** ile oluşturulmuş, **Tailwind CSS** ile stillendirilmiş Tek Sayfalı Uygulama (SPA). Responsive, dashboard tarzı bir arayüz sunar.
- **Arka Uç (Backend API)**: **Vercel Serverless Functions**, API isteklerini yöneterek maliyet etkinliği ve otomatik ölçeklendirme sağlar.
- **Veritabanı**: **MongoDB**, envanter istatistikleri ve işlem kayıtları için belge tabanlı (document-based) kalıcı veri deposu olarak görev yapar.
- **Kimlik Doğrulama**: Güvenli kullanıcı oturumları için **Apex** (üst platform) ile entegredir.

## 4. Temel Özellikler
### 4.1 Dashboard (Gösterge Paneli)
- **Stok Genel Bakışı**: Toplam mevcut stokun (kg/paket) büyük ve net gösterimi.
- **Durum Göstergeleri**: Stok sağlığını (Yüksek/Düşük/Kritik) temsil eden görsel ipuçları (örn. ilerleme çubukları, renk kodları).

### 4.2 Envanter Yönetimi
- **Stok Giriş (Teslimat)**: Toplam envantere ekleme yaparak yeni sevkiyatları kaydetme arayüzü.
- **Stok Çıkış (Kullanım)**: Toplam envanterden düşerek kullanım/tüketim kaydetme arayüzü.
- **Doğrulama**: Mevcut stoktan fazlasının çekilmesini önleyen otomatik kontroller (negatif stok engelleme).

### 4.3 Aktivite Günlüğü
- **İşlem Geçmişi**: Son işlemlerin kronolojik listesi.
- **Detay Görünümü**: Her giriş; işlem türünü (GİRİŞ/ÇIKIŞ), miktarı, sorumlu kullanıcıyı ve zaman damgasını gösterir.

## 5. Tasarım Prensipleri
- **Endüstriyel & Prestijli**: Arayüz "Silo" markasını yansıtır—temiz, sağlam ve profesyonel.
- **Hız & Basitlik**: Operasyonlar (paket almak gibi), minimum tıklama ile tamamlanacak şekilde tasarlanmıştır.
- **Güvenilirlik**: Veri bütünlüğü çok önemlidir; her değişiklik doğrulanır ve günlüğe kaydedilir.
