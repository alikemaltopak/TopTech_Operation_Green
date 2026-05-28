# TOPTECH Operasyon Yeşili - Proje Mimarisi (ARCHITECTURE)

Bu dosya, projenin mimarisini, veri akışını, bileşenlerini ve geliştirme standartlarını hem geliştiricilerin hem de yapay zeka tabanlı sohbet botlarının (chatbot) hızlıca anlaması ve üzerinde güvenle geliştirme yapabilmesi için hazırlanmıştır.

---

## 1. Genel Bakış ve Proje Amacı

**TOPTECH Operasyon Yeşili**, akıllı bahçe ve tarım arazilerinin uzaktan izlenmesi, nem takibi, otomatik sulama yönetimi ve kaynak tasarrufu analizlerini gerçekleştirmek üzere tasarlanmış mobil öncelikli (mobile-first), modern ve yüksek performanslı bir yönetim panelidir.

### Temel Özellikler:
*   **Çoklu Arazi Desteği (Lands):** Kullanıcılar birden fazla arazi ekleyebilir, arazilerin konum (koordinat), telefon numarası, sensör sayısı gibi bilgilerini yönetebilir.
*   **SMS Tabanlı Sulama Kontrolü:** İnternet bağlantısı olmayan veya GSM modülü barındıran kontrol cihazlarına, `sms:<telefon>?body=ON` veya `sms:<telefon>?body=ON<dakika>` gibi komutlar göndererek sulama başlatılır/durdurulur.
*   **Gerçek Zamanlı Hava Durumu & Tahmin:** Seçili arazinin koordinatlarına göre Open-Meteo API kullanılarak anlık hava durumu ve 5 günlük tahmin verileri çekilir.
*   **Gelişmiş Sulama Geçmişi:** Yapılan sulama seanslarının süreleri, başlangıç/bitiş zamanları ve hangi arazide yapıldığı bilgisi Firebase Firestore üzerinde tarihsel olarak saklanır.
*   **Dinamik Tema Motoru:** 11 farklı tema (Açık, Koyu, Taş, Mermer, Tahta, Obsidyen, Kilim, Beton, Çini, Bahçe, Gümüş) ile arayüzün renk, doku, ikon seti ve köşe ovallikleri (border-radius) dinamik olarak değişir.

---

## 2. Teknoloji Yığını (Tech Stack)

*   **Çatı (Framework):** React (TypeScript) + Vite
*   **Veritabanı ve Kimlik Doğrulama:** Firebase (Authentication, Cloud Firestore, Firebase Storage)
*   **Stil ve Tasarım:** Vanilla CSS (CSS Değişkenleri üzerinden dinamik tema yönetimi)
*   **API Entegrasyonu:** Open-Meteo (Hava durumu tahminleri için)
*   **İkonlar:** Google Material Symbols (Google Fonts üzerinden yüklenmektedir)

---

## 3. Proje Klasör Yapısı

```text
├── App.tsx                     # Ana uygulama bileşeni, yönlendirme, tema yönetimi ve Firebase abonelikleri
├── index.html                  # HTML şablonu, fontlar ve stil dosyalarının bağlandığı ana dosya
├── index.tsx                   # React DOM render başlangıç noktası
├── types.ts                    # TypeScript tip ve arayüz tanımlamaları (Models & Interfaces)
├── vite.config.ts              # Vite derleme ve geliştirme sunucusu konfigürasyonu
├── tsconfig.json               # TypeScript derleyici kuralları
├── package.json                # Proje bağımlılıkları ve npm betikleri
├── lib/
│   ├── firebase.ts             # Firebase istemci ilklendirmesi (Config & Exports)
│   ├── db.ts                   # Firestore veritabanı CRUD ve anlık abonelik (Snapshot) fonksiyonları
│   └── themes.ts               # Dinamik temaların renk, doku, yarıçap ve ikon konfigürasyonları
└── components/
    ├── Header.tsx              # Üst bar: Çevrimiçi durumu, tema değiştirici, profil butonu
    ├── Navigation.tsx          # Alt sekme barı (Panel, Hava Durumu, Geçmiş, Araziler, Ayarlar)
    ├── Dashboard.tsx           # Ana kontrol paneli (Nem dairesi, sulama düğmesi, hızlı bilgi kartları)
    ├── StatusTile.tsx          # Dashboard içindeki nem, pil, su vb. küçük bilgi kutuları
    ├── Gauge.tsx               # Özelleştirilebilir nem dairesi göstergesi
    ├── WeatherHero.tsx         # Dashboard üstündeki hızlı hava durumu özeti
    ├── WeatherView.tsx         # Detaylı 5 günlük hava durumu tahmin ekranı
    ├── HistoryView.tsx         # Tarihsel sulama seanslarının listelendiği ekran
    ├── LandsView.tsx           # Arazilerin listelendiği, eklendiği ve güncellendiği ekran
    ├── LoginView.tsx           # Kullanıcı giriş ekranı (Firebase Auth entegreli)
    ├── AppIntro.tsx            # Uygulama ilk açılışındaki tanıtım ve animasyon ekranı
    ├── Modal.tsx               # Yeniden kullanılabilir pop-up pencere bileşeni
    └── ScheduleModal.tsx       # Zamanlama güncelleme ekranı
```

---

## 4. Veri Modelleri (`types.ts`)

Uygulamanın ana veri yapıları `types.ts` dosyasında tanımlanmıştır:

```typescript
// Sekme Yönlendirme Enumu
export enum NavTab {
  PANEL = 'panel',
  HISTORY = 'history',
  WEATHER = 'weather',
  LANDS = 'lands',
  SETTINGS = 'settings'
}

// Hava Durumu Koşulları
export type WeatherCondition = 'Sunny' | 'Cloudy' | 'Rainy' | 'PartlyCloudy';

// Günlük Hava Tahmini
export interface ForecastDay {
  date: string;
  maxTemp: number;
  minTemp: number;
  condition: WeatherCondition;
}

// Bahçe / Sistem Anlık Durumu
export interface GardenStatus {
  moisture: number;          // Toprak Nem Oranı (%)
  temperature: number;       // Sıcaklık (°C)
  battery: number;           // Sensör Batarya Durumu (%)
  waterSaved: number;        // Tasarruf Edilen Su Miktarı (Litre)
  waterRemaining: number;    // Kalan Su Miktarı (Litre)
  tankCapacity: number;      // Depo Kapasitesi (Litre)
  nextSchedule: string;      // Sonraki Planlanan Sulama Saati ("05:30")
  nextScheduleDay: string;   // Sonraki Planlanan Gün ("Yarın")
  isIrrigating: boolean;     // Sulama Aktif mi?
  isOnline: boolean;         // Cihaz Çevrimiçi mi?
  isScheduleActive: boolean; // Zamanlama Aktif mi?
  condition: WeatherCondition;
  forecast?: ForecastDay[];
}

// Arazi Tanımlaması
export interface Land {
  id: string;
  name: string;              // Arazi Adı
  location: string;          // İl / İlçe veya Konum Bilgisi
  sensorCount: number;       // Araziye Bağlı Sensör Sayısı
  image: string;             // Arazi Görseli
  phoneNumber?: string;      // Sulama Cihazının GSM Numarası
  coordinates?: string;      // Hava Durumu için Enlem,Boylam (Örn: "39.9334, 32.8597")
}

// Sulama Seansı Geçmişi
export interface IrrigationSession {
  id: string;
  landId: string;
  landName: string;
  date: string;              // YYYY-MM-DD
  time: string;              // HH:mm (Başlangıç Saati)
  startTime: string;         // HH:mm:ss
  endTime: string;           // HH:mm:ss
  duration: string;          // Örn: "5 dk 23 sn"
  icon: string;              // İkon adı
}
```

---

## 5. Firebase Veritabanı ve Akış Yapısı

Proje, gerçek zamanlı veri senkronizasyonu için **Cloud Firestore** ve kullanıcı yönetimi için **Firebase Auth** kullanmaktadır.

### Firestore Şeması (`users` ana koleksiyonu altında):
```text
users/
  └── {user_id}/                   # E-posta adresindeki '.' ve '@' karakterleri '_' ile değiştirilerek oluşturulur (Örn: ali_toptech_com)
        ├── email: string
        ├── lastLogin: timestamp
        ├── lands/                 # Alt Koleksiyon: Kullanıcının arazileri
        │     └── {land_id}/
        │           ├── name: string
        │           ├── location: string
        │           ├── sensorCount: number
        │           ├── image: string
        │           ├── phoneNumber: string
        │           ├── coordinates: string
        │           └── createdAt: timestamp
        └── history/               # Alt Koleksiyon: Sulama geçmişi seansları
              └── {session_id}/
                    ├── landId: string
                    ├── landName: string
                    ├── date: string
                    ├── time: string
                    ├── startTime: string
                    ├── endTime: string
                    ├── duration: string
                    ├── icon: string
                    └── createdAt: timestamp
```

### Önemli Veri Abonelikleri (Subscriptions):
*   `subscribeToLands`: Firestore'da kullanıcının arazilerini (`lands` alt koleksiyonu) `createdAt` sırasına göre izler ve değişiklik olduğunda state'i günceller.
*   `subscribeToHistory`: Kullanıcının sulama geçmişini (`history` alt koleksiyonu) izler.

---

## 6. Dinamik Tema Motoru (`lib/themes.ts`)

Uygulamanın en güçlü yanlarından biri dinamik tema desteğidir. `themes.ts` dosyasında tanımlanan temalar `App.tsx` içerisindeki bir `useEffect` ile HTML kök elementine (`document.documentElement`) CSS Değişkenleri olarak enjekte edilir.

### Uygulanan CSS Değişkenleri:
*   `--color-primary`: Temanın birincil rengi (Vurgu rengi).
*   `--color-bg-light` / `--color-bg-dark`: Açık/Koyu mod arka plan renkleri.
*   `--color-surface-light` / `--color-surface-dark`: Kartların yüzey renkleri.
*   `--color-border-light` / `--color-border-dark`: Kenarlık renkleri.
*   `--radius-default`, `--radius-lg`, `--radius-xl`, `--radius-2xl`: Kart ve butonların köşe yuvarlaklıkları.
*   `--theme-img`: Doku/Arka plan görseli (Taş, Mermer vb. dokulu temalar için).

Temalar ayrıca kendi ikon setlerini tanımlar (`icons` nesnesi). `Navigation` bileşeni, seçilen temaya uygun ikonları render etmek için bu konfigürasyonu kullanır.

---

## 7. Geliştiriciler ve Sohbet Botları İçin Kurallar & İpuçları

1.  **CSS Değişkenlerini Kullanın:** CSS yazarken veya bileşen stillerini güncellerken doğrudan renk kodları (Örn: `#76c893` veya `red`) yazmak yerine mutlaka CSS Değişkenlerini kullanın:
    *   `var(--color-primary)`
    *   `var(--color-surface-dark)`
    *   `var(--radius-lg)`
    Bu sayede yaptığınız değişiklikler temalar arası geçişte bozulmaz.
2.  **Firebase Entegrasyonu:** Veritabanına yeni bir veri eklerken veya güncellerken mutlaka `lib/db.ts` içindeki hazır fonksiyonları kullanın. Yeni CRUD işlemleri gerekirse bunları `lib/db.ts` içerisine ekleyin.
3.  **Hava Durumu API'si:** Hava durumu sorguları `open-meteo.com` üzerinden arazinin koordinatları ile yapılır. Koordinatların geçerli bir `"enlem, boylam"` formatında (Örn: `"39.93, 32.85"`) olduğundan emin olun.
4.  **Güvenlik:** Firebase API anahtarları `lib/firebase.ts` dosyasında yer almaktadır. Geliştirme yaparken veya yeni bir ortama geçerken bu yapılandırmaların doğruluğundan emin olun.
5.  **Aesthetic Önceliği:** UI güncellemelerinde modern tasarım diline, yumuşak mikro animasyonlara ve görsel olarak premium hissettiren cam efekti (glassmorphic) tasarımlara özen gösterin.

---
*Geliştirmeye başlamak için hazırsınız! Herhangi bir geliştirmede bu dosyayı rehber alabilirsiniz.*
