
import express from 'express';
import { createServer as createViteServer } from 'vite';
import TelegramBot from 'node-telegram-bot-api';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

dotenv.config();

// Firebase Admin Başlatma
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseId: firebaseConfig.firestoreDatabaseId
  });
}
const db = admin.firestore();

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

// Bot Havuzu (Bellekte aktif botları tutar)
const activeBots: Record<string, BotInstance> = {};

// AI Kurulumu
const ai = new GoogleGenAI({ apiKey: process.env.MY_CUSTOM_GEMINI_KEY || process.env.GEMINI_API_KEY || '' });
const modelName = "gemini-flash-latest";

function setupBotLogic(instance: BotInstance) {
  if (!instance.token) return;

  try {
    const isWebhook = !!process.env.PUBLIC_URL;
    const bot = new TelegramBot(instance.token, { polling: !isWebhook });
    instance.bot = bot;

    if (isWebhook) {
      const webhookUrl = `${process.env.PUBLIC_URL}/api/webhook/${instance.id}`;
      bot.setWebHook(webhookUrl);
      console.log(`📡 [${instance.config.name}] Webhook Modunda Başlatıldı: ${webhookUrl}`);
    } else {
      console.log(`🤖 [${instance.config.name}] Polling (Sürekli Dinleme) Modunda Başlatıldı`);
    }

    const messageHandler = async (msg: any) => {
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
        console.error(`AI Hatası [${instance.config.name}]:`, error);
        instance.lastError = error instanceof Error ? error.message : String(error);
        if (chatId) bot.sendMessage(chatId, 'Bir hata oluştu, lütfen birazdan tekrar dene.');
      }
    };

    if (!isWebhook) {
      bot.on('message', messageHandler);
    } else {
      // Webhook handler'ı instance içinde tutalım ki API route'tan çağırabilelim
      (instance as any).handleWebhookUpdate = (update: any) => {
        if (update.message) messageHandler(update.message);
      };
    }

    bot.on('polling_error', (err) => {
      console.error(`Polling Hatası [${instance.config.name}]:`, err);
      instance.lastError = `Bağlantı Hatası: ${err.message}`;
    });

  } catch (err) {
    console.error(`Bot Başlatma Hatası [${instance.config.name}]:`, err);
    instance.lastError = `Başlatma Hatası: ${err instanceof Error ? err.message : String(err)}`;
  }
}

// Firebase'den botları yükle
async function loadBotsFromFirebase() {
  const snapshot = await db.collection('bots').get();
  snapshot.forEach(doc => {
    const data = doc.data();
    const id = doc.id;
    const instance: BotInstance = {
      id,
      token: data.token,
      config: data.config,
      metrics: { totalMessages: 0, startTime: Date.now(), lastLatency: 0 },
      sessions: {},
      bot: null,
      lastError: null
    };
    activeBots[id] = instance;
    setupBotLogic(instance);
  });
  
  // Varsayılan botu kontrol et (Hala Firebase'de yoksa ekle)
  const defaultToken = process.env.TELEGRAM_BOT_TOKEN;
  if (defaultToken && Object.keys(activeBots).length === 0) {
    const id = "ana-bot";
    const newBotData = {
      token: defaultToken,
      config: {
        name: "Ana Asistan Bot",
        systemPrompt: "Sen samimi, doğal konuşan bir asistansın. Kısa ve net cevap ver. Gereksiz uzatma. Bilmediğin şeyi uydurma. İnsan gibi konuş, küçük doğal ifadeler kullan (hmm, aynen, gibi) ama abartma.",
        temperature: 0.8,
        maxHistory: 10
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await db.collection('bots').doc(id).set(newBotData);
    const instance: BotInstance = {
      id,
      token: defaultToken,
      config: newBotData.config,
      metrics: { totalMessages: 0, startTime: Date.now(), lastLatency: 0 },
      sessions: {},
      bot: null,
      lastError: null
    };
    activeBots[id] = instance;
    setupBotLogic(instance);
  }
}

app.use(express.json());

// API Rotaları
app.get('/api/bots', (req, res) => {
  const botList = Object.values(activeBots).map(b => ({
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

// Telegram Webhook Endpoint
app.post('/api/webhook/:id', (req, res) => {
  const { id } = req.params;
  const instance = activeBots[id];
  if (instance && (instance as any).handleWebhookUpdate) {
    (instance as any).handleWebhookUpdate(req.body);
  }
  res.sendStatus(200);
});

app.post('/api/bots', async (req, res) => {
  const { name, token } = req.body;
  if (!name || !token) return res.status(400).json({ error: 'İsim ve token gereklidir.' });
  
  const id = `bot-${Date.now()}`;
  const newBotData = {
    token,
    config: {
      name,
      systemPrompt: "Sen samimi, doğal konuşan bir asistansın.",
      temperature: 0.8,
      maxHistory: 10
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection('bots').doc(id).set(newBotData);
  
  const instance: BotInstance = {
    id,
    token,
    config: newBotData.config,
    metrics: { totalMessages: 0, startTime: Date.now(), lastLatency: 0 },
    sessions: {},
    bot: null,
    lastError: null
  };
  
  activeBots[id] = instance;
  setupBotLogic(instance);
  
  res.json({ success: true, bot: { id, name } });
});

app.delete('/api/bots/:id', async (req, res) => {
  const { id } = req.params;
  if (activeBots[id]) {
    if (activeBots[id].bot) {
      activeBots[id].bot?.stopPolling();
    }
    delete activeBots[id];
    await db.collection('bots').doc(id).delete();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Bot bulunamadı.' });
  }
});

app.post('/api/bots/:id/config', async (req, res) => {
  const { id } = req.params;
  const { systemPrompt, temperature, maxHistory, name } = req.body;
  
  if (!activeBots[id]) return res.status(404).json({ error: 'Bot bulunamadı.' });
  
  const config = activeBots[id].config;
  if (systemPrompt !== undefined) config.systemPrompt = systemPrompt;
  if (temperature !== undefined) config.temperature = parseFloat(temperature);
  if (maxHistory !== undefined) config.maxHistory = parseInt(maxHistory);
  if (name !== undefined) config.name = name;
  
  await db.collection('bots').doc(id).update({ config });
  
  res.json({ success: true, config });
});

// Vite Entegrasyonu
async function main() {
  await loadBotsFromFirebase();

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
