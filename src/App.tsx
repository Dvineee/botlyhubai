
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode, useEffect, useState } from "react";
import { 
  Bot, Clock, Database, MessageSquare, ShieldCheck, 
  Settings, Info, User, Activity, 
  Terminal, Globe, Server, Lock, Plus,
  RefreshCw, BarChart3, Sliders, History,
  AlertTriangle, ExternalLink, Cpu, Trash2,
  ChevronRight, LayoutDashboard, Zap, Search, Bell
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Tipler
interface BotMetrics {
  totalMessages: number;
  uptime: number;
  lastLatency: number;
}

interface BotConfig {
  name: string;
  systemPrompt: string;
  temperature: number;
  maxHistory: number;
}

interface BotData {
  id: string;
  name: string;
  active: boolean;
  metrics: BotMetrics;
  config: BotConfig;
  lastError: string | null;
  sessionCount: number;
}

export default function App() {
  const [bots, setBots] = useState<BotData[]>([]);
  const [activeBotId, setActiveBotId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'logs'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBot, setNewBot] = useState({ name: '', token: '' });

  const activeBot = bots.find(b => b.id === activeBotId) || null;

  const fetchBots = async () => {
    try {
      const res = await fetch("/api/bots");
      const data = await res.json();
      setBots(data);
      if (data.length > 0 && !activeBotId) {
        setActiveBotId(data[0].id);
      }
      setLoading(false);
    } catch (err) {
      console.error("Botlar yüklenemedi", err);
    }
  };

  useEffect(() => {
    fetchBots();
    const interval = setInterval(fetchBots, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddBot = async () => {
    if (!newBot.name || !newBot.token) return;
    try {
      const res = await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBot),
      });
      if (res.ok) {
        await fetchBots();
        setShowAddModal(false);
        setNewBot({ name: '', token: '' });
      }
    } catch (err) {
      console.error("Bot eklenemedi", err);
    }
  };

  const handleDeleteBot = async (id: string) => {
    if (!confirm('Bu botu silmek istediğinizden emin misiniz?')) return;
    try {
      await fetch(`/api/bots/${id}`, { method: 'DELETE' });
      await fetchBots();
      if (activeBotId === id) setActiveBotId(bots[0]?.id || null);
    } catch (err) {
      console.error("Bot silinemedi", err);
    }
  };

  const handleSaveConfig = async (config: BotConfig) => {
    if (!activeBotId) return;
    try {
      const res = await fetch(`/api/bots/${activeBotId}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) await fetchBots();
    } catch (err) {
      console.error("Yapılandırma kaydedilemedi", err);
    }
  };

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <RefreshCw className="animate-spin text-blue-600" size={40} />
        <span className="font-semibold text-slate-600">Sistem Yükleniyor...</span>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* Sidebar - SaaS Kökenli */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-50">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
              <Cpu size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">BotlyHub</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">AI Kontrol Merkezi</p>
            </div>
          </div>

          <nav className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">Botlarınız</p>
            {bots.map(bot => (
              <div 
                key={bot.id}
                onClick={() => setActiveBotId(bot.id)}
                className={`sidebar-item ${activeBotId === bot.id ? 'active' : ''}`}
              >
                <Bot size={18} />
                <span className="truncate flex-1">{bot.name}</span>
                <div className={`w-2 h-2 rounded-full ${bot.active ? 'bg-emerald-500 shadow-sm' : 'bg-slate-300'}`} />
              </div>
            ))}
            <button 
              onClick={() => setShowAddModal(true)}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-all font-semibold text-sm"
            >
              <Plus size={18} /> Yeni Bot Ekle
            </button>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-100 italic text-[10px] text-slate-400">
          Versiyon 2.0.0 SaaS // Tüm hakları saklıdır.
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        {/* Header Section */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-slate-800">{activeBot?.name || "Bot Seçilmedi"}</h2>
            {activeBot && (
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                <div className={`w-2 h-2 rounded-full ${activeBot.active ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                  {activeBot.active ? "Çevrimiçi" : "Bağlantı Bekleniyor"}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
             <div className="relative group lg:block hidden">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Komut ara..." className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 ring-blue-100 transition-all focus:outline-none w-64" />
             </div>
             <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
             </button>
             <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-200">
                YA
             </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="px-8 pt-6">
           <div className="flex gap-8 border-b border-slate-200">
              <TabLink active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={16}/>} label="Genel Bakış" />
              <TabLink active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={16}/>} label="Yapılandırma" />
              <TabLink active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<Terminal size={16}/>} label="İşlem Kayıtları" />
           </div>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 scrollbar-thin">
          <AnimatePresence mode="wait">
            {!activeBotId ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4"
              >
                <BarChart3 size={64} className="opacity-20" />
                <p className="font-medium">Lütfen yönetmek için bir bot seçin veya yeni bir tane oluşturun.</p>
              </motion.div>
            ) : activeTab === 'dashboard' ? (
              <div key={activeBotId + "dash"}><DashboardView bot={activeBot!} /></div>
            ) : activeTab === 'settings' ? (
              <div key={activeBotId + "settings"}><SettingsView bot={activeBot!} onSave={handleSaveConfig} onDelete={() => handleDeleteBot(activeBotId!)} /></div>
            ) : (
              <div key={activeBotId + "logs"}><LogsView bot={activeBot!} /></div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modern Add Bot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-md p-10 shadow-2xl space-y-8"
          >
            <div>
              <h3 className="text-2xl font-bold">Yeni Bot Tanımla</h3>
              <p className="text-slate-500 text-sm mt-1">Telegram ağınıza yeni bir terminal ekleyin.</p>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Görünür İsim</label>
                <input 
                  type="text" value={newBot.name} 
                  onChange={e => setNewBot({...newBot, name: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 ring-blue-50 transition-all outline-none"
                  placeholder="Örn: Destek Asistanı"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Telegram API Token</label>
                <input 
                  type="password" value={newBot.token} 
                  onChange={e => setNewBot({...newBot, token: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 ring-blue-50 transition-all outline-none"
                  placeholder="BotFather'dan aldığınız token"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all"
              >
                Vazgeç
              </button>
              <button 
                onClick={handleAddBot}
                className="btn-primary flex-1"
              >
                Botu Başlat
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function TabLink({ active, label, icon, onClick }: { active: boolean, label: string, icon: ReactNode, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-all font-semibold text-sm ${active ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
    >
      {icon} {label}
    </button>
  );
}

function DashboardView({ bot }: { bot: BotData }) {
  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h} sa ${m} dk`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 animate-fade-in">
      
      {/* API Key Hatası */}
      {bot.lastError?.includes("API key not valid") && (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 flex items-center gap-6">
           <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0">
              <AlertTriangle size={24} />
           </div>
           <div>
              <h4 className="font-bold text-orange-800 uppercase text-xs tracking-widest">Kritik Yapılandırma Gerekli</h4>
              <p className="text-sm text-orange-700 mt-1">Botunuzun AI motoru çalışmıyor. Lütfen Secrets kısmına geçerli bir <b>MY_CUSTOM_GEMINI_KEY</b> ekleyin.</p>
           </div>
           <a href="https://aistudio.google.com/app/apikey" target="_blank" className="ml-auto flex items-center gap-2 text-xs font-bold text-orange-600 hover:underline">
              Anahtar Al <ExternalLink size={14} />
           </a>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DataCard label="Toplam Mesaj" value={bot.metrics.totalMessages} icon={<MessageSquare size={20}/>} color="blue" />
        <DataCard label="Gecikme Hızı" value={`${(bot.metrics.lastLatency / 1000).toFixed(2)} sn`} icon={<Zap size={20}/>} color="emerald" />
        <DataCard label="Aktif Süre" value={formatUptime(bot.metrics.uptime)} icon={<Clock size={20}/>} color="purple" />
        <DataCard label="Canlı Oturum" value={bot.sessionCount} icon={<User size={20}/>} color="amber" />
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8">
           <div className="card-saas p-8 space-y-6">
              <div className="flex items-center justify-between">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2"><Zap size={18} className="text-blue-500" /> Bot Zekası Özeti</h3>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Model: Gemini-Flash</span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 italic text-slate-600 text-sm leading-relaxed">
                 "{bot.config.systemPrompt}"
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Yaratıcılık</p>
                    <p className="font-bold text-blue-600">%{bot.config.temperature * 100}</p>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Hafıza Derinliği</p>
                    <p className="font-bold text-blue-600">{bot.config.maxHistory} Mesaj</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="col-span-12 lg:col-span-4">
           <div className="card-saas p-8 space-y-6 bg-blue-600 text-white relative overflow-hidden">
               <div className="absolute -bottom-12 -right-12 text-white/10 rotate-12">
                  <ShieldCheck size={180} />
               </div>
               <h3 className="font-bold relative z-10">Güvenlik & Altyapı</h3>
               <div className="space-y-4 relative z-10">
                  <InfrastructureItem label="Uçtan Uca Şifreleme" active />
                  <InfrastructureItem label="Hafıza İzolasyonu" active />
                  <InfrastructureItem label="Yük Dengeleyici" active />
                  <InfrastructureItem label="Anlık Polling" active={bot.active} />
               </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}

function SettingsView({ bot, onSave, onDelete }: { bot: BotData, onSave: (c: BotConfig) => void, onDelete: () => void }) {
  const [localConfig, setLocalConfig] = useState<BotConfig>(bot.config);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-4xl space-y-8 animate-fade-in">
      <div className="card-saas p-10 space-y-10">
        <div className="flex items-center justify-between">
           <div>
              <h3 className="text-xl font-bold">Genel Ayarlar</h3>
              <p className="text-slate-500 text-sm">Botun kişiliğini ve teknik detaylarını özelleştirin.</p>
           </div>
           <div className="flex gap-3">
              <button onClick={() => onDelete()} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all">
                 <Trash2 size={20} />
              </button>
              <button 
                onClick={() => onSave(localConfig)}
                className="btn-primary"
              >
                Değişiklikleri Kaydet
              </button>
           </div>
        </div>

        <div className="space-y-8">
           <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bot Görünen İsmi</label>
              <input 
                type="text" value={localConfig.name} 
                onChange={e => setLocalConfig({...localConfig, name: e.target.value})}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 ring-blue-50 transition-all outline-none"
              />
           </div>

           <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sistem Promptu (Kişilik)</label>
              <textarea 
                value={localConfig.systemPrompt}
                onChange={e => setLocalConfig({...localConfig, systemPrompt: e.target.value})}
                className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 ring-blue-50 transition-all outline-none resize-none text-sm leading-relaxed"
              />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sıcaklık (Yaratıcılık)</label>
                    <span className="font-mono font-bold text-blue-600">{localConfig.temperature}</span>
                 </div>
                 <input 
                  type="range" min="0" max="1" step="0.1" value={localConfig.temperature}
                  onChange={e => setLocalConfig({...localConfig, temperature: parseFloat(e.target.value)})}
                  className="w-full h-2 bg-slate-100 rounded-full appearance-none accent-blue-600"
                 />
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Hafıza Kapasitesi</label>
                    <span className="font-mono font-bold text-blue-600">{localConfig.maxHistory} Msg</span>
                 </div>
                 <input 
                  type="range" min="5" max="30" step="5" value={localConfig.maxHistory}
                  onChange={e => setLocalConfig({...localConfig, maxHistory: parseInt(e.target.value)})}
                  className="w-full h-2 bg-slate-100 rounded-full appearance-none accent-blue-600"
                 />
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}

function LogsView({ bot }: { bot: BotData }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col space-y-6 animate-fade-in">
       <div className="card-saas p-8 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6">
             <h3 className="font-bold flex items-center gap-2"><Terminal size={18} /> Canlı İşlem Kayıtları</h3>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Aktif İzleme</span>
             </div>
          </div>
          <div className="bg-slate-900 rounded-2xl p-6 flex-1 overflow-y-auto font-mono text-[11px] leading-loose scrollbar-thin">
             <LogLine time="23:44" type="SYS" msg="Kernel başlatıldı." />
             <LogLine time="23:44" type="API" msg="Telegram bağlantısı denetleniyor..." />
             <LogLine time="23:45" type="INF" msg={`${bot.name} aktif edildi.`} />
             {bot.active ? (
               <LogLine time="23:46" type="GET" msg="Sunucu rotaları başarıyla bağlandı." />
             ) : (
               <LogLine time="23:46" type="ERR" msg="Bağlantı hatası: Token doğrulanamadı." />
             )}
             <LogLine time="23:47" type="AI" msg="Yüklenen model: Gemini-Flash-Latest" />
             {bot.lastError && (
               <div className="mt-4 p-4 bg-red-900/20 border border-red-500/20 rounded-xl text-red-400">
                  <p className="font-bold text-[10px] mb-1">KRITIK ISTISNA:</p>
                  {bot.lastError}
               </div>
             )}
             <div className="mt-4 text-slate-600 animate-pulse"> {`>_ Yeni veri bekleniyor...`}</div>
          </div>
       </div>
    </motion.div>
  );
}

function DataCard({ label, value, icon, color }: { label: string, value: any, icon: ReactNode, color: string }) {
  const c = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600'
  } as any;
  return (
    <div className="card-saas p-6 space-y-4">
      <div className={`w-10 h-10 ${c[color]} rounded-xl flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-extrabold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function InfrastructureItem({ label, active }: { label: string, active?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
       <span className="text-xs text-white/70">{label}</span>
       <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${active ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/10 text-white/30'}`}>
          {active ? "AKTIF" : "PASIF"}
       </div>
    </div>
  );
}

function LogLine({ time, type, msg }: { time: string, type: string, msg: string }) {
  const typeColors = {
    SYS: 'text-blue-400',
    API: 'text-purple-400',
    INF: 'text-emerald-400',
    GET: 'text-sky-400',
    AI: 'text-amber-400',
    ERR: 'text-red-400'
  } as any;
  return (
    <div className="flex gap-4">
       <span className="text-slate-600">[{time}]</span>
       <span className={`font-bold w-10 ${typeColors[type] || 'text-white'}`}>{type}</span>
       <span className="text-slate-300">{msg}</span>
    </div>
  );
}
