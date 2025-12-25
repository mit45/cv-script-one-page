# Yılbaşı Kura Çekilişi Sistemi - Firebase Edition

Bu proje, yılbaşı hediye kura çekilişi için geliştirilmiş bir web uygulamasıdır. Firebase Realtime Database kullanarak tüm cihazlardan erişilebilen bir sistem sunar.

## 🎯 Özellikler

- ✅ Farklı cihazlardan erişim (Telefon, Tablet, Bilgisayar)
- ✅ Gerçek zamanlı veri senkronizasyonu
- ✅ Kullanıcı bazlı şifre sistemi
- ✅ Numara butonları ile kolay seçim
- ✅ Katılımcı sayısı kadar numara seçeneği
- ✅ Admin paneli ile yönetim
- ✅ Toplu katılımcı ekleme
- ✅ Kura sonuçlarını izleme

## 🚀 Firebase Kurulumu

### 1. Firebase Projesi Oluşturun

1. [Firebase Console](https://console.firebase.google.com/) adresine gidin
2. "Add project" (Proje Ekle) butonuna tıklayın
3. Proje adını girin (örn: "yilbasi-kura")
4. Google Analytics'i isteğe bağlı olarak aktif edin
5. "Create project" butonuna tıklayın

### 2. Realtime Database Oluşturun

1. Sol menüden "Build" > "Realtime Database" seçeneğine gidin
2. "Create Database" butonuna tıklayın
3. Lokasyon seçin (örn: europe-west1)
4. "Start in test mode" seçeneğini seçin (geliştirme için)
5. "Enable" butonuna tıklayın

### 3. Web Uygulaması Ekleyin

1. Project Overview sayfasında "</>" (Web) ikonuna tıklayın
2. App nickname girin (örn: "Kura Web App")
3. "Register app" butonuna tıklayın
4. Firebase SDK configuration bilgilerini kopyalayın

### 4. Güvenlik Kurallarını Ayarlayın

Realtime Database > Rules sekmesinde aşağıdaki kuralları ekleyin:

```json
{
  "rules": {
    "participants": {
      ".read": true,
      ".write": true,
      "$participantId": {
        ".validate": "newData.hasChildren(['name', 'createdAt'])"
      }
    },
    "draws": {
      ".read": true,
      ".write": true,
      "$drawId": {
        ".validate": "newData.hasChildren(['userName', 'recipient', 'selectedNumber', 'date'])"
      }
    },
    "stats": {
      ".read": true,
      ".write": true
    }
  }
}
```

**ÖNEMLİ:** Production ortamında daha güvenli kurallar kullanın!

### 5. Konfigürasyon Dosyasını Güncelleyin

`js/firebase-config.js` dosyasını açın ve Firebase SDK configuration bilgilerinizi girin:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",                    // Buraya API Key
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

## 📱 Kullanım

### Admin Paneli

1. `admin.html` sayfasına gidin
2. Admin şifresi: `admin2025`
3. Katılımcı ekleyin veya toplu ekleyin

**Toplu Katılımcı Ekleme:**
```
Ahmet Yılmaz
Ayşe Kaya
Mehmet Demir
Fatma Şahin
```

### Kura Çekimi

1. `draw.html` sayfasına gidin
2. Adınızı girin
3. İlk girişte şifre oluşturun
4. Katılımcı sayısı kadar numara butonundan birini seçin
5. "Kura Çek" butonuna tıklayın
6. Sonucu görüntüleyin

## 🔐 Güvenlik

- Her kullanıcı kendi şifresini oluşturur
- Şifreler Firebase'de güvenli şekilde saklanır
- Her kullanıcı sadece bir kez kura çekebilir
- Seçimler değiştirilemez

## 🛠️ Teknik Detaylar

### Kullanılan Teknolojiler

- HTML5, CSS3, JavaScript (ES6+)
- Firebase Realtime Database
- Font Awesome Icons
- Responsive Design

### Dosya Yapısı

```
├── index.html          # Ana sayfa
├── draw.html           # Kura çekim sayfası
├── admin.html          # Admin paneli
├── css/
│   ├── reset.css      # CSS reset
│   ├── style.css      # Genel stiller
│   ├── draw.css       # Kura sayfası stilleri
│   └── admin.css      # Admin paneli stilleri
├── js/
│   ├── firebase-config.js  # Firebase konfigürasyonu
│   ├── draw.js            # Kura sistemi JavaScript
│   └── admin.js           # Admin paneli JavaScript
└── img/
    └── ...            # Görseller
```

### Firebase Veri Yapısı

```
database
├── participants/
│   └── {participantId}/
│       ├── id: string
│       ├── name: string
│       ├── password: string
│       └── createdAt: timestamp
├── draws/
│   └── {drawId}/
│       ├── id: string
│       ├── userName: string
│       ├── recipient: string
│       ├── selectedNumber: number
│       └── date: timestamp
└── stats/
    ├── totalParticipants: number
    ├── totalDraws: number
    ├── remainingDraws: number
    └── lastUpdate: timestamp
```

## 🌐 Canlıya Alma

### Firebase Hosting ile (Önerilen)

```bash
# Firebase CLI'yi yükleyin
npm install -g firebase-tools

# Giriş yapın
firebase login

# Projeyi başlatın
firebase init hosting

# Deploy edin
firebase deploy
```

### GitHub Pages ile

1. Repository'yi GitHub'a push edin
2. Settings > Pages
3. Source: main branch
4. Save

## 🔧 Sorun Giderme

### Firebase bağlanamıyor
- Firebase config bilgilerini kontrol edin
- Database URL'nin doğru olduğundan emin olun
- Tarayıcı konsolundaki hataları kontrol edin

### Katılımcılar görünmüyor
- Realtime Database kurallarını kontrol edin
- Test mode'da olduğundan emin olun
- Network sekmesinden Firebase isteklerini kontrol edin

### Kura sonuçları kaydedilmiyor
- Write yetkilerinin olduğunu kontrol edin
- Tarayıcı konsolundaki hataları inceleyin

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Tarayıcı konsolunu (F12) kontrol edin
2. Firebase Console'da Database'i kontrol edin
3. Security Rules'ı gözden geçirin

## 🎄 Keyifli Kullanımlar!

Mutlu yıllar! 🎉

---

**Not:** Bu sistem eğlence amaçlıdır. Production kullanımı için ek güvenlik önlemleri alınmalıdır.
