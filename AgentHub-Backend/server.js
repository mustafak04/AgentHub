const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const { getAgentPrompt } = require('./config/agentPrompts');

// Express uygulaması oluştur
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware'ler
app.use(cors());
app.use(express.json());

// Gemini istemcisi oluştur
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Test endpoint'i - Sunucunun çalıştığını kontrol etmek için
app.get('/', (req, res) => {
    res.json({ message: 'AgentHub Backend (Gemini API) çalışıyor!' });
  });
  
// Bireysel mod endpoint
app.post('/api/agent', async (req, res) => {
  try {
    const { agentId, agentName, userMessage } = req.body;

    console.log(`📥 İstek alındı - Agent: ${agentName}, Mesaj: ${userMessage}`);

    const systemMessage = getAgentPrompt(agentId);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `${systemMessage}\n\nKullanıcı: ${userMessage}`;

    console.log('🤖 Gemini API çağrısı yapılıyor...');
    const result = await model.generateContent(prompt);
    let aiResponse = result.response.text();

    console.log(`✅ Gemini cevabı: ${aiResponse.substring(0, 100)}...`);

    // ============ HAVA DURUMU AGENT (agentId === '1') ============
    if (agentId === '1' && aiResponse.includes('[WEATHER:')) {
      const cityMatch = aiResponse.match(/\[WEATHER:(.*?)\]/);
      if (cityMatch) {
        const city = cityMatch[1].trim();
        
        console.log(`🌤️ Hava durumu API'sine yönlendiriliyor: ${city}`);

        try {
          const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
          
          if (!WEATHER_API_KEY) {
            throw new Error('WEATHER_API_KEY tanımlı değil');
          }

          const weatherResponse = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric&lang=tr`
          );

          const weatherData = weatherResponse.data;

          aiResponse = `
📍 **${weatherData.name}, ${weatherData.sys.country}**

🌡️ Sıcaklık: ${weatherData.main.temp}°C (Hissedilen: ${weatherData.main.feels_like}°C)
☁️ Durum: ${weatherData.weather[0].description}
💧 Nem: ${weatherData.main.humidity}%
💨 Rüzgar: ${weatherData.wind.speed} m/s
🌅 Gün doğumu: ${new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
🌇 Gün batımı: ${new Date(weatherData.sys.sunset * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          `.trim();

          console.log('✅ Hava durumu bilgisi başarıyla alındı');

        } catch (weatherError) {
          console.error('❌ Hava durumu hatası:', weatherError.message);
          
          if (weatherError.response?.status === 404) {
            aiResponse = `Üzgünüm, "${city}" şehri için hava durumu bilgisi bulunamadı.`;
          } else if (weatherError.response?.status === 401) {
            aiResponse = 'Hava durumu API anahtarı geçersiz.';
          } else {
            aiResponse = 'Üzgünüm, hava durumu bilgisi alınamadı.';
          }
        }
      }
    }

    // ============ HABER AGENT (agentId === '4') ============
    if (agentId === '4' && aiResponse.includes('[NEWS:')) {
      const newsMatch = aiResponse.match(/\[NEWS:(.*?)\|(.*?)\|(.*?)\]/);
      
      if (newsMatch) {
        const topic = newsMatch[1].trim();
        const language = newsMatch[2].trim();
        const country = newsMatch[3].trim();

        console.log(`📰 PARSE SONUCU - Konu: "${topic}", Dil: "${language}", Ülke: "${country}"`);
      
        try {
          const NEWS_API_KEY = process.env.NEWS_API_KEY;
          if (!NEWS_API_KEY) throw new Error('NEWS_API_KEY tanımlı değil');
        
          let newsData = null;
          let usedEndpoint = '';

          // AŞAMA 1: Önce top-headlines dene (global hariç)
          if (country !== 'global') {
            console.log(`🏳️ AŞAMA 1: /v2/top-headlines deneniyor (country=${country})`);
            
            const topHeadlinesUrl = topic.toLowerCase() === 'genel'
              ? `https://newsapi.org/v2/top-headlines?country=${country}&apiKey=${NEWS_API_KEY}&pageSize=5`
              : `https://newsapi.org/v2/top-headlines?country=${country}&q=${encodeURIComponent(topic)}&apiKey=${NEWS_API_KEY}&pageSize=5`;
            
            console.log(`📡 İstek 1: ${topHeadlinesUrl}`);
            
            try {
              const response = await axios.get(topHeadlinesUrl);
              if (response.data.articles && response.data.articles.length > 0) {
                newsData = response.data;
                usedEndpoint = 'top-headlines';
                console.log(`✅ ${newsData.articles.length} haber bulundu (top-headlines)`);
              } else {
                console.log(`⚠️ top-headlines'da haber yok, everything deneniyor...`);
              }
            } catch (error) {
              console.log(`⚠️ top-headlines hatası: ${error.message}, everything deneniyor...`);
            }
          }

          // AŞAMA 2: top-headlines boşsa veya global ise everything dene
          if (!newsData) {
            console.log(`🌐 AŞAMA 2: /v2/everything deneniyor (language=${language})`);
            
            const everythingUrl = topic.toLowerCase() === 'genel'
              ? `https://newsapi.org/v2/everything?language=${language}&sortBy=publishedAt&apiKey=${NEWS_API_KEY}&pageSize=5`
              : `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&language=${language}&sortBy=publishedAt&apiKey=${NEWS_API_KEY}&pageSize=5`;
            
            console.log(`📡 İstek 2: ${everythingUrl}`);
            
            const response = await axios.get(everythingUrl);
            newsData = response.data;
            usedEndpoint = 'everything';
            console.log(`📊 ${newsData.articles?.length || 0} haber bulundu (everything)`);
          }
        
          // Sonuçları işle
          if (newsData && newsData.articles && newsData.articles.length > 0) {
            let newsDataText = '';
            newsData.articles.slice(0, 5).forEach((article, i) => {
              newsDataText += `Haber ${i + 1}:\nBaşlık: ${article.title}\nAçıklama: ${article.description || 'Yok'}\nTarih: ${article.publishedAt}\nKaynak: ${article.source.name}\n\n`;
            });

            const formatPrompt = `Ham haber verilerini kullanıcı dostu formatta düzenle.

BİLGİLER:
- Konu: ${topic}
- Kullanıcının dili: ${language} (MUTLAKA bu dilde yanıt ver!)
- Ülke: ${country === 'global' ? 'Dünya' : country.toUpperCase()}

KURALLAR:
1. Kullanıcının dilinde (${language}) yanıt ver
2. Başlık ekle (emoji: 📰 veya 🌍)
3. Her haberi numaralandır
4. Format: Başlık, özet (max 120 kar), tarih, kaynak
5. Emoji kullan: 📅, 🔗

HABERLER:
${newsDataText}`;

            const formatModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const formatResult = await formatModel.generateContent(formatPrompt);
            aiResponse = formatResult.response.text();

            console.log(`✅ FORMATLANDIRMA TAMAM (kaynak: ${usedEndpoint})`);
          
          } else {
            console.log('❌ HER İKİ ENDPOINT\'TE DE HABER BULUNAMADI');
            
            const noNewsPrompt = `Kullanıcı "${topic}" hakkında haber istedi ama bulunamadı. Dili: ${language}. Kısa ve nazik mesaj yaz.`;
            const noNewsModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const noNewsResult = await noNewsModel.generateContent(noNewsPrompt);
            aiResponse = noNewsResult.response.text();
          }
        
        } catch (newsError) {
          console.error('❌ GENEL HATA:', newsError.message);

          const msgs = {
            'tr': 'Haber servisi kullanılamıyor.',
            'en': 'News service unavailable.',
          };
          aiResponse = msgs[language] || msgs['en'];
        }
      }
    }

    res.json({
      success: true,
      agentName: agentName,
      response: aiResponse,
    });
  } catch (error) {
    console.error('❌ HATA DETAYI:', error);
    console.error('Hata Mesajı:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Bir hata oluştu',
    });
  }
});

// Koordine mod endpoint
app.post('/api/coordinate', async (req, res) => {
  try {
    const { userMessage } = req.body;

    console.log(`📥 Koordine mod isteği - Mesaj: ${userMessage}`);

    const systemMessage = `Sen bir koordinatör yapay zeka asistanısın. Kullanıcının isteğini analiz et ve hangi agent(lar)ın işi yapması gerektiğini belirle. 
    Mevcut agentlar: Hava Durumu Agent, Hesap Makinesi Agent, Çeviri Agent, Haber Agent.
    Kullanıcının isteğine göre uygun cevabı ver ve hangi agentın devreye girdiğini belirt.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `${systemMessage}\n\nKullanıcı: ${userMessage}`;

    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();

    console.log(`✅ Koordine cevap alındı`);

    res.json({
      success: true,
      response: aiResponse,
    });
  } catch (error) {
    console.error('❌ HATA DETAYI:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Bir hata oluştu',
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Sunucu http://localhost:${PORT} adresinde çalışıyor`);
  console.log(`📡 Gemini API bağlantısı hazır`);
});