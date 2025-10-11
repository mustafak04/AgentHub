const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

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
  
      // Agent'a özel sistem mesajı
      const systemMessage = getAgentSystemMessage(agentId);
  
      // Gemini 1.5 Flash modeli (ücretsiz ve hızlı)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
      // Prompt oluştur
      const prompt = `${systemMessage}\n\nKullanıcı: ${userMessage}`;
  
      // Gemini'ye istek gönder
      const result = await model.generateContent(prompt);
      const aiResponse = result.response.text();
  
      res.json({
        success: true,
        agentName: agentName,
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

  // Koordine mod için endpoint
app.post('/api/coordinate', async (req, res) => {
    try {
      const { userMessage } = req.body;
  
      const systemMessage = `Sen bir koordinatör yapay zeka asistanısın. Kullanıcının isteğini analiz et ve hangi agent(lar)ın işi yapması gerektiğini belirle. 
      Mevcut agentlar: Hava Durumu Agent, Hesap Makinesi Agent, Çeviri Agent, Haber Agent.
      Kullanıcının isteğine göre uygun cevabı ver ve hangi agentın devreye girdiğini belirt.`;
  
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
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
      '1': 'Sen bir hava durumu asistanısın. Kullanıcıya hava durumu hakkında bilgi ver. Kısa ve net cevaplar ver.',
      '2': 'Sen bir hesap makinesi asistanısın. Matematiksel hesaplamalar yap ve sonucu açıkla.',
      '3': 'Sen bir çeviri asistanısın. Diller arası çeviri yap ve çevirinin doğru olduğundan emin ol.',
      '4': 'Sen bir haber asistanısın. Güncel haberler hakkında bilgi ver (simüle edilmiş bilgiler kullan).',
    };
    return agentMessages[agentId] || 'Sen yardımcı bir yapay zeka asistanısın.';
  }

  // Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`✅ Sunucu http://localhost:${PORT} adresinde çalışıyor`);
    console.log(`📡 Gemini API bağlantısı hazır`);
  });