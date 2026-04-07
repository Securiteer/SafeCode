"use client";
import { useEffect, useState, useRef } from 'react';
import { X, SearchCode } from 'lucide-react';

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
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [loadingContext, setLoadingContext] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace('http', 'ws') + '/ws/terminal'
      : `${protocol}//${window.location.hostname}:8000/ws/terminal`;

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLogs((prev) => [...prev.slice(-100), data]);
      } catch (e) {
        console.error(e);
      }
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const botIds = Array.from(new Set(logs.map(l => l.bot_id))).filter(Boolean);

  const fetchLogContext = async (id: number) => {
    setLoadingContext(true);
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
    setLoadingContext(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[600px] relative">
      {botIds.length === 0 && (
        <div className="col-span-full h-full flex items-center justify-center glass-panel rounded-2xl text-purple-500/50 font-mono border border-purple-900/30">
          WAITING FOR UPLINK...
        </div>
      )}
      {botIds.map(botId => (
        <div key={botId} className="glass-panel rounded-2xl p-4 font-mono text-sm overflow-y-auto flex flex-col border border-purple-900/50 shadow-xl relative">
          <div className="text-green-400 mb-2 font-bold border-b border-purple-900/50 pb-2 flex justify-between tracking-wider">
            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> {botId}</span>
            <span className="text-xs text-purple-400/80">
                LIFECYCLE EVENTS: {logs.filter(l => l.bot_id === botId).length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-2">
            {logs.filter(l => l.bot_id === botId).map((log, i) => (
              <div
                key={i}
                className={`text-gray-300 rounded px-1.5 py-0.5 transition-colors ${log.has_context ? 'hover:bg-purple-900/40 cursor-pointer border border-transparent hover:border-purple-800' : ''}`}
                onClick={() => log.has_context && fetchLogContext(log.id)}
              >
                <span className="text-purple-500/60">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                <span className={`font-bold ${
                  log.action === 'ERROR' || log.action === 'FAILED' ? 'text-red-400' :
                  log.action === 'SUCCESS' ? 'text-emerald-400' :
                  log.action === 'FOUND' ? 'text-amber-400' :
                  log.action === 'PR' ? 'text-blue-400' : 'text-fuchsia-400'
                }`}>[{log.action}]</span>{' '}
                <span className="text-gray-200">{log.details}</span>
                {log.model && <span className="text-indigo-400 ml-2">[{log.model}]</span>}
                {log.cost > 0 && <span className="text-amber-500/80 ml-2">[${log.cost.toFixed(4)}]</span>}
                {log.has_context && <SearchCode className="w-3 h-3 inline-block ml-2 text-purple-500" />}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      ))}

      {/* Log Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-4xl h-[80vh] rounded-2xl border border-purple-800 shadow-[0_0_50px_rgba(168,85,247,0.2)] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-purple-900/50 flex justify-between items-center bg-purple-950/40">
              <h3 className="text-xl font-bold text-purple-100 flex items-center gap-2"><SearchCode /> AI Interaction Context</h3>
              <button onClick={() => setSelectedLog(null)} className="text-purple-400 hover:text-white transition"><X /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 custom-scrollbar">
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-fuchsia-400 uppercase tracking-widest border-b border-fuchsia-900/50 pb-2">Prompt Sent to Swarm Node</h4>
                <pre className="bg-black/50 p-4 rounded-xl border border-purple-900/30 text-xs text-purple-200 font-mono whitespace-pre-wrap overflow-x-auto shadow-inner">{selectedLog.prompt}</pre>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest border-b border-emerald-900/50 pb-2">Node Response</h4>
                <pre className="bg-black/50 p-4 rounded-xl border border-purple-900/30 text-xs text-emerald-200 font-mono whitespace-pre-wrap overflow-x-auto shadow-inner">{selectedLog.response}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
