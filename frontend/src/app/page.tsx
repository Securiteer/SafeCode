"use client";

import { useEffect, useState } from "react";
import Terminal from "@/components/Terminal";
import SecurityChart from "@/components/Charts";
import Leaderboard from "@/components/Leaderboard";
import { motion } from "framer-motion";
import {
  Database,
  ShieldAlert,
  ShieldCheck,
  Wrench,
  Activity,
  BarChart3,
  Trophy,
  Terminal as TermIcon,
  Cpu,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModelStat {
  model: string;
  requests: number;
  tokens: number;
  cost: number;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function Home() {
  const [stats, setStats] = useState({
    total_repos_scanned: 0,
    total_vulnerabilities_found: 0,
    vulnerabilities_fixed: 0,
    issues_fixed: 0,
    total_cost_usd: 0,
  });
  const [models, setModels] = useState<ModelStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      try {
        const [statsRes, modelsRes] = await Promise.all([
          fetch(`${apiUrl}/api/stats`),
          fetch(`${apiUrl}/api/models`),
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

  const statCards = [
    { label: "Repos Scanned", value: stats.total_repos_scanned, icon: Database, color: "text-blue-400", accent: "bg-blue-500/10" },
    { label: "Vulns Found", value: stats.total_vulnerabilities_found, icon: ShieldAlert, color: "text-amber-400", accent: "bg-amber-500/10" },
    { label: "Vulns Fixed", value: stats.vulnerabilities_fixed, icon: ShieldCheck, color: "text-emerald-400", accent: "bg-emerald-500/10" },
    { label: "Issues Fixed", value: stats.issues_fixed || 0, icon: Wrench, color: "text-cyan-400", accent: "bg-cyan-500/10" },
    { label: "Total Cost", value: `$${stats.total_cost_usd.toFixed(2)}`, icon: Activity, color: "text-violet-400", accent: "bg-violet-500/10" },
  ];

  return (
    <div className="p-8 lg:p-10 max-w-[1400px] mx-auto">
      <motion.div
        className="space-y-8"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* ── Page Header ── */}
        <motion.div variants={item} className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-zinc-500">
            Monitor your security swarm in real-time.
          </p>
        </motion.div>

        {/* ── Stats Row ── */}
        <motion.div
          variants={item}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
        >
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="surface-card p-5 space-y-4 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                  {stat.label}
                </span>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", stat.accent)}>
                  <stat.icon className={cn("w-4 h-4", stat.color)} />
                </div>
              </div>
              <p className="text-3xl font-bold tracking-tight font-[family-name:var(--font-mono)]">
                {stat.value}
              </p>
            </div>
          ))}
        </motion.div>

        {/* ── Chart + Leaderboard ── */}
        <motion.div
          variants={item}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Chart */}
          <div className="lg:col-span-8 surface-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-violet-500" />
                Vulnerability Trends
              </h2>
              <span className="text-[11px] text-zinc-600 font-medium">Last 7 days</span>
            </div>
            <SecurityChart />
          </div>

          {/* Leaderboard */}
          <div className="lg:col-span-4 surface-card p-6 space-y-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Top Secured Repos
            </h2>
            <Leaderboard />
          </div>
        </motion.div>

        {/* ── Live Terminal ── */}
        <motion.div variants={item} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <TermIcon className="w-4 h-4 text-violet-500" />
              Live Terminal
            </h2>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                Streaming
              </span>
            </div>
          </div>
          <div className="surface-card p-2 bg-black/30">
            <Terminal />
          </div>
        </motion.div>

        {/* ── Model Usage Table ── */}
        <motion.div variants={item} className="space-y-4 pb-16">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Cpu className="w-4 h-4 text-violet-500" />
            Model Usage
          </h2>
          <div className="surface-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-6 py-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-6 py-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Requests
                    </th>
                    <th className="px-6 py-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Tokens
                    </th>
                    <th className="px-6 py-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {models.map((m) => (
                    <tr
                      key={m.model}
                      className="hover:bg-white/[0.02] transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-md bg-violet-500/10 flex items-center justify-center">
                            <Layers className="w-3.5 h-3.5 text-violet-400" />
                          </div>
                          <span className="text-sm font-medium font-[family-name:var(--font-mono)] text-zinc-300">
                            {m.model}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400 font-medium">
                        {m.requests.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <span className="text-sm text-zinc-400 font-[family-name:var(--font-mono)]">
                            {m.tokens.toLocaleString()}
                          </span>
                          <div className="w-24 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-violet-500/60 rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, (m.tokens / 1000000) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-emerald-400 font-[family-name:var(--font-mono)]">
                          ${m.cost.toFixed(4)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {models.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-zinc-600">
                          <Cpu className="w-8 h-8" />
                          <p className="text-sm font-medium">No model data yet</p>
                          <p className="text-xs text-zinc-700">Start the swarm to see usage metrics.</p>
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
    </div>
  );
}
