
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

// Memory Layer (Local Storage Simulation)
interface UserSession {
  history: { role: 'user' | 'model'; content: string }[];
  profile: {
    name?: string;
    interests: string[];
    level?: string;
    [key: string]: any;
  };
}

interface BotConfig {
  systemPrompt: string;
  temperature: number;
  maxHistory: number;
}

const sessions: Record<number, UserSession> = {};
let botConfig: BotConfig = {
  systemPrompt: "Sen samimi, doğal konuşan bir asistansın. Kısa ve net cevap ver. Gereksiz uzatma. Bilmediğin şeyi uydurma. İnsan gibi konuş, küçük doğal ifadeler kullan (hmm, aynen, gibi) ama abartma.",
  temperature: 0.8,
  maxHistory: 10
};

// Real Metrics
let totalMessages = 0;
let startTime = Date.now();
let lastLatency = 0;

// AI Setup
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = "gemini-3-flash-preview";

// Telegram Bot Setup
const token = process.env.TELEGRAM_BOT_TOKEN;
let bot: TelegramBot | null = null;

if (token) {
  bot = new TelegramBot(token, { polling: true });
  console.log('🤖 Telegram bot started (polling)');

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) return;

    const requestStartTime = Date.now();
    totalMessages++;

    try {
      // API Key Check
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY environment variable is missing.');
      }

      // 1. Get or create session
      if (!sessions[chatId]) {
        sessions[chatId] = {
          history: [],
          profile: { interests: [] }
        };
      }
      const session = sessions[chatId];

      // 2. Profile building (Simple heuristic)
      if (text.toLowerCase().includes('ismim') || text.toLowerCase().includes('adım')) {
        const parts = text.split(' ');
        session.profile.name = parts[parts.length - 1];
      }

      // 3. Dynamic Prompt Builder
      const userProfileStr = JSON.stringify(session.profile);
      const chatHistoryStr = session.history
        .map(h => `${h.role === 'user' ? 'Kullanıcı' : 'Asistan'}: ${h.content}`)
        .join('\n');

      const finalPrompt = `
${botConfig.systemPrompt}

Kullanıcı hakkında bilgiler:
${userProfileStr}

Konuşma geçmişi:
${chatHistoryStr}

Kullanıcının son mesajı:
${text}

Cevap:
      `.trim();

      // 4. Generate Response
      const response = await ai.models.generateContent({
        model,
        contents: finalPrompt,
        config: {
          temperature: botConfig.temperature,
        }
      });

      const aiResponse = response.text || 'Üzgünüm, şu an yanıt veremiyorum.';
      lastLatency = Date.now() - requestStartTime;

      // 5. Save History
      session.history.push({ role: 'user', content: text });
      session.history.push({ role: 'model', content: aiResponse });
      
      if (session.history.length > botConfig.maxHistory * 2) {
        session.history = session.history.slice(-(botConfig.maxHistory * 2));
      }

      // 6. Send to User
      bot.sendMessage(chatId, aiResponse);

    } catch (error) {
      console.error('AI Error:', error);
      lastError = error instanceof Error ? error.message : String(error);
      bot.sendMessage(chatId, 'Bir hata oluştu, lütfen birazdan tekrar dene.');
    }
  });
} else {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN missing. Bot features disabled.');
}

let lastError: string | null = null;

// API Routes
app.use(express.json());

app.get('/api/status', (req, res) => {
  res.json({
    botActive: !!bot,
    sessionCount: Object.keys(sessions).length,
    tokenSet: !!token,
    lastError,
    metrics: {
      totalMessages,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      lastLatency: lastLatency / 1000
    },
    config: botConfig
  });
});

app.post('/api/config', (req, res) => {
  const { systemPrompt, temperature, maxHistory } = req.body;
  if (systemPrompt !== undefined) botConfig.systemPrompt = systemPrompt;
  if (temperature !== undefined) botConfig.temperature = parseFloat(temperature);
  if (maxHistory !== undefined) botConfig.maxHistory = parseInt(maxHistory);
  
  res.json({ success: true, config: botConfig });
});

// Vite Integration
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
    console.log(`🚀 Server running at http://localhost:${port}`);
  });
}

main();
