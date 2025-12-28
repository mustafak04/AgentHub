const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cheerio = require('cheerio');
const axios = require('axios');
const { getAgentPrompt } = require('./config/agentPrompts');

// Express uygulaması oluştur
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware'ler
app.use(cors());
app.use(express.json());

// Gemini istemcisi oluştur (Primary)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Gemini istemcisi oluştur (Backup)
const genAI_Backup = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_BACKUP);

// ============ GEMINI DUAL API HELPER (İki API Key Fallback) ============
async function generateAIResponse(systemMessage, userMessage) {
  try {
    console.log('🤖 Gemini API (Primary) çağrısı yapılıyor...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `${systemMessage}\n\nKullanıcı: ${userMessage}`;
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();
    console.log(`✅ Gemini cevabı (Primary): ${aiResponse.substring(0, 100)}...`);
    return aiResponse;
  } catch (error) {
    // Rate limit veya başka hata durumunda backup key kullan
    if (error.message && (error.message.includes('429') || error.message.includes('quota') || error.message.includes('Too Many Requests'))) {
      console.warn('⚠️ Primary API rate limit, Backup API key kullanılıyor...');
    } else {
      console.warn('⚠️ Primary API hatası, Backup API key deneniyor...');
    }

    try {
      const backupModel = genAI_Backup.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const backupPrompt = `${systemMessage}\n\nKullanıcı: ${userMessage}`;
      const backupResult = await backupModel.generateContent(backupPrompt);
      const backupResponse = backupResult.response.text();
      console.log(`✅ Gemini cevabı (Backup): ${backupResponse.substring(0, 100)}...`);
      return backupResponse;
    } catch (backupError) {
      console.error('❌ Her iki Gemini API de başarısız:', backupError.message);
      throw new Error('Her iki Gemini API key de başarısız oldu.');
    }
  }
}

// AGENT LOGİC FONKSİYONU (Internal Call İçin)
async function processAgentRequest(agentId, agentName, userMessage) {
  try {
    console.log(`📥 İstek alındı - Agent: ${agentName}, Mesaj: ${userMessage}`);
    const systemMessage = getAgentPrompt(agentId);
    // Fallback destekli AI response al
    let aiResponse = await generateAIResponse(systemMessage, userMessage);
    // ============ HAVA DURUMU AGENT (agentId === '1') ============
    if (agentId === '1' && aiResponse.includes('[WEATHER:')) {
      const cityMatch = aiResponse.match(/\[WEATHER:(.*?)\]/);
      if (cityMatch) {
        const city = cityMatch[1].trim();
        console.log(`🌤️ Hava durumu API'sine yönlendiriliyor: ${city}`);
        try {
          const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
          if (!WEATHER_API_KEY) throw new Error('WEATHER_API_KEY tanımlı değil');
          const weatherResponse = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric&lang=tr`
          );
          const weatherData = weatherResponse.data;
          const summary = `
📍 **${weatherData.name}, ${weatherData.sys.country}**
🌡️ Sıcaklık: ${weatherData.main.temp}°C (Hissedilen: ${weatherData.main.feels_like}°C)
`.trim();

          const detail = `
📍 **${weatherData.name}, ${weatherData.sys.country}**
🌡️ Sıcaklık: ${weatherData.main.temp}°C (Hissedilen: ${weatherData.main.feels_like}°C)
☁️ Durum: ${weatherData.weather[0].description}
💧 Nem: ${weatherData.main.humidity}%
💨 Rüzgar: ${weatherData.wind.speed} m/s
🌅 Gün doğumu: ${new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
🌇 Gün batımı: ${new Date(weatherData.sys.sunset * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
`.trim();

          aiResponse = `${summary}\n\n---\n\n${detail}`;
          console.log('✅ Hava durumu bilgisi başarıyla alındı');
        } catch (weatherError) {
          console.error('❌ Hava durumu hatası:', weatherError.message);
          aiResponse = weatherError.response?.status === 404
            ? `Üzgünüm, "${city}" şehri için hava durumu bilgisi bulunamadı.`
            : 'Üzgünüm, hava durumu bilgisi alınamadı.';
        }
      }
    }
    // ============ HESAP MAKİNESİ AGENT (agentId === '2') ============
    if (agentId === '2') {
      console.log('✅ Hesap makinesi agentı yanıtı oluşturuldu.');
      // Gemini zaten hesaplama yaptı, aiResponse kullan

      // Regex: "Sonuç" kelimesini ve olası ** işaretlerini esnek şekilde yakala
      const resultMatch = aiResponse.match(/(?:\*\*|)?Sonuç(?:\*\*|)?:\s*(.*)/i);
      const stepsMatch = aiResponse.match(/(?:\*\*|)?Adım Adım Çözüm(?:\*\*|)?:\s*([\s\S]*?)(?:\*\*|)?Sonuç/i);

      if (resultMatch && stepsMatch) {
        let resultValue = resultMatch[1].trim();
        // Eğer sonuç ** ile bitiyorsa veya başlıyorsa temizle
        resultValue = resultValue.replace(/^\*\*|\*\*$/g, '').trim();

        // Eğer sonuç boşsa ve adımların sonunda bir sayı varsa onu almaya çalış (Fallback)
        if (!resultValue && stepsMatch[1]) {
          const lastNumberMatch = stepsMatch[1].match(/=\s*(\d+[\.,]?\d*)\s*(\*\*|)?\s*$/);
          if (lastNumberMatch) {
            resultValue = lastNumberMatch[1];
          }
        }

        const resultText = `Sonuç: ${resultValue}`;
        const stepsText = `Adım Adım Çözüm:\n${stepsMatch[1].trim()}\n\n${resultText}`;

        aiResponse = `${resultText}\n\n---\n\n${stepsText}`;
      }
    }
    // ============ ÇEVİRİ AGENT (agentId === '3') ============
    if (agentId === '3' && aiResponse.includes('[TRANSLATE:')) {
      const match = aiResponse.match(/\[TRANSLATE:(.*?)\|(.*?)\|(.*?)\]/);
      if (match) {
        const translation = match[1].trim();
        const sourceLang = match[2].trim();
        const targetLang = match[3].trim();

        aiResponse = `Çeviri (${sourceLang} → ${targetLang}):\n[${translation}]`.trim();
        console.log(`✅ Çeviri: ${sourceLang} → ${targetLang} | ${translation}`);
      }
    }
    // ============ HABER AGENT (agentId === '4') ============
    if (agentId === '4' && aiResponse.includes('[NEWS:')) {
      const match = aiResponse.match(/\[NEWS:(.*?)\|(.*?)\|(.*?)\]/);
      if (match) {
        const topic = match[1].trim();
        const language = match[2].trim();
        const country = match[3].trim();
        console.log(`📰 Haber isteği: ${topic} | Dil: ${language} | Ülke: ${country}`);
        try {
          const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
          if (!GNEWS_API_KEY) throw new Error('GNEWS_API_KEY tanımlı değil');
          const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(topic)}&lang=${language}&country=${country}&max=3&apikey=${GNEWS_API_KEY}`;
          console.log(`📡 GNews API isteği: ${url}`);
          const response = await axios.get(url);
          const articles = response.data.articles || [];
          if (!articles.length) {
            console.log('⚠️ Haber bulunamadı');
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const result = await model.generateContent(
              `Kullanıcı "${topic}" hakkında haber istedi ama bulunamadı. Dili: ${language}. Yanıtı, mesajın dilinde ve nezaketli şekilde ver.`
            );
            aiResponse = result.response.text();
          } else {
            let rawList = articles.map((a, i) =>
              `{
      "sıra": ${i + 1},
      "başlık": "${a.title}",
      "açıklama": "${a.description || '-'}",
      "kaynak": "${a.source.name}",
      "tarih": "${a.publishedAt}",
      "link": "[${a.source.name}](${a.url})"
    }`
            ).join(',\n');
            const formatPrompt = `
          Kullanıcıya haber kartlarını aşağıdaki veriyle sunmalısın. Yanıtı, kullanıcının mesajındaki dilde (code: ${language}) üret.

          YANIT FORMATI:
          Sadece ve sadece aşağıdaki formatı kullan. Hiçbir giriş cümlesi (İşte haberler vb.) veya başlık (ÖZET KISMI vb.) yazma.
          
          [ÖZET LİSTESİ BURAYA]
          ---
          [DETAYLI LİSTE BURAYA]

          1. ÖZET LİSTESİ FORMATI (Açıklama YOK):
          📰 [Sıra]. [Başlık]
          Kaynak: [Kaynak Adı] • Tarih: [Tarih]
          🔗 [Link](URL)
          (Boş satır)

          2. DETAYLI LİSTE FORMATI (Açıklama VAR):
          📰 [Sıra]. [Başlık]
          📝 [Açıklama]
          Kaynak: [Kaynak Adı] • Tarih: [Tarih]
          🔗 [Link](URL)
          (Boş satır)

          KURALLAR:
          - "İşte haberler", "Özet Kısımı", "Detaylı Kısım" gibi başlıklar ASLA yazma.
          - Direkt olarak ilk haberle başla.
          - İki kısım arasında sadece "---" olsun.
          - Tarihi doğal yaz (26 Ekim 2025).
          - Linkleri Markdown yap: [Link](URL).
          
          Veri Listesi:
          [${rawList}]
          `;
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const result = await model.generateContent(formatPrompt);
            aiResponse = result.response.text();

            // Temizlik (AI bazen inatçı olabilir)
            aiResponse = aiResponse.replace(/İşte haber kartlarınız:?/gi, '')
              .replace(/\*\*ÖZET KISMI\*\*/gi, '')
              .replace(/\*\*DETAYLI KISIM\*\*/gi, '')
              .replace(/ÖZET KISMI/gi, '')
              .replace(/DETAYLI KISIM/gi, '')
              .trim();

            console.log(`✅ ${articles.length} haber bulundu ve detaylı formatlandı`);
          }
        } catch (err) {
          console.error('❌ GNews Hatası:', err.message);
          aiResponse = 'Üzgünüm, haber servisine şu anda ulaşılamıyor.';
        }
      }
    }
    // ============ WIKIPEDIA AGENT (agentId === '5') ============
    if (agentId === '5' && aiResponse.includes('[WIKI:')) {
      const match = aiResponse.match(/\[WIKI:(.*?)\|(.*?)\]/);
      if (match) {
        const topic = match[1].trim().replace(/\s+/g, '_');
        const lang = match[2].trim().toLowerCase();
        const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`;
        console.log(`📡 Wikipedia API isteği: ${url}`);
        try {
          const { data: wikiData } = await axios.get(url, {
            headers: {
              'User-Agent': 'AgentHub/1.0 (https://github.com/mustafak04; mustafa@agenthub.app)',
              'Accept': 'application/json'
            }
          });
          const title = wikiData.title;
          const description = wikiData.description ? `(${wikiData.description})` : '';
          const extract = wikiData.extract;
          const link = wikiData.content_urls && wikiData.content_urls.desktop ? wikiData.content_urls.desktop.page : '';
          const formattedLink = link ? `\n🔗 [Wikipedia](${link})` : '';

          // ÖZET: Başlık + Açıklama + Link
          const summary = `📚 ${title} ${description}${formattedLink}`.trim();

          // DETAY: Başlık + Açıklama + Uzun Metin + Link
          const detail = `📚 ${title} ${description}\n${extract}${formattedLink}`.trim();

          aiResponse = `${summary}\n\n---\n\n${detail}`;
          console.log('✅ Wikipedia özeti döndürüldü');
        } catch (err) {
          aiResponse = lang === 'tr'
            ? 'Üzgünüm, istenen maddeyle ilgili Wikipedia özetine ulaşılamadı.'
            : 'Sorry, could not find a summary for this topic on Wikipedia.';
          console.error('❌ Wikipedia API hatası:', err.message);
        }
      }
    }
    // ============ DÖVİZ KURU AGENT (agentId === '6') ============
    if (agentId === '6' && aiResponse.includes('[EXCHANGE:')) {
      const match = aiResponse.match(/\[EXCHANGE:(.*?)[\|_](.*?)\]/);
      if (match) {
        const fromCurrency = match[1].trim().toUpperCase();
        const toCurrency = match[2].trim().toUpperCase();
        console.log(`💱 Döviz kuru isteği: ${fromCurrency} → ${toCurrency}`);
        try {
          const EXCHANGE_RATE_API_KEY = process.env.EXCHANGE_RATE_API_KEY;
          if (!EXCHANGE_RATE_API_KEY) throw new Error('EXCHANGE_RATE_API_KEY tanımlı değil');
          const url = `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}/pair/${fromCurrency}/${toCurrency}`;
          console.log(`📡 ExchangeRate API isteği: ${url}`);
          const response = await axios.get(url);
          if (response.data.result === 'success') {
            const rate = response.data.conversion_rate;
            const lastUpdate = new Date(response.data.time_last_update_unix * 1000).toLocaleString('tr-TR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            const summary = `
💱 **GÜNCEL DÖVİZ KURU**
${fromCurrency} → ${toCurrency}
**1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}**
`.trim();

            const detail = `
📊 **Örnek Çevrimler:**
• 10 ${fromCurrency} = ${(rate * 10).toFixed(2)} ${toCurrency}
• 100 ${fromCurrency} = ${(rate * 100).toFixed(2)} ${toCurrency}
• 1000 ${fromCurrency} = ${(rate * 1000).toFixed(2)} ${toCurrency}
🕐 Son Güncelleme: ${lastUpdate}
`.trim();

            aiResponse = `${summary}\n\n---\n\n${summary}\n\n${detail}`;
            console.log(`✅ Döviz kuru başarıyla alındı: 1 ${fromCurrency} = ${rate} ${toCurrency}`);
          } else {
            console.log('⚠️ Döviz kuru bulunamadı');
            aiResponse = `Üzgünüm, "${fromCurrency}" → "${toCurrency}" döviz kuru bilgisi bulunamadı. Lütfen para birimi kodlarını kontrol edin.`;
          }
        } catch (exchangeError) {
          console.error('❌ Döviz kuru hatası:', exchangeError.message);
          aiResponse = exchangeError.response?.status === 404
            ? `Üzgünüm, "${fromCurrency}" veya "${toCurrency}" para birimi tanınmıyor.`
            : 'Üzgünüm, döviz kuru bilgisi şu anda alınamıyor.';
        }
      }
    }
    // ============ KOD ASİSTANI AGENT (agentId === '7') ============
    if (agentId === '7') {
      // Gemini zaten kod asistanı olarak çalışacak
      console.log('✅ Kod asistanı yanıtı oluşturuldu.');

      // Kod bloklarını ayıkla (```...```)
      const codeBlockRegex = /```[\s\S]*?```/g;
      const codeBlocks = aiResponse.match(codeBlockRegex);

      if (codeBlocks && codeBlocks.length > 0) {
        // Sadece kod bloklarını birleştir
        const summary = codeBlocks.join('\n\n');
        // Detay olarak tüm yanıtı ver
        const detail = aiResponse;

        aiResponse = `${summary}\n\n---\n\n${detail}`;
      }
    }
    // ============ AI GÖRSEL OLUŞTURMA AGENT (agentId === '8') ============
    if (agentId === '8' && aiResponse.includes('[IMAGE:')) {
      const match = aiResponse.match(/\[IMAGE:(.*?)\]/);
      if (match) {
        const prompt = match[1].trim();
        console.log(`🎨 Görsel oluşturuluyor: ${prompt.substring(0, 50)}...`);

        try {
          // Pollinations.AI - Ücretsiz, API key gerekmez, çok hızlı!
          const encodedPrompt = encodeURIComponent(prompt);
          const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&enhance=true`;

          const summary = `![AI Generated Image](${imageUrl})`;
          const detail = `🎨 **Prompt:** ${prompt}`;

          aiResponse = `${summary}\n\n---\n\n${summary}\n\n${detail}`;

          console.log('✅ Görsel başarıyla oluşturuldu (Pollinations.AI)');
        } catch (imageError) {
          console.error('❌ Görsel oluşturma hatası:', imageError.message);
          aiResponse = 'Üzgünüm, görsel oluşturulamadı. Lütfen tekrar deneyin.';
        }
      }
    }
    // ============ YOUTUBE ARAMA AGENT (agentId === '9') ============
    if (agentId === '9' && aiResponse.includes('[YOUTUBE:')) {
      const match = aiResponse.match(/\[YOUTUBE:(.*?)\]/);
      if (match) {
        const searchQuery = match[1].trim();
        console.log(`🎬 YouTube araması: ${searchQuery}`);
        try {
          const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
          if (!YOUTUBE_API_KEY) throw new Error('YOUTUBE_API_KEY tanımlı değil');

          // 1. Video ara
          const searchResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
              part: 'snippet',
              q: searchQuery,
              type: 'video',
              maxResults: 5,
              key: YOUTUBE_API_KEY
            }
          });

          const videos = searchResponse.data.items;

          if (!videos.length) {
            aiResponse = `"${searchQuery}" için video bulunamadı.`;
          } else {
            // 2. Video ID'lerini topla
            const videoIds = videos.map(v => v.id.videoId).join(',');

            // 3. Statistics al (izlenme, beğeni)
            const statsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
              params: {
                part: 'statistics',
                id: videoIds,
                key: YOUTUBE_API_KEY
              }
            });

            const statsMap = {};
            statsResponse.data.items.forEach(item => {
              statsMap[item.id] = item.statistics;
            });

            // 4. Formatlı liste oluştur
            // ÖZET: Sadece ilk video, görsel yok, link metni "Video"
            const firstVideo = videos[0];
            const fTitle = firstVideo.snippet.title;
            const fChannel = firstVideo.snippet.channelTitle;
            const fId = firstVideo.id.videoId;
            const fUrl = `https://www.youtube.com/watch?v=${fId}`;
            const fStats = statsMap[fId];
            const fView = fStats ? formatNumber(fStats.viewCount) : 'N/A';
            const fLike = fStats ? formatNumber(fStats.likeCount) : 'N/A';

            const summary = `🎬 **"${searchQuery}" için ${videos.length} video bulundu:**\n\n**1. ${fTitle}**\n📺 ${fChannel} • 👁️ ${fView} • 👍 ${fLike}\n[🔗 Video](${fUrl})`;

            // DETAY: Tüm videolar, görselli, link metni "Video"
            let detail = `🎬 **"${searchQuery}" için ${videos.length} video bulundu:**\n\n`;

            videos.forEach((video, index) => {
              const title = video.snippet.title;
              const channelTitle = video.snippet.channelTitle;
              const videoId = video.id.videoId;
              const thumbnail = video.snippet.thumbnails.medium.url;
              const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

              // İstatistikler
              const stats = statsMap[videoId];
              const viewCount = stats ? formatNumber(stats.viewCount) : 'N/A';
              const likeCount = stats ? formatNumber(stats.likeCount) : 'N/A';

              detail += `**${index + 1}. ${title}**\n`;
              detail += `📺 ${channelTitle} • 👁️ ${viewCount} • 👍 ${likeCount}\n`;
              detail += `[🔗 Video](${videoUrl})\n`;
              detail += `![${title}](${thumbnail})\n\n`;
            });

            aiResponse = `${summary}\n\n---\n\n${detail}`;
          }
          console.log('✅ YouTube sonuçları döndürüldü');
        } catch (youtubeError) {
          console.error('❌ YouTube API hatası:', youtubeError.message);

          if (youtubeError.response?.status === 403) {
            aiResponse = 'YouTube API kotası doldu veya API key geçersiz.';
          } else {
            aiResponse = 'Üzgünüm, YouTube araması yapılamadı.';
          }
        }
      }
    }
    // Helper function: Sayı formatlama
    function formatNumber(num) {
      const n = parseInt(num);
      if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
      return n.toString();
    }
    // ============ KİTAP ÖNERİ AGENT (agentId === '10') ============
    if (agentId === '10' && aiResponse.includes('[BOOK:')) {
      const match = aiResponse.match(/\[BOOK:(.*?)\]/);
      if (match) {
        const searchQuery = match[1].trim();
        console.log(`📚 Kitap araması: ${searchQuery}`);
        try {
          // YouTube API key'i kullan (aynı Google Cloud projesi)
          const GOOGLE_API_KEY = process.env.YOUTUBE_API_KEY;
          if (!GOOGLE_API_KEY) throw new Error('YOUTUBE_API_KEY tanımlı değil');
          const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
            params: {
              q: searchQuery,
              maxResults: 5,
              key: GOOGLE_API_KEY
            }
          });
          const books = response.data.items;
          if (!books || books.length === 0) {
            aiResponse = `"${searchQuery}" için kitap bulunamadı.`;
          } else {
            // 4. Formatlı liste oluştur
            // ÖZET: Sadece ilk kitap, temel bilgiler (Başlık, Yazar, Sayfa, Puan, Link)
            const firstBook = books[0];
            const fVol = firstBook.volumeInfo;
            const fTitle = fVol.title || 'Başlık yok';
            const fAuthors = fVol.authors ? fVol.authors.join(', ') : 'Yazar bilinmiyor';
            const fPage = fVol.pageCount || 'N/A';
            const fRating = fVol.averageRating || 'N/A';
            const fLink = fVol.previewLink || fVol.infoLink || '';

            const summary = `📚 **"${searchQuery}" için ${books.length} kitap bulundu:**\n\n**1. ${fTitle}**\n✍️ Yazar: ${fAuthors}\n📖 ${fPage} sayfa • ⭐ ${fRating}\n[🔗 Detaylar](${fLink})`;

            // DETAY: Tüm kitaplar, full bilgi
            let detail = `📚 **"${searchQuery}" için ${books.length} kitap bulundu:**\n\n`;

            books.forEach((book, index) => {
              const volumeInfo = book.volumeInfo;
              const title = volumeInfo.title || 'Başlık yok';
              const authors = volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Yazar bilinmiyor';
              const publisher = volumeInfo.publisher || 'N/A';
              const publishedDate = volumeInfo.publishedDate || 'N/A';
              const pageCount = volumeInfo.pageCount || 'N/A';
              const averageRating = volumeInfo.averageRating || 'N/A';
              const description = volumeInfo.description
                ? volumeInfo.description.substring(0, 200) + '...'
                : 'Açıklama yok';
              const thumbnail = volumeInfo.imageLinks?.thumbnail || '';
              const previewLink = volumeInfo.previewLink || volumeInfo.infoLink || '';

              detail += `**${index + 1}. ${title}**\n`;
              detail += `✍️ Yazar: ${authors}\n`;
              detail += `📖 ${pageCount} sayfa • ⭐ ${averageRating}\n`;
              detail += `📅 ${publisher} (${publishedDate})\n`;
              detail += `📝 ${description}\n`;
              if (previewLink) {
                detail += `[🔗 Detaylar](${previewLink})\n`;
              }
              if (thumbnail) {
                detail += `![${title}](${thumbnail})\n`;
              }
              detail += `\n`;
            });
            aiResponse = `${summary}\n\n---\n\n${detail}`;
          }
          console.log('✅ Kitap sonuçları döndürüldü');
        } catch (bookError) {
          console.error('❌ Google Books API hatası:', bookError.message);

          if (bookError.response?.status === 403) {
            aiResponse = 'Google Books API kotası doldu veya API key geçersiz.';
          } else {
            aiResponse = 'Üzgünüm, kitap araması yapılamadı.';
          }
        }
      }
    }
    // ============ ÖZET ÇIKARMA AGENT (agentId === '11') ============
    if (agentId === '11') {
      // URL özetleme
      if (aiResponse.includes('[SUMMARIZE_URL:')) {
        const match = aiResponse.match(/\[SUMMARIZE_URL:(.*?)\]/);
        if (match) {
          const url = match[1].trim();
          console.log(`📝 URL özetleniyor: ${url}`);
          try {
            const response = await axios.get(url, {
              timeout: 10000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });

            const $ = cheerio.load(response.data);
            $('script, style, nav, header, footer, aside').remove();

            let textContent = '';
            $('article, main, .content, .post, p').each((i, elem) => {
              textContent += $(elem).text() + ' ';
            });

            textContent = textContent.replace(/\s+/g, ' ').trim();

            if (!textContent || textContent.length < 100) {
              aiResponse = 'Üzgünüm, bu URL\'den yeterli metin çıkaramadım.';
            } else {
              const limitedText = textContent.substring(0, 3000);
              const summaryPrompt = `Aşağıdaki metni özetle. Türkçe özet yaz, kısa ve öz ol:\n\n${limitedText}`;

              const summaryModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
              const summaryResult = await summaryModel.generateContent(summaryPrompt);
              const fullSummary = summaryResult.response.text();

              // İlk cümleyi bul (Nokta ile biten ilk kısım)
              const firstSentenceMatch = fullSummary.match(/.*?[.!?]/);
              const firstSentence = firstSentenceMatch ? firstSentenceMatch[0] : fullSummary.substring(0, 100) + '...';

              const summaryPart = `📝 **Özet:** ${firstSentence}\n\n[🔗 Kaynak](${url})`;
              const detailPart = `📝 **Özet:**\n\n${fullSummary}\n\n[🔗 Kaynak](${url})`;

              aiResponse = `${summaryPart}\n\n---\n\n${detailPart}`;
            }

            console.log('✅ URL özeti oluşturuldu');
          } catch (scrapeError) {
            console.error('❌ Web scraping hatası:', scrapeError.message);
            aiResponse = scrapeError.code === 'ENOTFOUND'
              ? 'URL bulunamadı. Lütfen geçerli bir URL girin.'
              : 'Üzgünüm, bu sayfayı özetleyemedim.';
          }
        }
      }
      // Metin özetleme (URL değilse)
      else if (userMessage.length > 500) {
        // Uzun metinleri otomatik özetle
        console.log('📝 Uzun metin özetleniyor...');
        const summaryPrompt = `Aşağıdaki metni özetle. Türkçe özet yaz, kısa ve öz ol:\n\n${userMessage}`;

        const summaryModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const summaryResult = await summaryModel.generateContent(summaryPrompt);
        aiResponse = `📝 **Özet:**\n\n${summaryResult.response.text()}`;

        console.log('✅ Metin özeti oluşturuldu');
      }
      // Kısa metinler için Gemini'nin normal cevabını kullan
    }
    // ============ SÖZLÜK AGENT (agentId === '12') ============
    if (agentId === '12' && aiResponse.includes('[DICT:')) {
      const match = aiResponse.match(/\[DICT:(.*?)\|(.*?)\]/);
      if (match) {
        const word = match[1].trim().toLowerCase();
        const lang = match[2].trim();
        console.log(`📖 Sözlük: ${word} (${lang})`);
        try {
          const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/${lang}/${word}`);
          const data = response.data[0];
          if (!data) {
            aiResponse = `"${word}" kelimesi bulunamadı.`;
          } else {
            const meanings = data.meanings;
            let dictResponse = `📖 **${word}**\n\n`;
            // Telaffuz
            if (data.phonetic || data.phonetics?.[0]?.text) {
              const phonetic = data.phonetic || data.phonetics[0].text;
              dictResponse += `🔊 Telaffuz: ${phonetic}\n\n`;
            }
            // Anlamlar
            meanings.slice(0, 2).forEach((meaning, idx) => {
              dictResponse += `**${idx + 1}. ${meaning.partOfSpeech}**\n`;

              meaning.definitions.slice(0, 2).forEach((def, i) => {
                dictResponse += `• ${def.definition}\n`;
                if (def.example) {
                  dictResponse += `_Örnek: "${def.example}"_\n`;
                }
              });
              dictResponse += `\n`;
            });
            // Eş anlamlılar
            if (meanings[0].synonyms?.length > 0) {
              const synonyms = meanings[0].synonyms.slice(0, 5).join(', ');
              dictResponse += `🔗 Eş anlamlı: ${synonyms}\n`;
            }
            aiResponse = dictResponse;
          }
          console.log('✅ Sözlük sonucu döndürüldü');
        } catch (dictError) {
          console.error('❌ Sözlük API hatası:', dictError.message);

          if (dictError.response?.status === 404) {
            aiResponse = `"${word}" kelimesi sözlükte bulunamadı. (Sadece İngilizce desteklenir)`;
          } else {
            aiResponse = 'Üzgünüm, sözlük araması yapılamadı.';
          }
        }
      }
    }
    // ============ FİLM/DİZİ AGENT (agentId === '13') ============
    if (agentId === '13' && aiResponse.includes('[MOVIE:')) {
      const match = aiResponse.match(/\[MOVIE:(.*?)\]/);
      if (match) {
        const query = match[1].trim();
        console.log(`🎬 Film/Dizi: ${query}`);
        try {
          const OMDB_API_KEY = process.env.OMDB_API_KEY;
          if (!OMDB_API_KEY) throw new Error('OMDB_API_KEY tanımlı değil');

          // OMDB API ile arama yap
          const response = await axios.get('http://www.omdbapi.com/', {
            params: {
              apikey: OMDB_API_KEY,
              s: query,
              type: '', // hem film hem dizi
              page: 1
            }
          });

          if (response.data.Response === 'False') {
            aiResponse = `"${query}" için sonuç bulunamadı.`;
          } else {
            const results = response.data.Search.slice(0, 5);

            // İlk film için detayları al (Özet için)
            const firstItem = results[0];
            const firstDetailRes = await axios.get('http://www.omdbapi.com/', {
              params: {
                apikey: OMDB_API_KEY,
                i: firstItem.imdbID,
                plot: 'short'
              }
            });
            const fDetail = firstDetailRes.data;
            const fTitle = fDetail.Title;
            const fType = fDetail.Type === 'movie' ? '🎥 Film' : '📺 Dizi';
            const fYear = fDetail.Year;
            const fRating = fDetail.imdbRating !== 'N/A' ? fDetail.imdbRating : 'N/A';

            const summary = `🎬 **"${query}" için ${results.length} sonuç:**\n\n**1. ${fTitle}** (${fYear})\n${fType} • ⭐ ${fRating}/10`;

            let detail = `🎬 **"${query}" için ${results.length} sonuç:**\n\n`;
            let index = 0;
            for (const item of results) {
              index++;
              // Her film için detaylı bilgi al
              const detailRes = await axios.get('http://www.omdbapi.com/', {
                params: {
                  apikey: OMDB_API_KEY,
                  i: item.imdbID,
                  plot: 'short'
                }
              });
              const detailData = detailRes.data;

              const title = detailData.Title;
              const type = detailData.Type === 'movie' ? '🎥 Film' : '📺 Dizi';
              const year = detailData.Year;
              const rating = detailData.imdbRating !== 'N/A' ? detailData.imdbRating : 'N/A';
              const plot = detailData.Plot !== 'N/A' ? detailData.Plot : 'Açıklama yok';
              const poster = detailData.Poster !== 'N/A' ? detailData.Poster : '';

              detail += `**${index}. ${title}** (${year})\n`;
              detail += `${type} • ⭐ ${rating}/10\n`;
              detail += `📝 ${plot}\n`;
              if (poster) {
                detail += `![${title}](${poster})\n`;
              }
              detail += `\n`;
            }
            aiResponse = `${summary}\n\n---\n\n${detail}`;
          }
          console.log('✅ Film/Dizi sonuçları döndürüldü');
        } catch (omdbError) {
          console.error('❌ OMDB API hatası:', omdbError.message);
          aiResponse = 'Üzgünüm, film/dizi araması yapılamadı.';
        }
      }
    }
    // ============ MÜZİK AGENT (agentId === '14') ============
    if (agentId === '14' && aiResponse.includes('[MUSIC:')) {
      const match = aiResponse.match(/\[MUSIC:(.*?)\]/);
      if (match) {
        const query = match[1].trim();
        console.log(`🎵 Müzik: ${query}`);
        try {
          const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
          if (!LASTFM_API_KEY) throw new Error('LASTFM_API_KEY tanımlı değil');
          // Hem sanatçı hem şarkı ara
          const [artistRes, trackRes] = await Promise.all([
            axios.get('https://ws.audioscrobbler.com/2.0/', {
              params: {
                method: 'artist.search',
                artist: query,
                api_key: LASTFM_API_KEY,
                format: 'json',
                limit: 3
              }
            }),
            axios.get('https://ws.audioscrobbler.com/2.0/', {
              params: {
                method: 'track.search',
                track: query,
                api_key: LASTFM_API_KEY,
                format: 'json',
                limit: 3
              }
            })
          ]);
          const artists = artistRes.data.results?.artistmatches?.artist || [];
          const tracks = trackRes.data.results?.trackmatches?.track || [];
          if (!artists.length && !tracks.length) {
            aiResponse = `"${query}" için sonuç bulunamadı.`;
          } else {
            // ÖZET: İlk sanatçı ve ilk şarkı (Görselsiz)
            let summary = `🎵 **"${query}" için sonuçlar:**\n\n`;
            if (artists.length) {
              const firstArtist = artists[0];
              const listeners = formatNumber(firstArtist.listeners || '0');
              summary += `**🎤 Sanatçı:** ${firstArtist.name} (👥 ${listeners})\n`;
            }
            if (tracks.length) {
              const firstTrack = tracks[0];
              const listeners = formatNumber(firstTrack.listeners || '0');
              summary += `**🎧 Şarkı:** ${firstTrack.name} - ${firstTrack.artist} (👥 ${listeners})\n`;
            }

            // DETAY: Tüm liste (Görselli)
            let detail = `🎵 **"${query}" için sonuçlar:**\n\n`;
            // Sanatçılar
            if (artists.length) {
              detail += `**🎤 Sanatçılar:**\n`;
              artists.slice(0, 3).forEach((artist, i) => {
                const listeners = formatNumber(artist.listeners || '0');
                detail += `${i + 1}. **${artist.name}**\n`;
                detail += `   👥 ${listeners} dinleyici\n`;
                if (artist.image?.[2]?.['#text']) {
                  detail += `   ![${artist.name}](${artist.image[2]['#text']})\n`;
                }
              });
              detail += `\n`;
            }
            // Şarkılar
            if (tracks.length) {
              detail += `**🎧 Şarkılar:**\n`;
              tracks.slice(0, 3).forEach((track, i) => {
                const listeners = formatNumber(track.listeners || '0');
                detail += `${i + 1}. **${track.name}** - ${track.artist}\n`;
                detail += `   👥 ${listeners} dinleyici\n`;
                if (track.image?.[2]?.['#text']) {
                  detail += `   ![${track.name}](${track.image[2]['#text']})\n`;
                }
              });
            }
            aiResponse = `${summary}\n\n---\n\n${detail}`;
          }
          console.log('✅ Müzik sonuçları döndürüldü');
        } catch (musicError) {
          console.error('❌ Last.fm API hatası:', musicError.message);
          aiResponse = 'Üzgünüm, müzik araması yapılamadı.';
        }
      }
    }
    // ============ PODCAST AGENT (agentId === '15') ============
    if (agentId === '15' && aiResponse.includes('[PODCAST:')) {
      const match = aiResponse.match(/\[PODCAST:(.*?)\]/);
      if (match) {
        const query = match[1].trim();
        console.log(`🎙️ Podcast: ${query}`);

        try {
          const LISTENNOTES_API_KEY = process.env.LISTENNOTES_API_KEY;
          if (!LISTENNOTES_API_KEY) throw new Error('LISTENNOTES_API_KEY tanımlı değil');

          const response = await axios.get('https://listen-api.listennotes.com/api/v2/search', {
            params: {
              q: query,
              type: 'podcast'
            },
            headers: {
              'X-ListenAPI-Key': LISTENNOTES_API_KEY
            }
          });

          console.log('📡 API Response:', JSON.stringify(response.data).substring(0, 200)); // DEBUG

          const podcasts = response.data.results || [];

          if (!podcasts.length) {
            aiResponse = `"${query}" için podcast bulunamadı. (Toplam: ${response.data.total || 0})`;
          } else {
            // ÖZET: Sadece podcast isimleri
            let summary = `🎙️ **"${query}" için ${podcasts.length} podcast:**\n\n`;
            podcasts.slice(0, 5).forEach((podcast, index) => {
              const title = podcast.title_original || podcast.title_highlighted || podcast.title || 'Başlık yok';
              summary += `**${index + 1}. ${title}**\n`;
            });

            // DETAY: Tüm liste (Görselli ve açıklamalı)
            let detail = `🎙️ **"${query}" için ${podcasts.length} podcast:**\n\n`;

            podcasts.slice(0, 5).forEach((podcast, index) => {
              const title = podcast.title_original || podcast.title_highlighted || podcast.title || 'Başlık yok';
              const publisher = podcast.publisher_original || podcast.publisher_highlighted || 'Bilinmiyor';
              const description = (podcast.description_original || podcast.description_highlighted || 'Açıklama yok').substring(0, 150);
              const thumbnail = podcast.thumbnail || podcast.image || '';

              detail += `**${index + 1}. ${title}**\n`;
              detail += `🎤 ${publisher}\n`;
              detail += `📝 ${description}...\n`;
              if (thumbnail) {
                detail += `![${title}](${thumbnail})\n`;
              }
              detail += `\n`;
            });
            aiResponse = `${summary}\n\n---\n\n${detail}`;
          }

          console.log('✅ Podcast sonuçları döndürüldü');
        } catch (podcastError) {
          console.error('❌ Listen Notes API hatası:', podcastError.message);
          console.error('❌ Response:', podcastError.response?.data);
          aiResponse = `Hata: ${podcastError.message}`;
        }
      }
    }
    // ============ OYUN BİLGİSİ AGENT (agentId === '16') ============
    if (agentId === '16' && aiResponse.includes('[GAME:')) {
      const match = aiResponse.match(/\[GAME:(.*?)\]/);
      if (match) {
        const query = match[1].trim();
        console.log(`🎮 Oyun: ${query}`);
        try {
          const RAWG_API_KEY = process.env.RAWG_API_KEY;
          if (!RAWG_API_KEY) throw new Error('RAWG_API_KEY tanımlı değil');
          const response = await axios.get('https://api.rawg.io/api/games', {
            params: {
              key: RAWG_API_KEY,
              search: query,
              page_size: 5
            }
          });
          const games = response.data.results || [];
          if (!games.length) {
            aiResponse = `"${query}" için oyun bulunamadı.`;
          } else {
            // ÖZET: Sadece ilk oyun (Görselli)
            const firstGame = games[0];
            const fTitle = firstGame.name;
            const fRating = firstGame.rating ? firstGame.rating.toFixed(1) : 'N/A';
            const fReleased = firstGame.released || 'Bilinmiyor';
            const fPlatforms = firstGame.platforms?.map(p => p.platform.name).slice(0, 3).join(', ') || 'N/A';
            const fGenres = firstGame.genres?.map(g => g.name).slice(0, 2).join(', ') || 'N/A';
            const fScreenshot = firstGame.background_image || '';

            let summary = `🎮 **"${query}" için ${games.length} oyun:**\n\n**1. ${fTitle}**\n⭐ ${fRating}/5 • 📅 ${fReleased}\n🎮 ${fPlatforms}\n🏷️ ${fGenres}\n`;
            if (fScreenshot) {
              summary += `![${fTitle}](${fScreenshot})\n`;
            }

            // DETAY: Tüm liste
            let detail = `🎮 **"${query}" için ${games.length} oyun:**\n\n`;
            games.forEach((game, index) => {
              const title = game.name;
              const rating = game.rating ? game.rating.toFixed(1) : 'N/A';
              const released = game.released || 'Bilinmiyor';
              const platforms = game.platforms?.map(p => p.platform.name).slice(0, 3).join(', ') || 'N/A';
              const genres = game.genres?.map(g => g.name).slice(0, 2).join(', ') || 'N/A';
              const screenshot = game.background_image || '';
              detail += `**${index + 1}. ${title}**\n`;
              detail += `⭐ ${rating}/5 • 📅 ${released}\n`;
              detail += `🎮 ${platforms}\n`;
              detail += `🏷️ ${genres}\n`;
              if (screenshot) {
                detail += `![${title}](${screenshot})\n`;
              }
              detail += `\n`;
            });
            aiResponse = `${summary}\n\n---\n\n${detail}`;
          }
          console.log('✅ Oyun sonuçları döndürüldü');
        } catch (gameError) {
          console.error('❌ RAWG API hatası:', gameError.message);
          aiResponse = 'Üzgünüm, oyun araması yapılamadı.';
        }
      }
    }
    // ============ YEMEK TARİFİ AGENT (agentId === '17') ============
    if (agentId === '17' && aiResponse.includes('[RECIPE:')) {
      const match = aiResponse.match(/\[RECIPE:(.*?)\]/);
      if (match) {
        const query = match[1].trim();
        console.log(`🍳 Tarif: ${query}`);
        try {
          const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
          if (!SPOONACULAR_API_KEY) throw new Error('SPOONACULAR_API_KEY tanımlı değil');
          const response = await axios.get('https://api.spoonacular.com/recipes/complexSearch', {
            params: {
              apiKey: SPOONACULAR_API_KEY,
              query: query,
              number: 3,
              addRecipeInformation: true
            }
          });
          const recipes = response.data.results || [];
          if (!recipes.length) {
            aiResponse = `"${query}" için tarif bulunamadı.`;
          } else {
            // ÖZET: Sadece tarif listesi (Ad, Süre, Porsiyon)
            let summary = `🍳 **"${query}" için ${recipes.length} tarif:**\n\n`;
            recipes.forEach((recipe, index) => {
              const title = recipe.title;
              const readyInMinutes = recipe.readyInMinutes || 'N/A';
              const servings = recipe.servings || 'N/A';
              summary += `**${index + 1}. ${title}**\n⏱️ ${readyInMinutes} dk • 👥 ${servings} kişilik\n\n`;
            });

            // DETAY: Tüm liste (Görselli ve açıklamalı)
            let detail = `🍳 **"${query}" için ${recipes.length} tarif:**\n\n`;
            recipes.forEach((recipe, index) => {
              const title = recipe.title;
              const readyInMinutes = recipe.readyInMinutes || 'N/A';
              const servings = recipe.servings || 'N/A';
              const image = recipe.image || '';
              const summaryText = recipe.summary?.replace(/<[^>]*>/g, '') || 'Açıklama yok';

              detail += `**${index + 1}. ${title}**\n`;
              detail += `⏱️ ${readyInMinutes} dk • 👥 ${servings} kişilik\n`;
              detail += `📝 ${summaryText}\n`;
              if (image) {
                detail += `![${title}](${image})\n`;
              }
              detail += `\n`;
            });
            aiResponse = `${summary}\n\n---\n\n${detail}`;
          }
          console.log('✅ Tarif sonuçları döndürüldü');
        } catch (recipeError) {
          console.error('❌ Spoonacular API hatası:', recipeError.message);
          aiResponse = 'Üzgünüm, tarif araması yapılamadı.';
        }
      }
    }
    // ============ FITNESS AGENT (agentId === '18') ============
    if (agentId === '18') {
      // Egzersiz isimlerini çek
      const exerciseMatches = aiResponse.match(/\d+\.\s*\*\*(.*?)\*\*/g);
      if (exerciseMatches) {
        let summary = `💪 **Antrenman Planı:**\n\n`;
        exerciseMatches.forEach(match => {
          summary += `${match}\n`;
        });

        // Detay zaten aiResponse'un kendisi
        aiResponse = `${summary}\n\n---\n\n${aiResponse}`;
      }
    }
    // ============ MOTIVASYON AGENT (agentId === '19') ============
    if (agentId === '19') {
      // İlk paragrafı (giriş cümlesi) al
      const firstParagraph = aiResponse.split('\n').find(line => line.trim().length > 0) || '';

      // İlk başlığı bul
      const firstHeaderMatch = aiResponse.match(/\*\*(.*?)\*\*/);
      const firstHeader = firstHeaderMatch ? `\n\n**${firstHeaderMatch[1]}**` : '';

      const summary = `🌟 **Motivasyon:**\n\n${firstHeader}...`;

      // Detay zaten aiResponse'un kendisi
      aiResponse = `${summary}\n\n---\n\n${aiResponse}`;
    }
    // ============ QR KOD AGENT (agentId === '20') ============
    if (agentId === '20' && aiResponse.includes('[QR:')) {
      const match = aiResponse.match(/\[QR:(.*?)\]/);
      if (match) {
        const content = match[1].trim();
        console.log(`📱 QR Kod: ${content}`);
        // QR Server API (ücretsiz, key yok)
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(content)}`;

        const summary = `![QR Kod](${qrUrl})`;
        const detail = `![QR Kod](${qrUrl})\n\n🔗${content}`;

        aiResponse = `${summary}\n\n---\n\n${detail}`;

        console.log('✅ QR kod oluşturuldu');
      }
    }
    // ============ IP BİLGİSİ AGENT (agentId === '21') ============
    if (agentId === '21' && aiResponse.includes('[IP:')) {
      const match = aiResponse.match(/\[IP:(.*?)\]/);
      if (match) {
        const ip = match[1].trim();
        console.log(`🌍 IP Bilgisi: ${ip}`);
        try {
          // ipapi.co - ücretsiz, key yok
          const url = ip === 'self'
            ? 'https://ipapi.co/json/'
            : `https://ipapi.co/${ip}/json/`;
          const response = await axios.get(url);
          const data = response.data;
          if (data.error) {
            aiResponse = `IP bilgisi alınamadı: ${data.reason}`;
          } else {
            const summary = `🌍 **IP Bilgisi:**\n\n📍 IP: ${data.ip}\n🌐 Ülke: ${data.country_name || 'Bilinmiyor'} (${data.country || ''})\n🌐 ISP: ${data.org || 'Bilinmiyor'}`;

            let detail = `🌍 **IP Bilgisi:**\n\n`;
            detail += `📍 IP: ${data.ip}\n`;
            detail += `🏙️ Şehir: ${data.city || 'Bilinmiyor'}\n`;
            detail += `🗺️ Bölge: ${data.region || 'Bilinmiyor'}\n`;
            detail += `🌐 Ülke: ${data.country_name || 'Bilinmiyor'} (${data.country || ''})\n`;
            detail += `🧭 Koordinat: ${data.latitude}, ${data.longitude}\n`;
            detail += `🌐 ISP: ${data.org || 'Bilinmiyor'}\n`;
            detail += `⏰ Zaman Dilimi: ${data.timezone || 'Bilinmiyor'}`;

            aiResponse = `${summary}\n\n---\n\n${detail}`;
          }
          console.log('✅ IP bilgisi alındı');
        } catch (ipError) {
          console.error('❌ IP API hatası:', ipError.message);
          aiResponse = 'Üzgünüm, IP bilgisi alınamadı.';
        }
      }
    }
    // ============ RASTGELE SEÇİM AGENT (agentId === '22') ============
    if (agentId === '22' && aiResponse.includes('[RANDOM:')) {
      const match = aiResponse.match(/\[RANDOM:(.*?)\]/);
      if (match) {
        const items = match[1].split(',').map(item => item.trim()).filter(item => item.length > 0);
        console.log(`🎲 Rastgele Seçim: ${items.join(', ')}`);
        if (items.length < 2) {
          aiResponse = 'En az 2 seçenek olmalı!';
        } else {
          const randomIndex = Math.floor(Math.random() * items.length);
          const chosen = items[randomIndex];

          aiResponse = `🎲 **Rastgele Seçim:**\n\n`;
          aiResponse += `🎯 Seçilen: **${chosen}**\n\n`;
          aiResponse += `📋 Seçenekler:\n`;
          items.forEach((item, i) => {
            const emoji = i === randomIndex ? '✅' : '⬜';
            aiResponse += `${emoji} ${item}\n`;
          });
        }
        console.log('✅ Rastgele seçim yapıldı');
      }
    }
    // ============ CRYPTO FİYAT AGENT (agentId === '23') ============
    if (agentId === '23' && aiResponse.includes('[CRYPTO:')) {
      const match = aiResponse.match(/\[CRYPTO:(.*?)\]/);
      if (match) {
        const coinId = match[1].trim().toLowerCase();
        console.log(`₿ Crypto: ${coinId}`);
        try {
          const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
            params: {
              ids: coinId,
              vs_currencies: 'usd,try',
              include_24hr_change: 'true',
              include_market_cap: 'true'
            }
          });
          const data = response.data[coinId];

          if (!data) {
            aiResponse = `"${coinId}" bulunamadı. Coin ID'yi kontrol et (bitcoin, ethereum vb.)`;
          } else {
            const usdPrice = data.usd?.toFixed(2) || 'N/A';
            const tryPrice = data.try?.toFixed(2) || 'N/A';
            const change24h = data.usd_24h_change?.toFixed(2) || 'N/A';
            const changeEmoji = parseFloat(change24h) >= 0 ? '📈' : '📉';
            const marketCap = data.usd_market_cap ? `$${(data.usd_market_cap / 1000000000).toFixed(2)}B` : 'N/A';
            aiResponse = `₿ **${coinId.toUpperCase()} Fiyat:**\n\n`;
            aiResponse += `💵 USD: $${usdPrice}\n`;
            aiResponse += `₺ TRY: ₺${tryPrice}\n`;
            aiResponse += `${changeEmoji} 24s Değişim: ${change24h}%\n`;
            aiResponse += `📊 Piyasa Değeri: ${marketCap}`;
          }
          console.log('✅ Crypto fiyat alındı');
        } catch (cryptoError) {
          console.error('❌ CoinGecko API hatası:', cryptoError.message);
          aiResponse = 'Üzgünüm, crypto fiyatı alınamadı.';
        }
      }
    }
    // ============ SPOR SKOR AGENT (agentId === '24') ============
    if (agentId === '24' && aiResponse.includes('[FOOTBALL:')) {
      const match = aiResponse.match(/\[FOOTBALL:(.*?)\]/);
      if (match) {
        const teamName = match[1].trim();
        console.log(`⚽ Futbol: ${teamName}`);
        try {
          const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY;
          if (!FOOTBALL_API_KEY) throw new Error('FOOTBALL_API_KEY tanımlı değil');
          // Takım ara
          const searchResponse = await axios.get('https://v3.football.api-sports.io/teams', {
            params: { search: teamName },
            headers: { 'x-apisports-key': FOOTBALL_API_KEY }
          });
          const teams = searchResponse.data.response;
          if (!teams.length) {
            aiResponse = `"${teamName}" takımı bulunamadı.`;
          } else {
            const teamId = teams[0].team.id;
            const teamFullName = teams[0].team.name;
            // Son 30 günün maçları
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);

            const fixturesResponse = await axios.get('https://v3.football.api-sports.io/fixtures', {
              params: {
                team: teamId,
                from: thirtyDaysAgo.toISOString().split('T')[0],
                to: today.toISOString().split('T')[0]
              },
              headers: { 'x-apisports-key': FOOTBALL_API_KEY }
            });

            const allFixtures = fixturesResponse.data.response;
            // Son 3 maçı al (bitmiş olanlar)
            const fixtures = allFixtures.filter(f => f.fixture.status.short === 'FT').slice(-3).reverse();
            // DEBUG: API yanıtını kontrol et
            console.log('📡 Fixtures Response:', JSON.stringify(fixturesResponse.data).substring(0, 500));
            console.log('📊 Fixtures count:', fixtures.length);
            aiResponse = `⚽ **${teamFullName} - Son Maçlar:**\n\n`;
            fixtures.forEach((fixture, i) => {
              const homeTeam = fixture.teams.home.name;
              const awayTeam = fixture.teams.away.name;
              const homeScore = fixture.goals.home;
              const awayScore = fixture.goals.away;
              const status = fixture.fixture.status.short;
              aiResponse += `**${i + 1}. ${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}**\n`;
              aiResponse += `📅 ${fixture.fixture.date.split('T')[0]} | ${status}\n\n`;
            });
          }
          console.log('✅ Futbol skorları alındı');
        } catch (footballError) {
          console.error('❌ API-Football hatası:', footballError.message);
          aiResponse = 'Üzgünüm, futbol skorları alınamadı.';
        }
      }
    }
    return {
      success: true,
      response: aiResponse
    };
  } catch (error) {
    console.error('❌ Agent hatası:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test endpoint'i - Sunucunun çalıştığını kontrol etmek için
app.get('/', (req, res) => {
  res.json({ message: 'AgentHub Backend çalışıyor!' });
});

// Bireysel mod endpoint
app.post('/api/agent', async (req, res) => {
  try {
    const { agentId, agentName, userMessage } = req.body;

    // Yeni internal fonksiyonu kullan
    const result = await processAgentRequest(agentId, agentName, userMessage);

    if (result.success) {
      res.json({
        success: true,
        agentName: agentName,
        response: result.response
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ HATA DETAYI:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Bir hata oluştu'
    });
  }
});

// Koordine mod endpoint
app.post('/api/coordinate', async (req, res) => {
  try {
    const { userMessage } = req.body;
    console.log(`\n📥 Koordine mod isteği: ${userMessage}`);

    const plannerPrompt = `Sen bir görev planlayıcısısın. Kullanıcının isteğini analiz et ve hangi agentların SIRAYLA çalışması gerektiğini belirle.

Mevcut agentlar (24 adet):

**Bilgi & Araştırma:**
- weather: Hava durumu bilgisi sağlar (şehir → hava durumu)
- news: Güncel haber getirir (konu, dil, ülke → haberler)
- wikipedia: Wikipedia özeti getirir (konu → özet)
- dictionary: Kelime anlamı (İngilizce kelime → anlam)
- cryptoPrice: Kripto para fiyatları (bitcoin, ethereum → USD fiyat)
- footballScore: Futbol takımı sonuçları (takım adı → son maçlar)

**Hesaplama & Çeviri:**
- calculator: Matematiksel hesaplama (işlem → sonuç)
- translator: Diller arası çeviri (metin + hedef dil → çeviri)
- exchange: Döviz kuru (USD/EUR/TRY → kur)
- ipInfo: IP adresi bilgisi (IP → konum/bilgi)

**Medya & Eğlence:**
- youtubeSearch: YouTube video arama (konu → videolar)
- bookSearch: Kitap arama (başlık/yazar → kitaplar)
- movieSearch: Film/dizi arama (başlık → film bilgisi)
- musicSearch: Müzik/sanatçı arama (şarkı/sanatçı → bilgi)
- podcastSearch: Podcast arama (konu → podcast'ler)
- gameSearch: Oyun bilgisi (oyun adı → bilgi)
- recipeSearch: Yemek tarifi (yemek adı → tarif)

**Yaratıcı & Üretken:**
- codeAssistant: Kod yazma/açıklama/debug (kod talebi → kod)
- imageGenerator: AI görsel oluşturma (açıklama → görsel)
- qrCode: QR kod oluşturma (metin/URL → QR kod)
- summarizer: URL/metin özetleme (URL/metin → özet)

**Yaşam & Sağlık:**
- fitness: Antrenman planı/egzersiz önerileri (hedef → program)
- motivation: Motivasyon ve ilham (konu → motivasyon)
- randomChoice: Rastgele seçim (liste → seçim)

Kullanıcı mesajı: "${userMessage}"

Yanıtı JSON formatında ver:
{
  "steps": [
    {
      "agent": "cryptoPrice",
      "task": "Bitcoin fiyatını öğren",
      "input": "bitcoin"
    },
    {
      "agent": "calculator",
      "task": "100 dolar ile kaç bitcoin alınabilir hesapla (önceki adımın fiyatını kullan)",
      "input": "{{PREVIOUS_OUTPUT}}"
    }
  ],
  "explanation": "Önce bitcoin fiyatı alınacak, sonra hesaplama yapılacak"
}

ÖNEMLİ KURALLAR:
1. Her agent için doğru input formatı ver
2. Önceki adımın çıktısını kullanmak için "{{PREVIOUS_OUTPUT}}" kullan
3. En verimli agent sırasını belirle
4. Gereksiz adım ekleme
5. JSON formatı bozuk olmamalı`;

    // Fallback destekli plan oluştur
    const systemMessage = 'Sen bir görev planlayıcısısın. Sadece JSON formatında yanıt ver.';
    let planText = await generateAIResponse(systemMessage, plannerPrompt);

    console.log('📄 Plan metni:', planText);

    // Markdown code block wrapper'ı temizle (```json ... ```)
    planText = planText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

    const plan = JSON.parse(planText);
    console.log('🤖 Koordinatör planı:', JSON.stringify(plan, null, 2));

    // 2. Adımları sırayla çalıştır
    let previousOutput = null;
    const stepResults = [];

    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      console.log(`\n🔄 Adım ${i + 1}/${plan.steps.length}: ${step.agent}`);

      // Input placeholder'larını çöz
      let taskInput = step.input;

      // {{PREVIOUS_OUTPUT}} formatı
      if (taskInput === '{{PREVIOUS_OUTPUT}}' && previousOutput) {
        taskInput = previousOutput;
      }
      // {{STEP_X_OUTPUT}} veya {{PREVIOUS_OUTPUT_OF_STEP_X}} veya {{PREVIOUS_OUTPUT_FROM_STEP_X}} formatı
      else if (typeof taskInput === 'string' && taskInput.includes('{{')) {
        // Genişletilmiş regex - tüm varyasyonları destekle
        const stepMatch = taskInput.match(/\{\{(?:STEP_|PREVIOUS_(?:OUTPUT|CHOICE)_(?:OF|FROM)_STEP_|PREVIOUS_CHOICE_)?(\d+)(?:_OUTPUT|_CHOICE)?\}\}/i);
        if (stepMatch) {
          const stepIndex = parseInt(stepMatch[1]) - 1;
          if (stepResults[stepIndex] && stepResults[stepIndex].output) {
            taskInput = stepResults[stepIndex].output;
            console.log(`🔄 Placeholder çözüldü: Step ${stepIndex + 1} -> ${taskInput.substring(0, 50)}...`);
          }
        }
        // {{PREVIOUS_OUTPUT}} yazılı string içinde
        else if (taskInput.includes('{{PREVIOUS_OUTPUT}}') && previousOutput) {
          taskInput = taskInput.replace(/\{\{PREVIOUS_OUTPUT\}\}/g, previousOutput);
        }
      }
      // Array ise (randomChoice gibi)
      else if (Array.isArray(taskInput)) {
        // Array olarak bırak
        taskInput = taskInput;
      }

      // Agent ID'sini bul
      const agentId = {
        'weather': '1',
        'calculator': '2',
        'translator': '3',
        'news': '4',
        'wikipedia': '5',
        'exchange': '6',
        'codeAssistant': '7',
        'imageGenerator': '8',
        'youtubeSearch': '9',
        'bookSearch': '10',
        'summarizer': '11',
        'dictionary': '12',
        'movieSearch': '13',
        'musicSearch': '14',
        'podcastSearch': '15',
        'gameSearch': '16',
        'recipeSearch': '17',
        'fitness': '18',
        'motivation': '19',
        'qrCode': '20',
        'ipInfo': '21',
        'randomChoice': '22',
        'cryptoPrice': '23',
        'footballScore': '24'
      }[step.agent];

      if (!agentId) {
        console.log(`⚠️ Bilinmeyen agent: ${step.agent}`);
        continue;
      }

      // Agent çağrısı yap
      try {
        const agentResponse = await processAgentRequest(agentId, step.agent, taskInput);
        if (agentResponse.success) {
          previousOutput = agentResponse.response;
          stepResults.push({
            step: i + 1,
            agent: step.agent,
            task: step.task,
            output: previousOutput
          });
        } else {
          stepResults.push({
            step: i + 1,
            agent: step.agent,
            error: agentResponse.error
          });
        }

        console.log(`✅ Adım ${i + 1} tamamlandı`);
      } catch (error) {
        console.error(`❌ Adım ${i + 1} hatası:`, error.message);
        stepResults.push({
          step: i + 1,
          agent: step.agent,
          error: error.message
        });
      }
    }

    // 3. Sonuçları birleştir ve kullanıcıya sun
    let finalResponse = `🤝 **Koordinatör Sonucu**\n\n`;

    // Tüm adım sonuçlarını göster
    if (stepResults.length > 0) {
      stepResults.forEach((step, index) => {
        if (step.output) {
          finalResponse += `**${index + 1}. ${step.agent}**\n${step.output}\n\n---\n\n`;
        } else if (step.error) {
          finalResponse += `**${index + 1}. ${step.agent}** ❌\nHata: ${step.error}\n\n---\n\n`;
        }
      });
    } else {
      finalResponse += `❌ Hiçbir adım tamamlanamadı.`;
    }

    res.json({
      success: true,
      response: finalResponse
    });

  } catch (error) {
    console.error('❌ Koordinatör hatası:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Sunucu port ${PORT} üzerinde çalışıyor`);
});

module.exports = app;
