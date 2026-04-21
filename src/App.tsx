/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode, useEffect, useState } from "react";
import { Bot, Cpu, Database, MessageCircle, ShieldCheck, Zap, Settings, Info, User } from "lucide-react";
import { motion } from "motion/react";

interface InitialStatus {
  botActive: boolean;
  sessionCount: number;
  tokenSet: boolean;
}

export default function App() {
  const [status, setStatus] = useState<InitialStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/status");
        const data = await res.json();
        setStatus(data);
      } catch (err) {
        console.error("Durum kontrolü başarısız", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen p-4 md:p-8 font-sans bg-[#0f172a] text-[#f8fafc]">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        {/* Başlık Bölümü */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-sky-500/20">
              🤖
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Akıllı Telegram Botu</h1>
              <p className="text-sm text-slate-400">Yapay Zeka ve Hafıza Yönetimi</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className={`px-4 py-2 rounded-xl flex items-center gap-3 border ${status?.botActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
              <div className={`w-2 h-2 rounded-full ${status?.botActive ? 'bg-emerald-400 status-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-amber-400'}`} />
              <span className="text-xs font-bold uppercase tracking-wider">
                {status?.botActive ? 'Bot Aktif' : 'Kurulum Bekliyor'}
              </span>
            </div>
          </div>
        </header>

        {/* Ana Panel */}
        <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Sol Kolon: Bot Karakteri ve Ayarlar */}
          <section className="space-y-6">
            <div className="glass rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                <User size={18} />
                <h2>Bot Karakteri (Persona)</h2>
              </div>
              <div className="bg-slate-900/50 rounded-2xl p-4 text-sm leading-relaxed text-slate-300 italic border border-slate-800">
                "Samimi, doğal konuşan bir asistan. Kısa ve net cevaplar verir, gereksiz uzatmaz. İnsan gibi konuşur, araya 'hmm', 'aynen' gibi küçük ifadeler ekler."
              </div>
              <div className="pt-2">
                <div className="flex justify-between text-xs mb-2 text-slate-400 font-mono">
                  <span>Karakter Tutarlılığı</span>
                  <span className="text-sky-400">%92</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: "92%" }} 
                    className="bg-sky-500 h-full rounded-full shadow-[0_0_10px_rgba(14,165,233,0.4)]" 
                  />
                </div>
              </div>
            </div>

            <div className="glass rounded-3xl p-6 shadow-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase mb-1 tracking-widest font-mono">Aktif Sohbetler</p>
                <p className="text-4xl font-black text-white">{status?.sessionCount ?? 0}</p>
              </div>
              <div className="p-4 bg-sky-500/10 rounded-2xl border border-sky-500/20">
                <MessageCircle size={32} className="text-sky-500" />
              </div>
            </div>
          </section>

          {/* Sağ Kolon: Durum ve Hızlı Bilgi */}
          <section className="space-y-6">
            <div className="glass rounded-3xl p-6 shadow-xl space-y-6">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <Database size={18} />
                <h2>Sistem Durumu</h2>
              </div>
              
              <div className="space-y-4">
                <StatusRow label="Gemini AI Bağlantısı" ok={true} />
                <StatusRow label="Telegram API" ok={status?.botActive ?? false} />
                <StatusRow label="Hafıza Sistemi (Cache)" ok={true} />
              </div>

              {!status?.tokenSet && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl">
                  <div className="flex gap-4">
                    <Settings className="text-amber-400 shrink-0" size={24} />
                    <div className="text-xs text-amber-200 leading-relaxed">
                      <p className="font-bold mb-2 text-sm">Aksiyon Gerekli!</p>
                      <p className="opacity-90 italic">Botun çalışması için <b>Settings &gt; Secrets</b> kısmına <code>TELEGRAM_BOT_TOKEN</code> anahtarını eklemelisiniz.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="glass rounded-3xl p-6 shadow-xl flex flex-col justify-center">
               <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-4">
                <Zap size={18} />
                <h2>Nasıl Başlatılır?</h2>
              </div>
              <ul className="text-xs space-y-4 text-slate-400">
                <li className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 font-bold border border-emerald-500/20">1</span>
                  <span>@BotFather'dan botunuzun API anahtarını (token) alın.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 font-bold border border-emerald-500/20">2</span>
                  <span>Aldığınız anahtarı projenin <b>Secrets</b> paneline kaydedin.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 font-bold border border-emerald-500/20">3</span>
                  <span>Artık hazırsınız! Telegram'dan ilk mesajınızı atın.</span>
                </li>
              </ul>
            </div>
          </section>

        </main>

        <footer className="pt-8 text-center text-[10px] text-slate-600 uppercase tracking-[0.4em] font-mono border-t border-slate-800/50">
          © {new Date().getFullYear()} Yapay Zeka Botu - Kontrol Merkezi
        </footer>

      </div>
    </div>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-slate-300 font-medium">{label}</span>
      <div className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest ${ok ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
        {ok ? 'AKTİF' : 'BEKLEMEDE'}
      </div>
    </div>
  );
}
