import Terminal from '@/components/Terminal';
import SecurityChart from '@/components/Charts';
import Leaderboard from '@/components/Leaderboard';
import Link from 'next/link';
import { Shield, ShieldAlert, ShieldCheck, Activity, Database, Settings, Terminal as TermIcon, Wrench, BarChart2, Trophy, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000';
  let stats = {
    total_repos_scanned: 0,
    total_vulnerabilities_found: 0,
    vulnerabilities_fixed: 0,
    issues_fixed: 0,
    total_cost_usd: 0
  };
  let models: any[] = [];

  try {
    const [statsRes, modelsRes] = await Promise.all([
      fetch(`${apiUrl}/api/stats`, { cache: 'no-store' }),
      fetch(`${apiUrl}/api/models`, { cache: 'no-store' })
    ]);
    if (statsRes.ok) stats = await statsRes.json();
    if (modelsRes.ok) models = await modelsRes.json();
  } catch (e) {
    console.error("Failed to fetch stats", e);
  }

  return (
    <main className="min-h-screen text-white p-6 md:p-12 font-sans selection:bg-purple-500/30">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Simple, premium header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold tracking-wider uppercase mb-2">
              <Sparkles className="w-3 h-3" /> System Active
            </div>
            <h1 className="text-5xl font-black tracking-tight text-white flex items-center gap-4 drop-shadow-2xl">
              <Shield className="w-12 h-12 text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
              AI Security Swarm
            </h1>
            <p className="text-gray-400 text-lg font-medium tracking-wide">Autonomous Multi-Agent Intelligence</p>
          </div>
          <nav className="space-x-4 mt-8 md:mt-0 flex">
            <Link href="/repositories" className="flex items-center gap-2 text-gray-200 hover:text-white px-6 py-3 rounded-2xl liquid-glass-panel hover:bg-white/5 transition-all">
              <Database className="w-4 h-4" /> Repositories
            </Link>
            <Link href="/admin" className="flex items-center gap-2 text-gray-200 hover:text-white px-6 py-3 rounded-2xl liquid-glass-panel hover:bg-white/5 transition-all">
              <Settings className="w-4 h-4" /> Admin
            </Link>
          </nav>
        </header>

        {/* Stats row with Liquid Glass */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="liquid-glass-panel p-6 group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><Database className="w-20 h-20 text-blue-400" /></div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">Repos Scanned</h3>
            <p className="text-5xl font-black text-white">{stats.total_repos_scanned}</p>
          </div>
          <div className="liquid-glass-panel p-6 group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><ShieldAlert className="w-20 h-20 text-yellow-500" /></div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">Vulns Found</h3>
            <p className="text-5xl font-black text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.3)]">{stats.total_vulnerabilities_found}</p>
          </div>
          <div className="liquid-glass-panel p-6 group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><ShieldCheck className="w-20 h-20 text-emerald-500" /></div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">Vulns Fixed</h3>
            <p className="text-5xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">{stats.vulnerabilities_fixed}</p>
          </div>
          <div className="liquid-glass-panel p-6 group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><Wrench className="w-20 h-20 text-cyan-500" /></div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">Issues Fixed</h3>
            <p className="text-5xl font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">{stats.issues_fixed || 0}</p>
          </div>
          <div className="liquid-glass-panel p-6 group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><Activity className="w-20 h-20 text-purple-400" /></div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">Swarm Cost</h3>
            <p className="text-5xl font-black text-purple-300 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">${stats.total_cost_usd.toFixed(2)}</p>
          </div>
        </div>

        {/* Charts & Graphs block */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">
            <h2 className="text-xl font-bold flex items-center gap-3 text-white/90 ml-2">
              <BarChart2 className="w-5 h-5 text-purple-400" /> Discovery Timeline
            </h2>
            <div className="liquid-glass-panel p-8">
              <SecurityChart />
            </div>
          </div>

          <div className="space-y-5">
            <h2 className="text-xl font-bold flex items-center gap-3 text-white/90 ml-2">
              <Trophy className="w-5 h-5 text-yellow-400" /> Top Secured Repos
            </h2>
            <div className="liquid-glass-panel p-8">
              <Leaderboard />
            </div>
          </div>
        </div>

        {/* Terminal Block */}
        <div className="space-y-5">
          <h2 className="text-xl font-bold flex items-center gap-3 text-white/90 ml-2">
            <TermIcon className="w-5 h-5 text-purple-400" /> Live Agent Uplinks
          </h2>
          <div className="liquid-glass-panel p-2">
             <Terminal />
          </div>
        </div>

        {/* Metrics Table Block */}
        <div className="space-y-5 pb-16">
          <h2 className="text-xl font-bold flex items-center gap-3 text-white/90 ml-2">
            <Activity className="w-5 h-5 text-purple-400" /> Intelligence Metrics
          </h2>
          <div className="liquid-glass-panel overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="p-6 font-semibold text-gray-300 text-sm uppercase tracking-wider">Model Node</th>
                  <th className="p-6 font-semibold text-gray-300 text-sm uppercase tracking-wider">Invocations</th>
                  <th className="p-6 font-semibold text-gray-300 text-sm uppercase tracking-wider">Compute (Tokens)</th>
                  <th className="p-6 font-semibold text-gray-300 text-sm uppercase tracking-wider">Capital Burn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {models.map((m: any) => (
                  <tr key={m.model} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-6 font-mono text-sm text-purple-300 font-medium">{m.model}</td>
                    <td className="p-6 text-gray-400 font-medium">{m.requests}</td>
                    <td className="p-6 text-gray-400 font-mono tracking-wide">{m.tokens.toLocaleString()}</td>
                    <td className="p-6 text-purple-200 font-semibold">${m.cost.toFixed(4)}</td>
                  </tr>
                ))}
                {models.length === 0 && (
                  <tr><td colSpan={4} className="p-12 text-center text-gray-500 italic tracking-widest text-sm">Swarm intelligence has not yet initialized.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}
