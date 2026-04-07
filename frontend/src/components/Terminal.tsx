"use client";

import { useEffect, useState, useRef } from 'react';
import { X, SearchCode, Terminal as TermIcon, Cpu, Activity, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type LogEntry = {
  id: number;
  bot_id: string;
  timestamp: string;
  action: string;
  details: string;
  model: string;
  cost: number;
  has_context: boolean;
};

export default function Terminal() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<{ prompt: string; response: string } | null>(null);
  const bottomRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace('http', 'ws') + '/ws/terminal'
      : `${protocol}//${window.location.hostname}:8000/ws/terminal`;

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLogs((prev) => [...prev.slice(-200), data]);
      } catch (e) {
        console.error(e);
      }
    };

    return () => ws.close();
  }, []);

  const botIds = Array.from(new Set(logs.map(l => l.bot_id))).filter(Boolean);

  useEffect(() => {
    botIds.forEach(id => {
      bottomRefs.current[id]?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [logs, botIds]);

  const fetchLogContext = async (id: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/terminal/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedLog(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getActionStyles = (action: string) => {
    switch (action) {
      case 'ERROR':
      case 'FAILED':
        return 'text-red-400 bg-red-500/5 border-red-500/20';
      case 'SUCCESS':
        return 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20';
      case 'FOUND':
        return 'text-amber-400 bg-amber-500/5 border-amber-500/20';
      case 'PR':
        return 'text-blue-400 bg-blue-500/5 border-blue-500/20';
      default:
        return 'text-purple-400 bg-purple-500/5 border-purple-500/20';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[650px] relative font-mono">
      {botIds.length === 0 && (
        <div className="col-span-full h-full flex flex-col items-center justify-center space-y-6 opacity-20 border-2 border-dashed border-white/10 rounded-3xl">
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <TermIcon size={60} />
          </motion.div>
          <p className="font-black uppercase tracking-[0.5em] text-sm">Synchronizing Neural Uplink...</p>
        </div>
      )}
      
      <AnimatePresence>
        {botIds.map((botId) => (
          <motion.div 
            key={botId}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col bg-black/40 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative group"
          >
            {/* Terminal Header */}
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-20" />
                </div>
                <span className="font-black text-xs tracking-widest text-white group-hover:text-purple-400 transition-colors">{botId}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  <Activity size={10} className="text-purple-400" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {logs.filter(l => l.bot_id === botId).length} EVENTS
                  </span>
                </div>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar scroll-smooth">
              {logs.filter(l => l.bot_id === botId).map((log, i) => (
                <motion.div
                  key={`${botId}-${i}`}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "group/item relative pl-4 border-l border-white/5 hover:border-purple-500/30 transition-all",
                    log.has_context && "cursor-pointer"
                  )}
                  onClick={() => log.has_context && fetchLogContext(log.id)}
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-[10px] font-black text-gray-600">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase border",
                      getActionStyles(log.action)
                    )}>
                      {log.action}
                    </span>
                    <span className="text-gray-300 text-sm leading-relaxed flex-1">
                      {log.details}
                    </span>
                  </div>
                  
                  {(log.model || log.cost > 0) && (
                    <div className="flex items-center gap-3 mt-1.5 opacity-40 group-hover/item:opacity-100 transition-opacity">
                      {log.model && (
                        <div className="flex items-center gap-1 text-[9px] font-black text-indigo-400 uppercase tracking-tighter">
                          <Cpu size={10} /> {log.model}
                        </div>
                      )}
                      {log.cost > 0 && (
                        <div className="flex items-center gap-1 text-[9px] font-black text-amber-500 uppercase tracking-tighter">
                          <ShieldCheck size={10} /> ${log.cost.toFixed(4)}
                        </div>
                      )}
                      {log.has_context && (
                        <div className="flex items-center gap-1 text-[9px] font-black text-purple-400 uppercase tracking-tighter animate-pulse">
                          <SearchCode size={10} /> CONTEXT AVAILABLE
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
              <div ref={el => bottomRefs.current[botId] = el} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Log Modal */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="liquid-glass-panel w-full max-w-6xl h-[85vh] rounded-[40px] border border-white/10 shadow-[0_0_100px_rgba(168,85,247,0.3)] flex flex-col overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                    <SearchCode className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">Intelligence Trace</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Bot Transaction Deep-Dive</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedLog(null)} 
                  className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-gray-400 transition-all flex items-center justify-center"
                >
                  <X />
                </button>
              </div>
              
              <div className="p-10 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-10 custom-scrollbar">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-fuchsia-400 uppercase tracking-[0.3em]">Neural Input</h4>
                    <span className="text-[10px] font-mono text-gray-600">SHA-256 VERIFIED</span>
                  </div>
                  <div className="relative group">
                    <pre className="bg-black/60 p-8 rounded-[32px] border border-white/5 text-xs text-purple-200 font-mono whitespace-pre-wrap overflow-x-auto shadow-inner leading-relaxed min-h-[400px]">
                      {selectedLog.prompt}
                    </pre>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black">RAW</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-[0.3em]">Node Inference</h4>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-mono text-gray-600">DETERMINISTIC</span>
                    </div>
                  </div>
                  <div className="relative group">
                    <pre className="bg-black/60 p-8 rounded-[32px] border border-white/5 text-xs text-emerald-200 font-mono whitespace-pre-wrap overflow-x-auto shadow-inner leading-relaxed min-h-[400px]">
                      {selectedLog.response}
                    </pre>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black">RAW</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-white/[0.01] border-t border-white/5 flex justify-center gap-8">
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  <AlertCircle size={14} className="text-purple-500" />
                  Contextual logging is transient and may be cleared during swarm re-indexing.
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
