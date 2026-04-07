"use client";

import { useEffect, useState } from 'react';
import Terminal from '@/components/Terminal';
import SecurityChart from '@/components/Charts';
import Leaderboard from '@/components/Leaderboard';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Database, 
  Settings, 
  Terminal as TermIcon, 
  Wrench, 
  BarChart2, 
  Trophy, 
  Sparkles,
  ArrowRight,
  Cpu,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelStat {
  model: string;
  requests: number;
  tokens: number;
  cost: number;
}

export default function Home() {
  const [stats, setStats] = useState({
    total_repos_scanned: 0,
    total_vulnerabilities_found: 0,
    vulnerabilities_fixed: 0,
    issues_fixed: 0,
    total_cost_usd: 0
  });
  const [models, setModels] = useState<ModelStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      try {
        const [statsRes, modelsRes] = await Promise.all([
          fetch(`${apiUrl}/api/stats`),
          fetch(`${apiUrl}/api/models`)
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (modelsRes.ok) setModels(await modelsRes.json());
      } catch (e) {
        console.error("Failed to fetch data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const statCards = [
    { label: "Repos Scanned", value: stats.total_repos_scanned, icon: Database, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Vulns Found", value: stats.total_vulnerabilities_found, icon: ShieldAlert, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: "Vulns Fixed", value: stats.vulnerabilities_fixed, icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Issues Fixed", value: stats.issues_fixed || 0, icon: Wrench, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { label: "Swarm Cost", value: `$${stats.total_cost_usd.toFixed(2)}`, icon: Activity, color: "text-purple-400", bg: "bg-purple-500/10" },
  ];

  return (
    <main className="min-h-screen text-white p-6 md:p-12 font-sans selection:bg-purple-500/30 overflow-hidden">
      <motion.div 
        className="max-w-7xl mx-auto space-y-16"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Advanced Hero Header */}
        <motion.header 
          variants={itemVariants}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-end pb-8 border-b border-white/5 relative"
        >
          <div className="space-y-4 relative z-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold tracking-widest uppercase mb-2"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> 
              Neural Network Online
            </motion.div>
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-white flex items-center gap-6">
              <div className="relative">
                <Shield className="w-16 h-16 text-purple-500 drop-shadow-[0_0_25px_rgba(168,85,247,0.6)]" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-2 border-2 border-dashed border-purple-500/20 rounded-full"
                />
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                SafeCode
              </span>
            </h1>
            <p className="text-gray-400 text-xl font-medium tracking-tight max-w-2xl">
              Autonomous multi-agent intelligence swarm for continuous repository security orchestration and remediation.
            </p>
          </div>
          
          <nav className="flex gap-4 mt-10 lg:mt-0">
            <Link href="/repositories" className="group flex items-center gap-3 bg-white/5 hover:bg-white/10 px-8 py-4 rounded-2xl border border-white/10 transition-all duration-300">
              <Database className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              <span className="font-bold tracking-wide">Infrastructure</span>
              <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Link>
            <Link href="/admin" className="group flex items-center gap-3 bg-purple-600 hover:bg-purple-500 px-8 py-4 rounded-2xl border border-purple-400/30 transition-all duration-300 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
              <Settings className="w-5 h-5" />
              <span className="font-bold tracking-wide">Command Center</span>
            </Link>
          </nav>
        </motion.header>

        {/* Dynamic Stats Visualization */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6"
        >
          {statCards.map((stat, idx) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -5, scale: 1.02 }}
              className="liquid-glass-panel p-8 group relative overflow-hidden"
            >
              <div className={cn("absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity", stat.color)}>
                <stat.icon size={120} />
              </div>
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-6", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">{stat.label}</h3>
              <p className={cn("text-4xl font-black tracking-tight", idx === 4 ? "text-purple-300" : "text-white")}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Intelligence Operations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Chart */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-8 space-y-6"
          >
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight">
                <BarChart2 className="w-6 h-6 text-purple-500" /> 
                Threat Discovery Vector
              </h2>
              <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Real-time</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-700"></span> Predicted</span>
              </div>
            </div>
            <div className="liquid-glass-panel p-10 bg-gradient-to-br from-purple-900/10 to-transparent">
              <SecurityChart />
            </div>
          </motion.div>

          {/* Leaderboard */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-4 space-y-6"
          >
            <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight px-2">
              <Trophy className="w-6 h-6 text-yellow-500" /> 
              Elite Nodes
            </h2>
            <div className="liquid-glass-panel p-8 h-full">
              <Leaderboard />
            </div>
          </motion.div>
        </div>

        {/* Real-time Uplink Section */}
        <motion.div 
          variants={itemVariants}
          className="space-y-6"
        >
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight">
              <TermIcon className="w-6 h-6 text-purple-500" /> 
              Active Intelligence Uplinks
            </h2>
            <div className="px-4 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Stream
            </div>
          </div>
          <div className="liquid-glass-panel p-2 bg-black/40">
             <Terminal />
          </div>
        </motion.div>

        {/* Model Metrics Section */}
        <motion.div 
          variants={itemVariants}
          className="space-y-6 pb-24"
        >
          <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight px-2">
            <Cpu className="w-6 h-6 text-purple-500" /> 
            Compute Distribution Matrix
          </h2>
          <div className="liquid-glass-panel overflow-hidden border border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/10">
                    <th className="p-8 font-black text-gray-400 text-[10px] uppercase tracking-[0.25em]">Node Identity</th>
                    <th className="p-8 font-black text-gray-400 text-[10px] uppercase tracking-[0.25em]">Invocations</th>
                    <th className="p-8 font-black text-gray-400 text-[10px] uppercase tracking-[0.25em]">Compute Load</th>
                    <th className="p-8 font-black text-gray-400 text-[10px] uppercase tracking-[0.25em]">Resource Burn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence>
                    {models.map((m: ModelStat, idx: number) => (
                      <motion.tr 
                        key={m.model}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group hover:bg-white/[0.03] transition-all duration-300"
                      >
                        <td className="p-8">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                              <Layers className="w-5 h-5 text-purple-400" />
                            </div>
                            <span className="font-mono text-sm text-purple-200 group-hover:text-purple-100 transition-colors">{m.model}</span>
                          </div>
                        </td>
                        <td className="p-8 text-gray-300 font-bold">{m.requests.toLocaleString()}</td>
                        <td className="p-8">
                          <div className="space-y-2">
                            <div className="text-sm font-mono text-gray-400">{m.tokens.toLocaleString()} <span className="text-[10px] opacity-50">TOKENS</span></div>
                            <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (m.tokens / 1000000) * 100)}%` }}
                                className="h-full bg-purple-500"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-8">
                          <span className="text-xl font-black text-emerald-400">${m.cost.toFixed(4)}</span>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {models.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="p-20 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-20">
                          <Cpu size={48} />
                          <p className="font-black uppercase tracking-[0.4em] text-sm text-gray-400">Swarm initialization pending</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}
