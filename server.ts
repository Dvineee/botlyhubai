
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

const sessions: Record<number, UserSession> = {};

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

    try {
      // 1. Get or create session
      if (!sessions[chatId]) {
        sessions[chatId] = {
          history: [],
          profile: { interests: [] }
        };
      }
      const session = sessions[chatId];

      // 2. Profile building (Simple heuristic for demo)
      if (text.toLowerCase().includes('ismim') || text.toLowerCase().includes('adım')) {
        const parts = text.split(' ');
        session.profile.name = parts[parts.length - 1];
      }
      if (text.toLowerCase().includes('ilgilendiğim') || text.toLowerCase().includes('seviyorum')) {
        session.profile.interests.push(text.split(' ').pop() || '');
      }

      // 3. Dynamic Prompt Builder
      const systemPrompt = `
Sen doğal, samimi ve akıcı konuşan bir asistansın.

Kurallar:
- Kısa yaz
- Gereksiz detay verme
- İnsan gibi konuş (robot gibi değil)
- Emin değilsen belirt
- Aynı şeyi tekrar etme
- Bazen küçük doğal ifadeler kullan (hmm, aynen, anladım, peki gibi) ama abartma.
      `.trim();

      const userProfileStr = JSON.stringify(session.profile);
      const chatHistoryStr = session.history
        .map(h => `${h.role === 'user' ? 'Kullanıcı' : 'Asistan'}: ${h.content}`)
        .join('\n');

      const finalPrompt = `
${systemPrompt}

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
          temperature: 0.8, // Slightly higher for more human feel
        }
      });

      const aiResponse = response.text || 'Üzgünüm, şu an yanıt veremiyorum.';

      // 5. Save History
      session.history.push({ role: 'user', content: text });
      session.history.push({ role: 'model', content: aiResponse });
      
      // Keep only last 10 messages
      if (session.history.length > 20) {
        session.history = session.history.slice(-20);
      }

      // 6. Send to User
      bot.sendMessage(chatId, aiResponse);

    } catch (error) {
      console.error('AI Error:', error);
      bot.sendMessage(chatId, 'Bir hata oluştu, lütfen birazdan tekrar dene.');
    }
  });
} else {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN missing. Bot features disabled.');
}

// API Routes
app.get('/api/status', (req, res) => {
  res.json({
    botActive: !!bot,
    sessionCount: Object.keys(sessions).length,
    tokenSet: !!token
  });
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
    app.use(express.static('dist'));
  }

  app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
  });
}

main();
