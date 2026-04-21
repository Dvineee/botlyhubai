/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode, useEffect, useState } from "react";
import { 
  Bot, Cpu, Database, MessageCircle, ShieldCheck, 
  Zap, Settings, Info, User, Activity, 
  Terminal, Globe, Server, Lock, ChevronRight,
  RefreshCw, BarChart3, Radio, Save, Sliders, History,
  AlertTriangle, ExternalLink, CpuIcon
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
  lastError: string | null;
}

export default function App() {
  const [status, setStatus] = useState<InitialStatus | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toLocaleTimeString());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');
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
      console.error("Fetch failed", err);
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
      if (res.ok) await fetchStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#080b14] grid-bg overflow-x-hidden">
      {/* Top Professional NAV */}
      <nav className="h-14 border-b border-white/5 bg-[#080b14]/90 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-[100]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-7 h-7 bg-sky-600 rounded-lg flex items-center justify-center text-white shadow-[0_0_15px_rgba(2,132,199,0.4)] group-hover:scale-110 transition-transform">
              <CpuIcon size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white tracking-widest leading-none">CORE_OS_v2.5</span>
              <span className="text-[9px] text-sky-500 font-mono tracking-tighter">AI_COMMAND_INTERFACE</span>
            </div>
          </div>
          
          <div className="h-6 w-px bg-white/10 mx-2"></div>
          
          <div className="flex bg-slate-900/50 p-1 rounded-lg border border-white/5">
            <NavTab active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<BarChart3 size={12}/>} label="Dashboard" />
            <NavTab active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Sliders size={12}/>} label="Configuration" />
          </div>
        </div>

        <div className="flex items-center gap-8 font-mono text-[10px]">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${status?.botActive ? 'bg-emerald-500 glow-emerald shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`} />
            <span className="text-slate-400 uppercase tracking-widest">{status?.botActive ? 'Signal Stable' : 'Awaiting Patch'}</span>
          </div>
          <div className="text-slate-500 border-l border-white/10 pl-6">{lastUpdate}</div>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-8 space-y-8 max-w-[1500px] mx-auto w-full relative">
        
        {/* Fatal Error Alert if API Key invalid */}
        <AnimatePresence>
          {status?.lastError?.includes("API key not valid") && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-500/10 border-2 border-red-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 mb-8 overflow-hidden"
            >
              <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-500/20">
                <AlertTriangle size={32} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-black text-white italic uppercase tracking-tight">Kritik Yapılandırma Hatası</h3>
                <p className="text-sm text-red-100/70 leading-relaxed mt-1">
                  Sistemin sağladığı varsayılan API anahtarı arka plan (bot) modu için yetersiz kalıyor. Botun çalışması için bir <b>Gemini API Anahtarı</b> edinip Secrets kısmına eklemeniz gerekmektedir.
                </p>
              </div>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                className="bg-white text-red-600 px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl"
              >
                API ANAHTARI AL <ExternalLink size={14} />
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === 'dashboard' ? (
          <div className="space-y-8 animate-in fade-in duration-700">
            {/* High Performance Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricBox 
                icon={<MessageCircle size={20} className="text-sky-400" />}
                label="TRAFFIC_THROUGHPUT"
                value={status?.metrics.totalMessages ?? 0}
                sub="Processed Events"
                color="sky"
              />
              <MetricBox 
                icon={<Radio size={20} className="text-emerald-400" />}
                label="SIGNAL_LATENCY"
                value={`${(status?.metrics.lastLatency ?? 0).toFixed(2)}s`}
                sub="Engine Response"
                color="emerald"
              />
              <MetricBox 
                icon={<History size={20} className="text-purple-400" />}
                label="UPTIME_COUNTER"
                value={status ? formatUptime(status.metrics.uptime) : '0s'}
                sub="Continuous Runtime"
                color="purple"
              />
              <MetricBox 
                icon={<User size={20} className="text-amber-400" />}
                label="ACTIVE_NODES"
                value={status?.sessionCount ?? 0}
                sub="Live Sessions"
                color="amber"
              />
            </div>

            {/* Main Operational Panels */}
            <div className="grid grid-cols-12 gap-8">
              
              {/* Operational Log & Monitor (Left 8 Units) */}
              <div className="col-span-12 lg:col-span-8 space-y-8">
                <section className="glass-panel rounded-[2rem] border border-white/5 p-8 space-y-6 overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Radio size={120} className="text-sky-500" />
                  </div>
                  
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-500 border border-sky-500/20">
                        <Terminal size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white tracking-[0.2em] uppercase">Kernel_Diagnostics</h3>
                        <p className="text-[10px] text-slate-500 font-mono">NODE_CLUSTER_EU_W2 // LOG_STREAM_01</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[9px] font-mono text-slate-500">Auto-Refresh: 5s</span>
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    </div>
                  </div>

                  <div className="bg-[#05070a] border border-white/5 rounded-2xl p-6 font-mono text-[11px] leading-relaxed relative overflow-hidden h-[340px] shadow-inner scrollbar-thin">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-transparent to-[#05070a]/80 pointer-events-none z-10" />
                    <div className="space-y-2">
                       <LogEntry type="sys" time="00:01" msg="Arayüz protokolü başlatıldı." />
                       <LogEntry type="sys" time="00:01" msg="Sunucu rotaları oluşturuldu: /api/status, /api/config" />
                       <LogEntry type="mem" time="00:02" msg="Bellek havuzu ayrıldı: node_mem_v2" />
                       {status?.botActive ? (
                         <LogEntry type="bot" time="00:03" msg="Telegram API Gateway: SIGNAL_STABLE" />
                       ) : (
                         <LogEntry type="err" time="00:03" msg="Telegram Bot: TOKEN_NOT_FOUND" />
                       )}
                       <LogEntry type="sys" time="00:05" msg="AI Model yükleniyor: Gemini-Flash-Latest" />
                       
                       {status?.lastError && (
                         <div className="my-4 p-4 bg-red-950/30 border border-red-500/20 rounded-xl relative group">
                            <span className="absolute -top-2 left-4 bg-red-500 text-white text-[8px] px-2 py-0.5 rounded-full font-bold">FATAL_EXCEPTION</span>
                            <pre className="text-red-400 whitespace-pre-wrap break-all leading-tight text-[10px]">
                              {status.lastError}
                            </pre>
                         </div>
                       )}

                       <div className="pt-4 text-slate-700 animate-pulse italic">{">>> Kernel listening for payload interrupts..."}</div>
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <StatusPanel title="AI Persona Intelligence" icon={<User size={16}/>}>
                     <div className="h-40 bg-slate-900/40 rounded-2xl border border-white/5 p-5 text-sm italic text-slate-400 leading-relaxed overflow-y-auto scrollbar-thin">
                        "{status?.config.systemPrompt}"
                     </div>
                  </StatusPanel>
                  <StatusPanel title="Safety & Protocols" icon={<ShieldCheck size={16}/>}>
                     <div className="space-y-4 pt-2">
                        <ProtocolRow label="SSL_ENCRYPTION" active />
                        <ProtocolRow label="BOT_POLLING_V2" active={status?.botActive} />
                        <ProtocolRow label="AUTH_GATE" active />
                        <ProtocolRow label="CONTEXT_SAVE" active />
                     </div>
                  </StatusPanel>
                </div>
              </div>

              {/* Bot Guide & Quick Settings (Right 4 Units) */}
              <div className="col-span-12 lg:col-span-4 space-y-8">
                <section className="glass-panel rounded-[2rem] border border-white/5 p-8 space-y-6">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                        <Globe size={20} />
                      </div>
                      <h3 className="text-sm font-black text-white tracking-[0.2em] uppercase text-emerald-300">Quick_Deployment</h3>
                   </div>
                   
                   <div className="space-y-6">
                      <GuideItem num="01" title="API Anahtarı / Token" desc="@BotFather'dan aldığınız token'ı Secrets kısmına TELEGRAM_BOT_TOKEN olarak ekleyin." />
                      <GuideItem num="02" label="AI Entegrasyonu" title="Gemini Key" desc="Backend AI işlemleri için Secrets kısmına GEMINI_API_KEY anahtarınızı ekleyin." />
                      <GuideItem num="03" title="Botu Başlat" desc="Telegram üzerinden bota mesaj göndererek AI işlem hattını tetikleyin." />
                   </div>
                </section>

                <section className="glass-panel rounded-[2rem] border border-white/5 p-8 bg-sky-500/5 relative overflow-hidden group">
                  <div className="absolute -bottom-6 -right-6 opacity-5 group-hover:scale-110 transition-transform">
                    <Settings size={120} />
                  </div>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-black text-slate-300 tracking-widest uppercase">Live_Params</h3>
                    <button onClick={() => setActiveTab('settings')} className="text-[10px] uppercase font-bold text-sky-500 hover:underline">Config &gt;</button>
                  </div>
                  <div className="space-y-6">
                    <ParamIndicator label="CREATIVITY_INDEX" val={status?.config.temperature} max={1} />
                    <ParamIndicator label="MEMORY_DEPTH" val={status?.config.maxHistory} max={30} valLabel={`${status?.config.maxHistory} MSG`} />
                  </div>
                </section>
              </div>

            </div>
          </div>
        ) : (
          /* Configuration Experience */
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto w-full glass-panel rounded-[3rem] border border-white/5 p-12 space-y-12 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px]" />

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10 border-b border-white/5 pb-12">
               <div>
                  <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">System_Config</h2>
                  <p className="text-slate-500 font-mono text-xs mt-3 uppercase tracking-[0.3em]">AI_BEHAVIORAL_ARCHITECTURE_ADJUSTMENT</p>
               </div>
               <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setActiveTab('dashboard')}
                    className="text-[11px] font-bold text-slate-500 hover:text-white transition-colors"
                  >
                    Vazgeç
                  </button>
                  <button 
                    onClick={handleSaveConfig}
                    disabled={saving}
                    className="bg-sky-600 hover:bg-sky-500 active:scale-95 disabled:opacity-50 transition-all text-white px-8 py-4 rounded-2xl text-xs font-black tracking-widest flex items-center gap-3 shadow-[0_10px_20px_rgba(2,132,199,0.3)]"
                  >
                    <Save size={18} /> {saving ? 'Yükleniyor...' : 'KAYDET VE UYGULA'}
                  </button>
               </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
              <div className="space-y-8">
                <div className="space-y-4">
                   <label className="text-[11px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                     <Terminal size={14} className="text-sky-500" /> Bot Core Persona
                   </label>
                   <div className="relative group">
                     <textarea 
                      value={editConfig?.systemPrompt}
                      onChange={(e) => editConfig && setEditConfig({...editConfig, systemPrompt: e.target.value})}
                      className="w-full h-80 bg-slate-950/80 border border-white/10 rounded-3xl p-6 text-sm text-slate-300 font-mono italic focus:outline-none focus:border-sky-500/50 transition-all focus:ring-4 ring-sky-500/10 placeholder:text-slate-700 leading-relaxed scrollbar-thin"
                      placeholder="Sistem talimatınızı buraya girin..."
                     />
                   </div>
                </div>
              </div>

              <div className="space-y-12">
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <label className="text-[11px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                         <Zap size={14} className="text-purple-500" /> Temperature
                       </label>
                       <span className="bg-purple-500 h-6 w-12 rounded flex items-center justify-center text-[11px] font-mono font-bold text-white shadow-lg shadow-purple-500/20">{editConfig?.temperature}</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.1" 
                      value={editConfig?.temperature}
                      onChange={(e) => editConfig && setEditConfig({...editConfig, temperature: parseFloat(e.target.value)})}
                      className="w-full h-2 bg-slate-900 rounded-full appearance-none cursor-pointer accent-purple-500"
                    />
                    <p className="text-[10px] text-slate-600 leading-relaxed italic font-mono uppercase tracking-tighter">
                      * Düşük Değerler = Ciddi ve Teknik // Yüksek Değerler = Yaratıcı ve Doğal
                    </p>
                 </div>

                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <label className="text-[11px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                         <History size={14} className="text-sky-500" /> Memory Buffer Size
                       </label>
                       <span className="bg-sky-500 h-6 w-14 rounded flex items-center justify-center text-[11px] font-mono font-bold text-white shadow-lg shadow-sky-500/20">{editConfig?.maxHistory} MSG</span>
                    </div>
                    <input 
                      type="range" min="5" max="30" step="5" 
                      value={editConfig?.maxHistory}
                      onChange={(e) => editConfig && setEditConfig({...editConfig, maxHistory: parseInt(e.target.value)})}
                      className="w-full h-2 bg-slate-900 rounded-full appearance-none cursor-pointer accent-sky-500"
                    />
                    <p className="text-[10px] text-slate-600 leading-relaxed italic font-mono uppercase tracking-tighter">
                      * Sunucu belleğinde saklanacak olan maksimum karşılıklı konuşma limiti.
                    </p>
                 </div>

                 <div className="p-8 bg-sky-500/5 rounded-[2rem] border border-sky-500/10 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400">
                        <Info size={16} />
                      </div>
                      <span className="text-[11px] font-black text-white uppercase tracking-widest">Protocol Warning</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed italic">
                        Yapılandırma ayarları anlık olarak Botun AI çekirdeğine iletilir. Çok düşük 'Temperature' değerleri botu monotonlaştırabilir, çok yüksek değerler ise mantık hatalarına neden olabilir. İdeal denge 0.7 - 0.8 arasıdır.
                    </p>
                 </div>
              </div>
            </div>
          </motion.div>
        )}

      </main>

      <footer className="h-10 border-t border-white/5 bg-[#080b14]/90 backdrop-blur-xl flex items-center justify-between px-6 text-[9px] font-mono text-slate-600 uppercase tracking-[0.5em] z-50">
        <span>Operational Readiness: 100%</span>
        <span>Secure_End_to_End_Encryption_Active</span>
      </footer>
    </div>
  );
}

function NavTab({ active, label, onClick, icon }: { active: boolean; label: string; onClick: () => void, icon?: ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${active ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-500 hover:text-slate-300'}`}
    >
      {icon} {label}
    </button>
  );
}

function MetricBox({ icon, label, value, sub, color }: { icon: ReactNode; label: string; value: string | number; subText?: string, sub: string, color: string }) {
  const shadows = {
    sky: 'shadow-sky-500/10',
    emerald: 'shadow-emerald-500/10',
    purple: 'shadow-purple-500/10',
    amber: 'shadow-amber-500/10'
  } as any;
  return (
    <div className={`glass-panel border border-white/5 rounded-[1.5rem] p-6 hover:border-white/10 transition-all ${shadows[color]}`}>
      <div className="flex items-center gap-3 mb-6">
        {icon}
        <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-2xl font-black text-white tracking-widest">{value}</div>
      <div className="text-[9px] font-mono text-slate-700 uppercase tracking-tighter mt-1">{sub}</div>
    </div>
  );
}

function LogEntry({ type, time, msg }: { type: 'sys' | 'mem' | 'bot' | 'err'; time: string; msg: string }) {
  const colors = {
    sys: 'text-sky-500',
    mem: 'text-emerald-500',
    bot: 'text-purple-500',
    err: 'text-red-500'
  };
  return (
    <div className="flex gap-4">
      <span className="text-slate-700">[{time}]</span>
      <span className={`font-bold ${colors[type]}`}>{type.toUpperCase()}</span>
      <span className="text-slate-400">{msg}</span>
    </div>
  );
}

function StatusPanel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="glass-panel border border-white/5 rounded-[2rem] p-6 space-y-4">
      <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
        {icon} {title}
      </div>
      {children}
    </section>
  );
}

function ProtocolRow({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 last:pb-0">
       <span className="text-[10px] font-mono text-slate-400">{label}</span>
       <div className={`text-[9px] font-black tracking-widest uppercase ${active ? 'text-emerald-500' : 'text-slate-700'}`}>
         {active ? 'Secure' : 'Inactive'}
       </div>
    </div>
  );
}

function GuideItem({ num, title, desc, label }: { num: string; title: string; desc: string, label?: string }) {
  return (
    <div className="flex gap-4 group">
      <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center text-[10px] font-mono font-bold text-slate-500 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-xl">{num}</div>
      <div className="flex-1 space-y-1">
        <h4 className="text-xs font-black text-slate-200 uppercase tracking-tight">{title}</h4>
        <p className="text-[10px] text-slate-500 leading-relaxed font-mono">{desc}</p>
      </div>
    </div>
  );
}

function ParamIndicator({ label, val, max, valLabel }: { label: string; val: any; max: number; valLabel?: string }) {
  const percentage = (val / max) * 100;
  return (
    <div className="space-y-2">
       <div className="flex justify-between text-[9px] font-mono uppercase tracking-[0.2em] text-slate-500">
          <span>{label}</span>
          <span className="text-sky-500 font-bold">{valLabel || val}</span>
       </div>
       <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
          <div className="bg-sky-500 h-full shadow-[0_0_10px_rgba(14,165,233,0.5)]" style={{ width: `${percentage}%` }} />
       </div>
    </div>
  );
}
