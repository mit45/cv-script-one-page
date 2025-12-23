# Ümit TOPUZ - CV & Çekiliş Uygulaması

Bu proje, kişisel bir CV web sitesi ve entegre edilmiş kapsamlı bir online kura/çekiliş yönetim sistemidir.

## 🚀 Özellikler

### 1. Kişisel CV (index.html)
- Kişisel bilgiler, kariyer hedefi ve iletişim bilgileri.
- Responsive tasarım.

### 2. Çekiliş Yönetim Sistemi (cekilis-yonetim.html)
- **Kullanıcı Sistemi:** Firebase Authentication ile güvenli giriş ve kayıt (E-posta/Şifre ve Google ile giriş).
- **Admin Paneli:** 
  - Yeni çekiliş etkinlikleri oluşturma.
  - Katılımcıları toplu olarak ekleme.
  - Kura durumunu ve sonuçlarını görüntüleme.
  - Sistemi sıfırlama ve veri yönetimi.
- **Kullanıcı Paneli:**
  - Katılımcıların kendi hesaplarına giriş yapıp kura sonuçlarını (kime hediye alacaklarını) görmesi.
  - Profil düzenleme.

### 3. Kura Ekranı (draw.html)
- Çekiliş için görsel arayüz.

## 🛠️ Kurulum ve Yapılandırma

Bu proje **Firebase** altyapısını kullanmaktadır (Authentication ve Realtime Database).

1. Projeyi bilgisayarınıza indirin.
2. Firebase konsolunda yeni bir proje oluşturun.
3. Authentication (Email/Password ve Google) ve Realtime Database servislerini etkinleştirin.
4. `js/firebase-config.js` dosyasını oluşturun ve Firebase yapılandırma bilgilerinizi ekleyin.
   - Detaylı kurulum adımları için **[FIREBASE-KURULUM.md](FIREBASE-KURULUM.md)** dosyasını inceleyin.

## 📂 Dosya Yapısı

- `index.html`: Ana sayfa (CV).
- `cekilis-yonetim.html`: Çekiliş yönetim ve kullanıcı paneli.
- `draw.html`: Kura çekim sayfası.
- `css/`: Stil dosyaları (Admin, Draw, Reset, Style vb.).
- `js/`: JavaScript dosyaları (Admin mantığı, Firebase ayarları vb.).
- `img/`: Görsel dosyalar.

## 💻 Teknolojiler

- HTML5 & CSS3
- JavaScript (ES6+)
- Firebase (Auth, Realtime Database)
- FontAwesome (İkonlar)
- Canvas Confetti (Efektler)
