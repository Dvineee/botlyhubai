/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode, useEffect, useState } from "react";
import { Bot, Cpu, Database, MessageSquare, ShieldCheck, Zap, Settings, Info, Activity } from "lucide-react";
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
        console.error("Status check failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen p-6 font-sans bg-[#0f172a] text-[#f8fafc]">
      {/* Header */}
      <header className="flex justify-between items-center mb-10 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-sky-500/20">
            🧠
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight uppercase">AI Prompt Engine</h1>
            <p className="text-xs text-slate-400">v2.4.0 • Human-Like Response Pipeline</p>
          </div>
        </div>
        
        <div className="flex gap-6 items-center">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">System Status</p>
              <div className="flex items-center gap-2 justify-end">
                <span className={`text-sm font-medium uppercase ${status?.botActive ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {status?.botActive ? 'Active' : 'Awaiting Config'}
                </span>
                <div className={`w-2 h-2 rounded-full ${status?.botActive ? 'bg-emerald-400 status-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-amber-400'}`} />
              </div>
            </div>
            <div className="h-10 w-px bg-slate-800"></div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Active Sessions</p>
              <p className="text-xl font-mono font-medium text-sky-400">{status?.sessionCount ?? 0}</p>
            </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="flex-1 grid grid-cols-12 gap-6">
        
        {/* Left Column: Core Persona & Params */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="glass rounded-2xl p-6 flex-1 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]"></span>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300">System Prompt (Persona)</h2>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 h-[320px] overflow-hidden text-sm leading-relaxed text-slate-300 italic border-l-4 border-l-sky-500/50">
              "Sen samimi, doğal konuşan bir asistansın. Kısa ve net cevap ver. Gereksiz uzatma. Bilmediğin şeyi uydurma. İnsan gibi konuş, küçük doğal ifadeler kullan (hmm, aynen, gibi) ama abartma. Teknik konularda açıklayıcı, sohbette kısa kal."
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-[11px] font-medium uppercase tracking-tight">
                <span className="text-slate-400">Persona Consistency</span>
                <span className="text-sky-400">92% Match</span>
              </div>
              <div className="w-full bg-slate-800/50 h-2 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "92%" }}
                  className="bg-sky-500 h-full rounded-full shadow-[0_0_10px_rgba(14,165,233,0.4)]"
                />
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]"></span>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300">Dynamic Parameters</h2>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Temperature</label>
                <div className="text-2xl font-mono font-medium text-purple-300">0.80</div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full" style={{ width: "80%" }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Response Buff</label>
                <div className="text-2xl font-mono font-medium text-purple-300">Enabled</div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full" style={{ width: "100%" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Memory Layer & Log */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          <div className="glass rounded-2xl p-6 flex-1 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300">Memory Layer (Context)</h2>
              </div>
              <span className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-mono tracking-tighter">
                Storage: Local-Cache
              </span>
            </div>
            
            <div className="space-y-6 flex-1">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                <p className="text-[10px] text-slate-500 uppercase mb-3 font-mono">Schema Mapping: Identity_v1</p>
                <div className="code-font text-emerald-300/80 leading-relaxed">
                  {`{`}
                  <br />&nbsp;&nbsp;{`"state": "active",`}
                  <br />&nbsp;&nbsp;{`"persistence": "session-based",`}
                  <br />&nbsp;&nbsp;{`"max_buffer": 10_messages`}
                  <br />{`}`}
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <p className="text-[10px] text-slate-500 uppercase font-mono mb-2">System Diagnostics</p>
                <div className="bg-black/40 rounded-xl p-4 border border-slate-800/50 h-[240px] overflow-y-auto space-y-2 font-mono text-[11px]">
                  <div className="text-sky-400">{`>>> Kernal successfully initialized.`}</div>
                  <div className="text-slate-500">{`[INFO] Loading Prompt Engine v1.2...`}</div>
                  {status?.botActive && <div className="text-emerald-400">{`[OK] Bot polling active on cluster 01.`}</div>}
                  {!status?.tokenSet && <div className="text-amber-400">{`[WARN] TELEGRAM_BOT_TOKEN missing.`}</div>}
                  <div className="text-slate-600 animate-pulse">{`> Listening for incoming events...`}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 h-36 flex items-center justify-around shadow-xl">
            <div className="text-center">
              <div className="text-2xl font-black text-sky-400">{status?.sessionCount ?? 0}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">sessions</div>
            </div>
            <div className="h-10 w-px bg-slate-800"></div>
            <div className="text-center">
              <div className="text-2xl font-black text-emerald-400">98.2%</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">accuracy</div>
            </div>
            <div className="h-10 w-px bg-slate-800"></div>
            <div className="text-center">
              <div className="text-2xl font-black text-amber-400">{status?.botActive ? 'Live' : 'Standby'}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Bot State</div>
            </div>
          </div>
        </div>

        {/* Right Column: Pipeline & Actions */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
          <div className="glass rounded-2xl p-6 flex-1 flex flex-col shadow-xl">
            <div className="flex items-center gap-2 mb-8">
                <Activity size={16} className="text-pink-500" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300">Pipeline Flow</h2>
            </div>
            
            <div className="flex-1 flex flex-col justify-between py-2 relative">
                <div className="absolute left-[15px] top-6 bottom-6 w-px border-l-2 border-dashed border-slate-800"></div>
                
                <PipelineStep num="1" label="Message Received" active />
                <PipelineStep num="2" label="Fetch Memory" active />
                <PipelineStep num="3" label="Build Prompt" highlighted />
                <PipelineStep num="4" label="LLM Inference" />
                <PipelineStep num="5" label="Terminal Output" />
            </div>
          </div>

          {!status?.tokenSet && (
            <div className="bg-sky-600 hover:bg-sky-500 cursor-pointer transition-all active:scale-95 rounded-2xl p-6 text-center shadow-lg shadow-sky-900/30 group">
                <p className="text-[10px] text-sky-200 uppercase tracking-[0.2em] mb-2 font-black group-hover:tracking-[0.3em] transition-all">Action Required</p>
                <p className="font-bold text-sm">SET BOT TOKEN</p>
                <p className="text-[10px] text-sky-100/60 mt-2">Go to Settings &gt; Secrets</p>
            </div>
          )}
          
          <div className="glass rounded-2xl p-6 text-[11px] text-slate-500 font-mono space-y-4">
             <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span>ID</span>
                <span className="text-slate-300">node_cluster_tr</span>
             </div>
             <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span>UPTIME</span>
                <span className="text-emerald-400">Live</span>
             </div>
             <div className="flex justify-between items-center">
                <span>SYNC</span>
                <span className="text-slate-300">Real-time</span>
             </div>
          </div>
        </div>

      </main>

      {/* Mobile Disclaimer */}
      <footer className="mt-8 text-center text-[10px] text-slate-600 uppercase tracking-[0.3em] font-mono">
        &copy; {new Date().getFullYear()} AI Prompt Logic - Human-AI-Interaction_Protocol
      </footer>
    </div>
  );
}

function PipelineStep({ num, label, active, highlighted }: { num: string; label: string; active?: boolean; highlighted?: boolean }) {
    return (
        <div className="flex items-center gap-4 relative z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border text-[11px] font-mono transition-colors tracking-tighter ${
                highlighted ? 'bg-sky-500 border-sky-400 text-white shadow-[0_0_15px_rgba(56,189,248,0.4)]' : 
                active ? 'bg-slate-800 border-slate-600 text-slate-300' : 
                'bg-slate-900 border-slate-800 text-slate-600'
            }`}>
                {num}
            </div>
            <div className={`px-3 py-2 rounded-lg border text-[11px] w-full transition-all tracking-tight ${
                highlighted ? 'bg-sky-500/10 border-sky-500/50 text-sky-200' : 
                active ? 'bg-slate-800 border-slate-700 text-slate-400' : 
                'bg-slate-900/50 border-slate-800/50 text-slate-600'
            }`}>
                {label}
            </div>
        </div>
    );
}


