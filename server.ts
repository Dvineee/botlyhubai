
import express from 'express';
import { createServer as createViteServer } from 'vite';
import TelegramBot from 'node-telegram-bot-api';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3000;

// Tip Tanımlamaları
interface UserSession {
  history: { role: 'user' | 'model'; content: string }[];
  profile: {
    name?: string;
    interests: string[];
    [key: string]: any;
  };
}

interface BotConfig {
  name: string;
  systemPrompt: string;
  temperature: number;
  maxHistory: number;
}

interface BotInstance {
  id: string;
  token: string;
  config: BotConfig;
  metrics: {
    totalMessages: number;
    startTime: number;
    lastLatency: number;
  };
  sessions: Record<number, UserSession>;
  bot: TelegramBot | null;
  lastError: string | null;
}

// Bot Havuzu
const bots: Record<string, BotInstance> = {};

// AI Kurulumu
const ai = new GoogleGenAI({ apiKey: process.env.MY_CUSTOM_GEMINI_KEY || process.env.GEMINI_API_KEY || '' });
const modelName = "gemini-flash-latest";

function createBotInstance(id: string, token: string, name: string): BotInstance {
  const instance: BotInstance = {
    id,
    token,
    config: {
      name: name,
      systemPrompt: "Sen samimi, doğal konuşan bir asistansın. Kısa ve net cevap ver. Gereksiz uzatma. Bilmediğin şeyi uydurma. İnsan gibi konuş, küçük doğal ifadeler kullan (hmm, aynen, gibi) ama abartma.",
      temperature: 0.8,
      maxHistory: 10
    },
    metrics: {
      totalMessages: 0,
      startTime: Date.now(),
      lastLatency: 0
    },
    sessions: {},
    bot: null,
    lastError: null
  };

  if (token) {
    try {
      const bot = new TelegramBot(token, { polling: true });
      instance.bot = bot;
      console.log(`🤖 [${name}] Botu Başlatıldı`);

      bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;
        if (!text) return;

        const requestStartTime = Date.now();
        instance.metrics.totalMessages++;

        try {
          if (!process.env.MY_CUSTOM_GEMINI_KEY && !process.env.GEMINI_API_KEY) {
            throw new Error('API anahtarı eksik. Lütfen Secrets kısmına MY_CUSTOM_GEMINI_KEY ekleyin.');
          }

          if (!instance.sessions[chatId]) {
            instance.sessions[chatId] = { history: [], profile: { interests: [] } };
          }
          const session = instance.sessions[chatId];

          // Profil oluşturma mantığı
          if (text.toLowerCase().includes('ismim') || text.toLowerCase().includes('adım')) {
            const parts = text.split(' ');
            session.profile.name = parts[parts.length - 1];
          }

          const userProfileStr = JSON.stringify(session.profile);
          const chatHistoryStr = session.history
            .map(h => `${h.role === 'user' ? 'Kullanıcı' : 'Asistan'}: ${h.content}`)
            .join('\n');

          const finalPrompt = `
${instance.config.systemPrompt}

Mevcut Bot İsmi: ${instance.config.name}
Kullanıcı Profili: ${userProfileStr}

Konuşma Geçmişi:
${chatHistoryStr}

Kullanıcının Son Mesajı: ${text}

Cevap:
          `.trim();

          const result = await ai.models.generateContent({
            model: modelName,
            contents: finalPrompt,
            config: {
              temperature: instance.config.temperature,
            }
          });

          const aiResponse = result.text || 'Üzgünüm, şu an yanıt veremiyorum.';
          instance.metrics.lastLatency = Date.now() - requestStartTime;

          session.history.push({ role: 'user', content: text });
          session.history.push({ role: 'model', content: aiResponse });

          if (session.history.length > instance.config.maxHistory * 2) {
            session.history = session.history.slice(-(instance.config.maxHistory * 2));
          }

          bot.sendMessage(chatId, aiResponse);
          instance.lastError = null;

        } catch (error) {
          console.error(`AI Hatası [${name}]:`, error);
          instance.lastError = error instanceof Error ? error.message : String(error);
          bot.sendMessage(chatId, 'Bir hata oluştu, lütfen birazdan tekrar dene.');
        }
      });

      bot.on('polling_error', (err) => {
        console.error(`Polling Hatası [${name}]:`, err);
        instance.lastError = `Bağlantı Hatası: ${err.message}`;
      });

    } catch (err) {
      console.error(`Bot Başlatma Hatası [${name}]:`, err);
      instance.lastError = `Başlatma Hatası: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  return instance;
}

// Başlangıç Botu (Varsayılan Token Varsa)
const defaultToken = process.env.TELEGRAM_BOT_TOKEN;
if (defaultToken) {
  const id = "ana-bot";
  bots[id] = createBotInstance(id, defaultToken, "Ana Asistan Bot");
}

app.use(express.json());

// API Rotaları
app.get('/api/bots', (req, res) => {
  const botList = Object.values(bots).map(b => ({
    id: b.id,
    name: b.config.name,
    active: !!b.bot,
    metrics: b.metrics,
    config: b.config,
    lastError: b.lastError,
    sessionCount: Object.keys(b.sessions).length
  }));
  res.json(botList);
});

app.post('/api/bots', (req, res) => {
  const { name, token } = req.body;
  if (!name || !token) return res.status(400).json({ error: 'İsim ve token gereklidir.' });
  
  const id = `bot-${Date.now()}`;
  bots[id] = createBotInstance(id, token, name);
  res.json({ success: true, bot: { id, name } });
});

app.delete('/api/bots/:id', (req, res) => {
  const { id } = req.params;
  if (bots[id]) {
    if (bots[id].bot) {
      bots[id].bot?.stopPolling();
    }
    delete bots[id];
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Bot bulunamadı.' });
  }
});

app.post('/api/bots/:id/config', (req, res) => {
  const { id } = req.params;
  const { systemPrompt, temperature, maxHistory, name } = req.body;
  
  if (!bots[id]) return res.status(404).json({ error: 'Bot bulunamadı.' });
  
  const config = bots[id].config;
  if (systemPrompt !== undefined) config.systemPrompt = systemPrompt;
  if (temperature !== undefined) config.temperature = parseFloat(temperature);
  if (maxHistory !== undefined) config.maxHistory = parseInt(maxHistory);
  if (name !== undefined) config.name = name;
  
  res.json({ success: true, config });
});

// Vite Entegrasyonu
async function main() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`🚀 Sunucu http://localhost:${port} adresinde çalışıyor`);
  });
}

main();
