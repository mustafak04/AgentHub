const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

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
  
  // Bireysel mod için agent endpoint'i
  app.post('/api/agent', async (req, res) => {
    try {
      const { agentId, agentName, userMessage } = req.body;
  
      console.log(`📥 İstek alındı - Agent: ${agentName}, Mesaj: ${userMessage}`);

      // Agent'a özel sistem mesajı
      const systemMessage = getAgentSystemMessage(agentId);
  
      // Gemini 2.5 Flash modeli (ücretsiz ve hızlı)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
      // Prompt oluştur
      const prompt = `${systemMessage}\n\nKullanıcı: ${userMessage}`;
  
      // Gemini'ye istek gönder
      console.log('🤖 Gemini API çağrısı yapılıyor...');
      const result = await model.generateContent(prompt);
      let aiResponse = result.response.text();

      console.log(`✅ Cevap alındı: ${aiResponse.substring(0, 50)}...`);

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
            aiResponse = `Üzgünüm, "${city}" şehri için hava durumu bilgisi bulunamadı. Lütfen şehir adını kontrol edin veya daha büyük bir şehir adı kullanın.`;
          } else if (weatherError.response?.status === 401) {
            aiResponse = 'API anahtarı geçersiz. Lütfen sistem yöneticisine başvurun.';
          } else {
            aiResponse = 'Üzgünüm, hava durumu bilgisi alınamadı. Lütfen tekrar deneyin.';
          }
        }
      }
    }

      // ============ HABER AGENT (agentId === '4') ============
    if (agentId === '4' && aiResponse.includes('[NEWS:')) {
      const newsMatch = aiResponse.match(/\[NEWS:(.*?)\]/);
      if (newsMatch) {
        const topic = newsMatch[1].trim();
        
        console.log(`📰 Haber API'sine yönlendiriliyor: ${topic}`);

        try {
          const NEWS_API_KEY = process.env.NEWS_API_KEY;
          
          if (!NEWS_API_KEY) {
            throw new Error('NEWS_API_KEY tanımlı değil');
          }

          let newsUrl;
          if (topic.toLowerCase() === 'genel') {
            // Genel Türkiye haberleri
            newsUrl = `https://newsapi.org/v2/top-headlines?country=tr&apiKey=${NEWS_API_KEY}&pageSize=5`;
          } else {
            // Belirli konuda haberler (Türkçe)
            newsUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&language=tr&sortBy=publishedAt&apiKey=${NEWS_API_KEY}&pageSize=5`;
          }

          console.log(`📡 News API isteği: ${newsUrl}`);

          const newsResponse = await axios.get(newsUrl);
          const newsData = newsResponse.data;

          if (newsData.articles && newsData.articles.length > 0) {
            let newsText = `📰 **${topic === 'genel' ? 'Güncel Haberler' : topic.charAt(0).toUpperCase() + topic.slice(1) + ' Haberleri'}**\n\n`;
            
            newsData.articles.slice(0, 5).forEach((article, index) => {
              newsText += `${index + 1}. **${article.title}**\n`;
              if (article.description) {
                newsText += `   ${article.description.substring(0, 120)}...\n`;
              }
              newsText += `   📅 ${new Date(article.publishedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}\n`;
              newsText += `   🔗 ${article.source.name}\n\n`;
            });

            aiResponse = newsText.trim();
            console.log(`✅ ${newsData.articles.length} haber bulundu`);

          } else {
            aiResponse = `Üzgünüm, "${topic}" konusunda haber bulunamadı. Farklı bir konu deneyin.`;
            console.log('⚠️ Haber bulunamadı');
          }

        } catch (newsError) {
          console.error('❌ Haber API hatası:', newsError.response?.status, newsError.message);
          
          if (newsError.response?.status === 401) {
            aiResponse = 'Haber API anahtarı geçersiz. Lütfen sistem yöneticisine başvurun.';
          } else if (newsError.response?.status === 426) {
            aiResponse = 'News API ücretsiz planı yalnızca HTTPS destekler. Lütfen sistem yöneticisine başvurun.';
          } else if (newsError.response?.status === 429) {
            aiResponse = 'Günlük haber sorgulama limitine ulaşıldı. Lütfen daha sonra tekrar deneyin.';
          } else {
            aiResponse = 'Üzgünüm, haber bilgisi alınamadı. Lütfen tekrar deneyin.';
          }
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

  // Koordine mod için endpoint
app.post('/api/coordinate', async (req, res) => {
    try {
      const { userMessage } = req.body;
  
      const systemMessage = `Sen bir koordinatör yapay zeka asistanısın. Kullanıcının isteğini analiz et ve hangi agent(lar)ın işi yapması gerektiğini belirle. 
      Mevcut agentlar: Hava Durumu Agent, Hesap Makinesi Agent, Çeviri Agent, Haber Agent.
      Kullanıcının isteğine göre uygun cevabı ver ve hangi agentın devreye girdiğini belirt.`;
  
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `${systemMessage}\n\nKullanıcı: ${userMessage}`;
  
      const result = await model.generateContent(prompt);
      const aiResponse = result.response.text();
  
      res.json({
        success: true,
        response: aiResponse,
      });
    } catch (error) {
      console.error('Hata:', error);
      res.status(500).json({
        success: false,
        error: 'Bir hata oluştu: ' + error.message,
      });
    }
  });

  // Her agent için sistem mesajı belirleme fonksiyonu
function getAgentSystemMessage(agentId) {
    const agentMessages = {
      '1': `Sen bir hava durumu asistanısın. Kullanıcı sana bir şehir veya ilçe adı söylediğinde, önce şehir adını DOĞRU formata çevir, sonra şu formatta yanıt ver: [WEATHER:şehir_adı]

ÖNEMLİ KURALLAR:
1. Şehir/ilçe adlarını bulundukları ülkenin diline uygun karakterlerle yaz
2. Yanlış yazımları düzelt ve en yakın şehir/ilçe adını bul
3. İl ve ilçe birlikte verilirse, sadece ilçe adını al
4. İlk harfi büyük, diğerleri küçük yaz

ÖRNEKLER:
- "kutahya simav" -> [WEATHER:Simav]
- "izmir cigli" -> [WEATHER:Çiğli]
- "Ciglide" -> [WEATHER:Çiğli]
- "ciglide" -> [WEATHER:Çiğli]
- "ankara cankaya" -> [WEATHER:Çankaya]
- "istanbul" -> [WEATHER:İstanbul]
- "izmır" -> [WEATHER:İzmir]
- "eskisehir" -> [WEATHER:Eskişehir]
- "konya karatay" -> [WEATHER:Karatay]
- "bursa nilufer" -> [WEATHER:Nilüfer]

YAZI HATALARI İÇİN:
- "cilgi" veya "cigli" -> [WEATHER:Çiğli]
- "izmit" -> [WEATHER:İzmit]
- "kutahya" -> [WEATHER:Kütahya]

Eğer kullanıcı şehir adı söylemezse, yanıtla: "Hava durumunu öğrenmek istediğiniz şehir adını belirtmelisiniz".`,
      '2': 'Sen bir hesap makinesi asistanısın. Matematiksel hesaplamalar yap ve sonucu açıkla.',
      '3': 'Sen bir çeviri asistanısın. Diller arası çeviri yap ve çevirinin doğru olduğundan emin ol.',
      '4': `Sen bir haber asistanısın. 
Kullanıcı sana güncel haberler veya belirli bir konuyla ilgili haberler sorduğunda, şu formatta yanıt ver: [NEWS:konu]

KURALLAR:
1. Konu tek kelime veya kısa ifade olmalı
2. Türkçe karakterler kullan
3. Eğer konu belirtilmezse, genel haberler için "genel" yaz

ÖRNEKLER:
- "güncel haberler neler?" -> [NEWS:genel]
- "spor haberleri" -> [NEWS:spor]
- "teknoloji haberleri" -> [NEWS:teknoloji]
- "ekonomi" -> [NEWS:ekonomi]
- "türkiye haberleri" -> [NEWS:türkiye]

Eğer kullanıcı konu belirtmezse, hangi konuda haber istediğini sor.`,
    };
    return agentMessages[agentId] || 'Sen yardımcı bir yapay zeka asistanısın.';
  }

  // Hava durumu endpoint'i (Gerçek API entegrasyonu)
app.post('/api/agent', async (req, res) => {
  try {
    const { agentId, agentName, userMessage } = req.body;

    console.log(`📥 İstek alındı - Agent: ${agentName}, Mesaj: ${userMessage}`);

    const systemMessage = getAgentSystemMessage(agentId);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `${systemMessage}\n\nKullanıcı: ${userMessage}`;

    console.log('🤖 Gemini API çağrısı yapılıyor...');
    const result = await model.generateContent(prompt);
    let aiResponse = result.response.text();

    console.log(`✅ Gemini cevabı: ${aiResponse.substring(0, 50)}...`);

    // HAVA DURUMU AGENT (agentId === '1')
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
            aiResponse = `Üzgünüm, "${city}" şehri için hava durumu bilgisi bulunamadı. Lütfen şehir adını kontrol edin.`;
          } else if (weatherError.response?.status === 401) {
            aiResponse = 'API anahtarı geçersiz. Lütfen sistem yöneticisine başvurun.';
          } else {
            aiResponse = 'Üzgünüm, hava durumu bilgisi alınamadı. Lütfen tekrar deneyin.';
          }
        }
      }
    }

    // HABER AGENT (agentId === '4')
    if (agentId === '4' && aiResponse.includes('[NEWS:')) {
      const newsMatch = aiResponse.match(/\[NEWS:(.*?)\]/);
      if (newsMatch) {
        const topic = newsMatch[1].trim();
        
        console.log(`📰 Haber API'sine yönlendiriliyor: ${topic}`);

        try {
          const NEWS_API_KEY = process.env.NEWS_API_KEY;
          
          if (!NEWS_API_KEY) {
            throw new Error('NEWS_API_KEY tanımlı değil');
          }

          let newsUrl;
          if (topic.toLowerCase() === 'genel') {
            newsUrl = `https://newsapi.org/v2/top-headlines?country=tr&apiKey=${NEWS_API_KEY}&pageSize=5`;
          } else {
            newsUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&language=tr&sortBy=publishedAt&apiKey=${NEWS_API_KEY}&pageSize=5`;
          }

          const newsResponse = await axios.get(newsUrl);
          const newsData = newsResponse.data;

          if (newsData.articles && newsData.articles.length > 0) {
            let newsText = `📰 **${topic === 'genel' ? 'Güncel Haberler' : topic.charAt(0).toUpperCase() + topic.slice(1) + ' Haberleri'}**\n\n`;
            
            newsData.articles.slice(0, 5).forEach((article, index) => {
              newsText += `${index + 1}. **${article.title}**\n`;
              if (article.description) {
                newsText += `   ${article.description.substring(0, 100)}...\n`;
              }
              newsText += `   📅 ${new Date(article.publishedAt).toLocaleDateString('tr-TR')}\n`;
              newsText += `   🔗 ${article.source.name}\n\n`;
            });

            aiResponse = newsText.trim();
            console.log('✅ Haber bilgisi başarıyla alındı');

          } else {
            aiResponse = `Üzgünüm, "${topic}" konusunda haber bulunamadı.`;
          }

        } catch (newsError) {
          console.error('❌ Haber API hatası:', newsError.message);
          
          if (newsError.response?.status === 401) {
            aiResponse = 'API anahtarı geçersiz. Lütfen sistem yöneticisine başvurun.';
          } else if (newsError.response?.status === 429) {
            aiResponse = 'Günlük haber sorgulama limitine ulaşıldı. Lütfen daha sonra tekrar deneyin.';
          } else {
            aiResponse = 'Üzgünüm, haber bilgisi alınamadı. Lütfen tekrar deneyin.';
          }
        }
      }
    }

    res.json({
      success: true,
      agentName: agentName,
      response: aiResponse,
    });
  } catch (error) {
    console.error('❌ Hava durumu hatası:', error.message);

    let errorMessage = 'Hava durumu bilgisi alınamadı.';
    
    if (error.response?.status === 404) {
      errorMessage = 'Şehir bulunamadı. Lütfen şehir adını kontrol edin.';
    } else if (error.response?.status === 401) {
      errorMessage = 'API anahtarı geçersiz. Lütfen API anahtarınızı kontrol edin.';
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});
  // Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`✅ Sunucu http://localhost:${PORT} adresinde çalışıyor`);
    console.log(`📡 Gemini API bağlantısı hazır`);
  });