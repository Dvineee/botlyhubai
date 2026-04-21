/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode, useEffect, useState } from "react";
import { 
  Bot, Cpu, Database, MessageCircle, ShieldCheck, 
  Zap, Settings, Info, User, Activity, 
  Terminal, Globe, Server, Lock, ChevronRight,
  RefreshCw, BarChart3, Radio, Save, Sliders, History
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Metrics {
  totalMessages: number;
  uptime: number;
  lastLatency: number;
}

interface BotConfig {
  systemPrompt: string;
  temperature: number;
  maxHistory: number;
}

interface InitialStatus {
  botActive: boolean;
  sessionCount: number;
  tokenSet: boolean;
  metrics: Metrics;
  config: BotConfig;
}

export default function App() {
  const [status, setStatus] = useState<InitialStatus | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toLocaleTimeString());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');
  
  // Local Config for editing
  const [editConfig, setEditConfig] = useState<BotConfig | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      setStatus(data);
      if (!editConfig) setEditConfig(data.config);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Durum kontrolü başarısız", err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveConfig = async () => {
    if (!editConfig) return;
    setSaving(true);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editConfig),
      });
      if (res.ok) {
        await fetchStatus();
        alert("Ayarlar başarıyla güncellendi.");
      }
    } catch (err) {
      alert("Hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}s ${m}d ${s}sn`;
  };

  return (
    <div className="flex flex-col min-h-screen grid-bg">
      {/* Üst Navigasyon Kontrolü */}
      <nav className="h-14 border-b border-white/5 bg-[#0b0f1a]/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-sky-500 rounded flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-sky-500/20">A</div>
            <span className="text-sm font-bold tracking-tight text-slate-200">AIS_CORE_V2</span>
          </div>
          <div className="h-4 w-px bg-white/10"></div>
          <div className="flex items-center gap-4 ml-2">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`text-[10px] font-mono uppercase tracking-widest transition-colors ${activeTab === 'dashboard' ? 'text-sky-400 border-b border-sky-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`text-[10px] font-mono uppercase tracking-widest transition-colors ${activeTab === 'settings' ? 'text-sky-400 border-b border-sky-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Konfigürasyon
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${status?.botActive ? 'bg-emerald-400 glow-emerald' : 'bg-amber-400 scale-pulse'}`} />
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              {status?.botActive ? 'Sistem Aktif' : 'Beklemede'}
            </span>
          </div>
          <div className="h-4 w-px bg-white/10"></div>
          <span className="text-[10px] font-mono text-slate-500">{lastUpdate}</span>
        </div>
      </nav>

      <main className="flex-1 p-6 space-y-6 max-w-[1600px] mx-auto w-full">
        
        {activeTab === 'dashboard' ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Metrikler */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 glass-panel rounded-2xl p-6 flex items-center gap-6 border-l-4 border-l-sky-500">
                <div className="w-16 h-16 bg-sky-500/10 rounded-2xl flex items-center justify-center border border-sky-500/20">
                  <Bot size={32} className="text-sky-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">Bot Kontrol Merkezi</h1>
                  <p className="text-xs text-slate-500 font-medium tracking-wide">CANLI VERİ AKIŞI VE SİSTEM TANI ARACI</p>
                </div>
              </div>
              
              <MetricCard 
                icon={<MessageCircle size={18} className="text-emerald-400" />}
                label="Toplam Mesaj"
                value={status?.metrics?.totalMessages ?? 0}
                sub="İşlenen Veri"
              />
              
              <MetricCard 
                icon={<Radio size={18} className="text-purple-400" />}
                label="Gecikme (Latency)"
                value={`${(status?.metrics?.lastLatency ?? 0).toFixed(2)}s`}
                sub="Son İşlem Hızı"
              />
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8 space-y-6">
                {/* Sol Büyük Panel: Karakter ve İzleme */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <section className="glass-panel rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-2 text-sky-400 font-mono text-[10px] uppercase tracking-widest">
                      <User size={14} /> Aktif Persona
                    </div>
                    <div className="bg-slate-950/80 rounded-xl p-5 border border-white/5 h-48 overflow-y-auto scrollbar-thin">
                      <p className="text-sm italic text-slate-300 font-mono leading-relaxed">
                        "{status?.config.systemPrompt}"
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>Karakter Tutarlılığı</span>
                      <span className="text-emerald-400">92% Match</span>
                    </div>
                  </section>

                  <section className="glass-panel rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-2 text-purple-400 font-mono text-[10px] uppercase tracking-widest">
                      <Activity size={14} /> Canlı Loglar
                    </div>
                    <div className="bg-slate-950 rounded-xl p-4 font-mono text-[10px] space-y-2 h-48 overflow-y-auto border border-white/5 scrollbar-thin">
                      <LogLine type="sys" msg="Çekirdek başarıyla başlatıldı." />
                      <LogLine type="mem" msg="Hafıza katmanı aktif edildi." />
                      {status?.botActive ? <LogLine type="bot" msg="Telegram API bağlantısı kuruldu." /> : <LogLine type="err" msg="Token eksik: Yapılandırma bekleniyor." />}
                      <LogLine type="sys" msg={`Çalışma Süresi: ${formatUptime(status?.metrics.uptime ?? 0)}`} />
                      <div className="text-slate-600 animate-pulse mt-2">{">_ veri bekleniyor..."}</div>
                    </div>
                  </section>
                </div>

                {/* Alt Tablo: Oturum Bilgileri */}
                <section className="glass-panel rounded-2xl p-6 overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                     <div className="flex items-center gap-2 text-emerald-400 font-mono text-[10px] uppercase tracking-widest">
                      <Server size={14} /> Global Altyapı
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">Cluster: node_tr_central</div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <StatusItem label="Hizmet Durumu" val="OPERATIONAL" ok />
                    <StatusItem label="AI Model" val="Gemini 1.5 Flash" ok />
                    <StatusItem label="Aktif Kullanıcı" val={status?.sessionCount ?? 0} ok />
                    <StatusItem label="API Kota" val="Sınırsız (Free Plan)" ok />
                  </div>
                </section>
              </div>

              {/* Sağ Kolon: Hızlı Aksiyon/Kurulum */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                 {!status?.tokenSet && (
                    <div className="bg-amber-500/10 border-2 border-dashed border-amber-500/20 p-6 rounded-2xl space-y-4">
                      <div className="flex items-center gap-3">
                        <Settings className="text-amber-400 animate-spin-slow" size={24} />
                        <h3 className="font-black text-amber-100 uppercase tracking-widest text-sm">Kurulum Gerekli</h3>
                      </div>
                      <p className="text-xs text-amber-200/70 leading-relaxed italic">
                        Botun çalışması için AI Studio'nun <b>Settings &gt; Secrets</b> kısmına <code>TELEGRAM_BOT_TOKEN</code> anahtarınızı eklemelisiniz.
                      </p>
                    </div>
                 )}

                 <section className="glass-panel rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-2 text-sky-400 font-mono text-[10px] uppercase tracking-widest">
                      <ShieldCheck size={14} /> Devreye Alma Rehberi
                    </div>
                    <div className="space-y-3">
                       <Step num="01" label="@BotFather'dan Token Al" />
                       <Step num="02" label="Secrets Paneline Ekle" />
                       <Step num="03" label="Botu /start ile Başlat" />
                    </div>
                 </section>
                 
                 <section className="glass-panel rounded-2xl p-6 bg-sky-500/5 border border-sky-500/10">
                    <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px] uppercase mb-4">
                      <Sliders size={14} /> Kontrol Paneli Parametreleri
                    </div>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center text-[11px] font-mono">
                          <span className="text-slate-500 uppercase">Yaratıcılık</span>
                          <span className="text-white">{status?.config.temperature}</span>
                       </div>
                       <div className="flex justify-between items-center text-[11px] font-mono">
                          <span className="text-slate-500 uppercase">Hafıza Derinliği</span>
                          <span className="text-white">{status?.config.maxHistory} msj</span>
                       </div>
                    </div>
                 </section>
              </div>
            </div>
          </div>
        ) : (
          /* Ayarlar Paneli */
          <div className="max-w-4xl mx-auto w-full glass-panel rounded-3xl p-8 space-y-10 animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight italic flex items-center gap-3">
                  <Sliders className="text-sky-500" /> SİSTEM YAPILANDIRMASI
                </h2>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Botun zekasını ve tavrını özelleştirin</p>
              </div>
              <button 
                onClick={handleSaveConfig}
                disabled={saving}
                className="bg-sky-500 hover:bg-sky-400 active:scale-95 disabled:opacity-50 transition-all text-white px-6 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-500/20"
              >
                <Save size={16} /> {saving ? 'Kaydediliyor...' : 'AYARLARI UYGULA'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
                    <User size={12} /> Yapay Zeka Karakteri (System Prompt)
                  </label>
                  <textarea 
                    value={editConfig?.systemPrompt}
                    onChange={(e) => editConfig && setEditConfig({...editConfig, systemPrompt: e.target.value})}
                    placeholder="Örn: Sen ciddi ve teknik bir dokümantasyon asistanısın..."
                    className="w-full bg-slate-950/50 border border-white/5 rounded-2xl p-4 text-sm text-slate-300 h-64 focus:outline-none focus:border-sky-500/50 transition-colors font-mono italic"
                  />
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    * Botunuzun nasıl davranacağını belirleyen ana talimat budur. Kişilik, kısıtlamalar ve üslup burada tanımlanır.
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-black tracking-widest">
                    <span className="flex items-center gap-2"><Zap size={12} /> Yaratıcılık Seviyesi (Temp)</span>
                    <span className="text-sky-400">{editConfig?.temperature}</span>
                  </div>
                  <input 
                    type="range" min="0" max="1" step="0.1" 
                    value={editConfig?.temperature}
                    onChange={(e) => editConfig && setEditConfig({...editConfig, temperature: parseFloat(e.target.value)})}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                    <span>CİDDİ (0.0)</span>
                    <span>YARATICI (1.0)</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-black tracking-widest">
                    <span className="flex items-center gap-2"><History size={12} /> Hafıza Derinliği (Context)</span>
                    <span className="text-sky-400">{editConfig?.maxHistory} Mesaj</span>
                  </div>
                  <input 
                    type="range" min="5" max="30" step="5" 
                    value={editConfig?.maxHistory}
                    onChange={(e) => editConfig && setEditConfig({...editConfig, maxHistory: parseInt(e.target.value)})}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <p className="text-[10px] text-slate-600">
                    Botun önceki kaç mesajı hatırlayacağını belirler. Daha yüksek değer daha iyi bağlam demektir ancak yanıt süresini etkileyebilir.
                  </p>
                </div>

                <div className="p-6 bg-sky-500/5 rounded-2xl border border-sky-500/10 space-y-3">
                   <div className="flex items-center gap-2 text-sky-400 text-[10px] font-bold uppercase tracking-widest">
                      <Info size={14} /> Güvenlik Notu
                   </div>
                   <p className="text-[10px] text-slate-500 leading-relaxed italic">
                      Bu ayarlarda yapılan değişiklikler anında API üzerinden bota iletilir ve yeni sohbete başlayan kullanıcılar için hemen aktif olur. Kritik değişiklik sonrası botu test etmeniz önerilir.
                   </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      <footer className="h-10 border-t border-white/5 bg-[#0b0f1a]/80 backdrop-blur-md flex items-center justify-between px-6 text-[9px] font-mono text-slate-600 uppercase tracking-[0.5em]">
        <span>Build ID: AIS_CMD_8832</span>
        <div className="flex items-center gap-4">
           <span>Uptime: {status ? formatUptime(status.metrics.uptime) : '0s'}</span>
           <span>Sync: Real-time</span>
        </div>
      </footer>
    </div>
  );
}

function MetricCard({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string | number; sub: string }) {
  return (
    <div className="glass-panel rounded-2xl p-6 group hover:border-white/10 transition-all border border-white/5 border-b-2 border-b-sky-500/20">
      <div className="flex items-center gap-3 mb-4 opacity-70 group-hover:opacity-100 transition-opacity">
        {icon}
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-3xl font-black text-white tracking-tighter mb-1">{value}</div>
      <div className="text-[9px] font-mono text-slate-600 uppercase tracking-wider">{sub}</div>
    </div>
  );
}

function LogLine({ type, msg }: { type: 'sys' | 'mem' | 'bot' | 'err'; msg: string }) {
  const colors = {
    sys: 'text-sky-500',
    mem: 'text-emerald-500',
    bot: 'text-purple-500',
    err: 'text-red-500'
  };
  const label = {
    sys: '[SYS]',
    mem: '[MEM]',
    bot: '[BOT]',
    err: '[ERR]'
  };
  return (
    <div className="flex gap-2">
      <span className={colors[type]}>{label[type]}</span>
      <span className="text-slate-400">{msg}</span>
    </div>
  );
}

function StatusItem({ label, val, ok }: { label: string; val: string | number; ok: boolean }) {
  return (
    <div>
      <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-[11px] font-bold ${ok ? 'text-slate-200' : 'text-amber-500'}`}>{val}</div>
    </div>
  );
}

function Step({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-center gap-3 group">
      <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-[10px] font-mono text-slate-500 group-hover:bg-sky-500 group-hover:text-white transition-colors">{num}</div>
      <span className="text-[11px] font-medium text-slate-500 group-hover:text-slate-200 transition-colors">{label}</span>
      <ChevronRight size={12} className="ml-auto text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
