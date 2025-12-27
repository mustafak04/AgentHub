# 🤖 AgentHub

<div align="center">

![AgentHub Logo](./assets/images/icon.png)

**Akıllı AI Agent Yönetim Platformu**

Birden fazla özelleşmiş AI agentını tek bir platformda kullanarak günlük görevlerinizi kolaylaştırın.

[![React Native](https://img.shields.io/badge/React%20Native-0.81.4-blue?style=for-the-badge&logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0-000020?style=for-the-badge&logo=expo)](https://expo.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)

[English](#english) | [Türkçe](#turkce)

</div>

---

## <a name="turkce"></a>🇹🇷 Türkçe

### 📖 Proje Hakkında

**AgentHub**, kullanıcılara farklı görevler için özelleştirilmiş AI agentları sunan bir mobil platformdur. React Native ve Expo kullanılarak geliştirilmiş cross-platform bir uygulamadır. Google Gemini API destekli backend altyapısı ile 20'den fazla özelleşmiş agent, kullanıcıların günlük ihtiyaçlarını tek bir platformdan karşılamasına olanak tanır.

### ✨ Özellikler

#### 🎯 İki Farklı Çalışma Modu

- **👤 Bireysel Mod (Individual Mode)**: Kullanıcı tek bir agentle doğrudan etkileşime geçer
- **🎭 Koordinatör Mod (Coordinator Mode)**: Akıllı yönlendirme sistemi, kullanıcı mesajını en uygun agenta otomatik olarak yönlendirir

#### 🤖 20+ Özelleşmiş AI Agent

| Agent | Özellik | API |
|-------|---------|-----|
| 🌤️ **Hava Durumu** | Gerçek zamanlı hava durumu bilgisi | OpenWeatherMap |
| 🧮 **Hesap Makinesi** | Matematiksel hesaplamalar | Google Gemini |
| 🌐 **Çeviri** | Çok dilli çeviri desteği | Google Gemini |
| 📰 **Haber** | Güncel haberler ve başlıklar | GNews API |
| 📚 **Wikipedia** | Özet bilgiler ve ansiklopedik içerik | Wikipedia API |
| 💱 **Döviz Kuru** | Güncel döviz kurları | ExchangeRate API |
| 💻 **Kod Asistanı** | Programlama yardımı ve kod önerileri | Google Gemini |
| 🎨 **Görsel Oluşturma** | AI ile görsel/resim oluşturma | Pollinations AI |
| 🎬 **YouTube Arama** | Video arama ve istatistikler | YouTube Data API |
| 📖 **Kitap Öneri** | Kitap araması ve önerileri | Google Books API |
| 📝 **Özet Çıkarma** | URL ve metin özetleme | Google Gemini + Cheerio |
| 📘 **Sözlük** | İngilizce kelime açıklamaları | Dictionary API |
| 🎥 **Film/Dizi** | Film ve dizi bilgileri | TMDB API |
| 🎵 **Müzik** | Şarkı ve sanatçı bilgileri | Last.fm API |
| 🎙️ **Podcast** | Podcast arama ve öneri | ListenNotes API |
| 🎮 **Oyun Bilgisi** | Video oyun bilgileri ve puanları | RAWG API |
| 🍳 **Yemek Tarifi** | Yemek tarifleri ve malzemeler | Spoonacular API |
| 📍 **QR Kod** | QR kod oluşturma | QR Server API |
| 🏋️ **Fitness** | Egzersiz ve sağlık tavsiyeleri | Google Gemini |
| 🧘 **Meditasyon** | Meditasyon rehberi | Google Gemini |

### 🏗️ Teknoloji Yığını

#### 📱 Frontend (Mobile App)
- **Framework**: React Native 0.81.4 + Expo ~54.0
- **Routing**: Expo Router (File-based routing)
- **State Management**: React Context API
- **UI Components**: 
  - React Native Base Components
  - Linear Gradient
  - Blur Effects
  - Markdown Display
- **Animasyon**: React Native Reanimated
- **Kimlik Doğrulama**: Firebase Auth
- **Veritabanı**: Firebase Firestore
- **Navigation**: React Navigation

#### 🖥️ Backend (API Server)
- **Runtime**: Node.js
- **Framework**: Express.js
- **AI Engine**: Google Gemini 2.5 Flash (Dual API Key Fallback)
- **Web Scraping**: Cheerio
- **HTTP Client**: Axios
- **Environment**: dotenv

#### 🔑 Entegre API'ler
- OpenWeatherMap (Hava Durumu)
- GNews (Haberler)
- ExchangeRate-API (Döviz)
- YouTube Data API v3
- Google Books API
- TMDB (The Movie Database)
- Last.fm (Müzik)
- ListenNotes (Podcast)
- RAWG (Video Oyunlar)
- Spoonacular (Yemek Tarifleri)
- Dictionary API
- Wikipedia REST API
- Pollinations AI (Görsel Oluşturma)

### 🚀 Kurulum

#### Gereksinimler
- Node.js 16+ ve npm
- Expo CLI (`npm install -g expo-cli`)
- Android Studio / Xcode (native build için)
- Firebase projesi
- Google Cloud API anahtarları

#### 1️⃣ Projeyi Klonlayın
```bash
git clone https://github.com/mustafak04/AgentHub.git
cd AgentHub
```

#### 2️⃣ Frontend Kurulumu
```bash
# Bağımlılıkları yükleyin
npm install

# Firebase konfigürasyonu
# google-services.json dosyasını projeye ekleyin

# Uygulamayı başlatın
npx expo start
```

#### 3️⃣ Backend Kurulumu
```bash
cd AgentHub-Backend

# Bağımlılıkları yükleyin
npm install

# .env dosyası oluşturun
cp .env.example .env
```

#### 4️⃣ Ortam Değişkenlerini Ayarlayın

`.env` dosyasına aşağıdaki API anahtarlarını ekleyin:

```env
# Google Gemini (Primary & Backup)
GEMINI_API_KEY=your_primary_gemini_api_key
GEMINI_API_KEY_BACKUP=your_backup_gemini_api_key

# Weather
WEATHER_API_KEY=your_openweathermap_api_key

# News
GNEWS_API_KEY=your_gnews_api_key

# Currency Exchange
EXCHANGE_RATE_API_KEY=your_exchangerate_api_key

# YouTube & Google Books (same Google Cloud project)
YOUTUBE_API_KEY=your_google_cloud_api_key

# Movies & TV Shows
TMDB_API_KEY=your_tmdb_api_key

# Music
LASTFM_API_KEY=your_lastfm_api_key

# Podcasts
LISTENNOTES_API_KEY=your_listennotes_api_key

# Games
RAWG_API_KEY=your_rawg_api_key

# Recipes
SPOONACULAR_API_KEY=your_spoonacular_api_key
```

#### 5️⃣ Backend Sunucusunu Başlatın
```bash
npm start
# Server runs on http://localhost:3000
```

### 📱 Kullanım

1. **Giriş Yapın**: Firebase ile email/şifre ile kayıt olun veya giriş yapın
2. **Mod Seçin**: Ana ekrandan "Bireysel Mod" veya "Koordinatör Modu"nu seçin
3. **Agent Seçin** (Bireysel Mod): İhtiyacınıza uygun agentı seçin
4. **Sohbet Edin**: Mesaj gönderin ve AI yanıtlarını alın
5. **Geçmiş İnceleyin**: Önceki sohbetlerinizi görüntüleyin

### 📂 Proje Yapısı

```
AgentHub/
├── app/                          # Expo Router sayfaları
│   ├── _layout.tsx              # Ana layout ve navigasyon
│   ├── index.tsx                # Ana sayfa (mod seçimi)
│   ├── login.tsx                # Giriş/Kayıt ekranı
│   ├── individual.tsx           # Bireysel mod
│   ├── coordinate.tsx           # Koordinatör mod
│   ├── chat.tsx                 # Sohbet ekranı
│   └── context/                 # React Context providers
├── services/                     # API servisleri
│   └── chatService.ts           # Chat backend entegrasyonu
├── assets/                       # Görseller, ikonlar
├── AgentHub-Backend/            # Node.js Express backend
│   ├── server.js                # Ana sunucu dosyası
│   ├── config/
│   │   └── agentPrompts.js      # Agent sistem promptları
│   ├── .env                     # Ortam değişkenleri
│   └── package.json
├── android/                      # Android native kodu
├── ios/                          # iOS native kodu
├── app.json                      # Expo konfigürasyonu
└── package.json
```

### 🔧 Özelleştirme

#### Yeni Agent Ekleme

1. **Backend**: `AgentHub-Backend/config/agentPrompts.js` dosyasına yeni agent promptu ekleyin
2. **Server Logic**: `server.js` dosyasında agent mantığını yazın (gerekirse API entegrasyonu)
3. **Frontend**: Agent listesine yeni agentı ekleyin

```javascript
// agentPrompts.js örneği
case '21':
  return `Sen bir ${agentName} agentısın. Görevin: ...`;
```

### 🛡️ Güvenlik

- ✅ Firebase Authentication ile güvenli kullanıcı yönetimi
- ✅ API anahtarları `.env` dosyasında saklanır
- ✅ CORS koruması aktif
- ✅ Dual API Key fallback sistemi (rate limit koruması)

### 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen şu adımları izleyin:

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

### 📄 Lisans

Bu proje MIT lisansı ile lisanslanmıştır.

### 👨‍💻 Geliştirici

**Mustafa K.**
- GitHub: [@mustafak04](https://github.com/mustafak04)

### 📞 İletişim

Sorularınız veya önerileriniz için issue açabilirsiniz.

### 🙏 Teşekkürler

- Google Gemini AI
- Expo ve React Native ekibi
- Tüm açık kaynak API sağlayıcıları

---

## <a name="english"></a>🇬🇧 English

### 📖 About The Project

**AgentHub** is a mobile platform that provides users with specialized AI agents for different tasks. It's a cross-platform application developed using React Native and Expo. With a Google Gemini API-powered backend infrastructure, 20+ specialized agents allow users to meet their daily needs from a single platform.

### ✨ Features

#### 🎯 Two Different Operating Modes

- **👤 Individual Mode**: User interacts directly with a single agent
- **🎭 Coordinator Mode**: Smart routing system automatically directs user messages to the most appropriate agent

#### 🤖 20+ Specialized AI Agents

| Agent | Feature | API |
|-------|---------|-----|
| 🌤️ **Weather** | Real-time weather information | OpenWeatherMap |
| 🧮 **Calculator** | Mathematical calculations | Google Gemini |
| 🌐 **Translator** | Multi-language translation support | Google Gemini |
| 📰 **News** | Current news and headlines | GNews API |
| 📚 **Wikipedia** | Summary information and encyclopedic content | Wikipedia API |
| 💱 **Currency Exchange** | Current exchange rates | ExchangeRate API |
| 💻 **Code Assistant** | Programming help and code suggestions | Google Gemini |
| 🎨 **Image Generation** | AI-powered image creation | Pollinations AI |
| 🎬 **YouTube Search** | Video search and statistics | YouTube Data API |
| 📖 **Book Recommendations** | Book search and recommendations | Google Books API |
| 📝 **Summarizer** | URL and text summarization | Google Gemini + Cheerio |
| 📘 **Dictionary** | English word definitions | Dictionary API |
| 🎥 **Movies/TV Shows** | Film and series information | TMDB API |
| 🎵 **Music** | Song and artist information | Last.fm API |
| 🎙️ **Podcast** | Podcast search and recommendations | ListenNotes API |
| 🎮 **Game Info** | Video game information and ratings | RAWG API |
| 🍳 **Recipe** | Recipes and ingredients | Spoonacular API |
| 📍 **QR Code** | QR code generation | QR Server API |
| 🏋️ **Fitness** | Exercise and health advice | Google Gemini |
| 🧘 **Meditation** | Meditation guide | Google Gemini |

### 🏗️ Tech Stack

#### 📱 Frontend (Mobile App)
- **Framework**: React Native 0.81.4 + Expo ~54.0
- **Routing**: Expo Router (File-based routing)
- **State Management**: React Context API
- **UI Components**: 
  - React Native Base Components
  - Linear Gradient
  - Blur Effects
  - Markdown Display
- **Animation**: React Native Reanimated
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Navigation**: React Navigation

#### 🖥️ Backend (API Server)
- **Runtime**: Node.js
- **Framework**: Express.js
- **AI Engine**: Google Gemini 2.5 Flash (Dual API Key Fallback)
- **Web Scraping**: Cheerio
- **HTTP Client**: Axios
- **Environment**: dotenv

#### 🔑 Integrated APIs
- OpenWeatherMap (Weather)
- GNews (News)
- ExchangeRate-API (Currency)
- YouTube Data API v3
- Google Books API
- TMDB (The Movie Database)
- Last.fm (Music)
- ListenNotes (Podcasts)
- RAWG (Video Games)
- Spoonacular (Recipes)
- Dictionary API
- Wikipedia REST API
- Pollinations AI (Image Generation)

### 🚀 Installation

#### Requirements
- Node.js 16+ and npm
- Expo CLI (`npm install -g expo-cli`)
- Android Studio / Xcode (for native builds)
- Firebase project
- Google Cloud API keys

#### 1️⃣ Clone the Project
```bash
git clone https://github.com/mustafak04/AgentHub.git
cd AgentHub
```

#### 2️⃣ Frontend Setup
```bash
# Install dependencies
npm install

# Firebase configuration
# Add google-services.json file to your project

# Start the app
npx expo start
```

#### 3️⃣ Backend Setup
```bash
cd AgentHub-Backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

#### 4️⃣ Configure Environment Variables

Add the following API keys to your `.env` file:

```env
# Google Gemini (Primary & Backup)
GEMINI_API_KEY=your_primary_gemini_api_key
GEMINI_API_KEY_BACKUP=your_backup_gemini_api_key

# Weather
WEATHER_API_KEY=your_openweathermap_api_key

# News
GNEWS_API_KEY=your_gnews_api_key

# Currency Exchange
EXCHANGE_RATE_API_KEY=your_exchangerate_api_key

# YouTube & Google Books (same Google Cloud project)
YOUTUBE_API_KEY=your_google_cloud_api_key

# Movies & TV Shows
TMDB_API_KEY=your_tmdb_api_key

# Music
LASTFM_API_KEY=your_lastfm_api_key

# Podcasts
LISTENNOTES_API_KEY=your_listennotes_api_key

# Games
RAWG_API_KEY=your_rawg_api_key

# Recipes
SPOONACULAR_API_KEY=your_spoonacular_api_key
```

#### 5️⃣ Start the Backend Server
```bash
npm start
# Server runs on http://localhost:3000
```

### 📱 Usage

1. **Login**: Register or login with email/password via Firebase
2. **Choose Mode**: Select "Individual Mode" or "Coordinator Mode" from home screen
3. **Select Agent** (Individual Mode): Choose the agent that fits your needs
4. **Chat**: Send messages and receive AI responses
5. **Review History**: View your previous conversations

### 📂 Project Structure

```
AgentHub/
├── app/                          # Expo Router pages
│   ├── _layout.tsx              # Main layout and navigation
│   ├── index.tsx                # Home page (mode selection)
│   ├── login.tsx                # Login/Register screen
│   ├── individual.tsx           # Individual mode
│   ├── coordinate.tsx           # Coordinator mode
│   ├── chat.tsx                 # Chat screen
│   └── context/                 # React Context providers
├── services/                     # API services
│   └── chatService.ts           # Chat backend integration
├── assets/                       # Images, icons
├── AgentHub-Backend/            # Node.js Express backend
│   ├── server.js                # Main server file
│   ├── config/
│   │   └── agentPrompts.js      # Agent system prompts
│   ├── .env                     # Environment variables
│   └── package.json
├── android/                      # Android native code
├── ios/                          # iOS native code
├── app.json                      # Expo configuration
└── package.json
```

### 🔧 Customization

#### Adding a New Agent

1. **Backend**: Add new agent prompt to `AgentHub-Backend/config/agentPrompts.js`
2. **Server Logic**: Write agent logic in `server.js` (API integration if needed)
3. **Frontend**: Add new agent to the agent list

```javascript
// agentPrompts.js example
case '21':
  return `You are a ${agentName} agent. Your task: ...`;
```

### 🛡️ Security

- ✅ Secure user management with Firebase Authentication
- ✅ API keys stored in `.env` file
- ✅ CORS protection active
- ✅ Dual API Key fallback system (rate limit protection)

### 🤝 Contributing

We welcome your contributions! Please follow these steps:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 📄 License

This project is licensed under the MIT License.

### 👨‍💻 Developer

**Mustafa K.**
- GitHub: [@mustafak04](https://github.com/mustafak04)

### 📞 Contact

Feel free to open an issue for questions or suggestions.

### 🙏 Acknowledgments

- Google Gemini AI
- Expo and React Native team
- All open-source API providers

---

<div align="center">

**⭐ Projeyi beğendiyseniz yıldız vermeyi unutmayın! • Star this project if you like it! ⭐**

Made with ❤️ by [Mustafa K.](https://github.com/mustafak04)

</div>
