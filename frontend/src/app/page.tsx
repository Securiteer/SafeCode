import Terminal from '@/components/Terminal';
import SecurityChart from '@/components/Charts';
import Leaderboard from '@/components/Leaderboard';
import Link from 'next/link';
import { Shield, ShieldAlert, ShieldCheck, Activity, Database, Settings, Terminal as TermIcon, Wrench, BarChart2, Trophy } from 'lucide-react';

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
  let models = [];

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
    <main className="min-h-screen text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-8 border-b border-purple-900/50">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-500 to-indigo-500 neon-text flex items-center gap-3">
              <Shield className="w-10 h-10 text-purple-500" />
              AI Security Swarm
            </h1>
            <p className="text-purple-300 mt-2 font-medium">Autonomous Multi-Agent Intelligence</p>
          </div>
          <nav className="space-x-4 mt-6 md:mt-0 flex">
            <Link href="/repositories" className="flex items-center gap-2 text-gray-300 hover:text-white px-5 py-2.5 rounded-lg glass-panel hover:bg-purple-900/30 transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              <Database className="w-4 h-4" /> Repositories
            </Link>
            <Link href="/admin" className="flex items-center gap-2 text-gray-300 hover:text-white px-5 py-2.5 rounded-lg glass-panel hover:bg-purple-900/30 transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              <Settings className="w-4 h-4" /> Admin
            </Link>
          </nav>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-default">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Database className="w-16 h-16 text-blue-400" /></div>
            <h3 className="text-purple-300/80 text-xs font-bold uppercase tracking-widest">Repos Scanned</h3>
            <p className="text-4xl font-black mt-3 text-white">{stats.total_repos_scanned}</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-default">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><ShieldAlert className="w-16 h-16 text-yellow-500" /></div>
            <h3 className="text-purple-300/80 text-xs font-bold uppercase tracking-widest">Vulns Found</h3>
            <p className="text-4xl font-black mt-3 text-yellow-400">{stats.total_vulnerabilities_found}</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-default">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><ShieldCheck className="w-16 h-16 text-green-500" /></div>
            <h3 className="text-purple-300/80 text-xs font-bold uppercase tracking-widest">Vulns Fixed</h3>
            <p className="text-4xl font-black mt-3 text-green-400">{stats.vulnerabilities_fixed}</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-default">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Wrench className="w-16 h-16 text-cyan-500" /></div>
            <h3 className="text-purple-300/80 text-xs font-bold uppercase tracking-widest">Issues Fixed</h3>
            <p className="text-4xl font-black mt-3 text-cyan-400">{stats.issues_fixed || 0}</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-default">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Activity className="w-16 h-16 text-purple-400" /></div>
            <h3 className="text-purple-300/80 text-xs font-bold uppercase tracking-widest">Swarm Cost</h3>
            <p className="text-4xl font-black mt-3 text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">${stats.total_cost_usd.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-purple-100">
              <BarChart2 className="w-6 h-6 text-purple-500" /> Discovery Timeline (7 Days)
            </h2>
            <div className="glass-panel rounded-2xl p-6 shadow-[0_0_30px_rgba(168,85,247,0.1)]">
              <SecurityChart />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-purple-100">
              <Trophy className="w-6 h-6 text-yellow-500" /> Top Secured Repos
            </h2>
            <div className="glass-panel rounded-2xl p-6 shadow-[0_0_30px_rgba(168,85,247,0.1)]">
              <Leaderboard />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-purple-100">
            <TermIcon className="w-6 h-6 text-purple-500" /> Live Agent Uplinks
          </h2>
          <Terminal />
        </div>

        <div className="space-y-4 pb-12">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-purple-100">
            <Activity className="w-6 h-6 text-purple-500" /> Intelligence Metrics
          </h2>
          <div className="glass-panel rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.1)]">
            <table className="w-full text-left">
              <thead className="bg-purple-950/40 border-b border-purple-900/50">
                <tr>
                  <th className="p-5 font-semibold text-purple-200">Model Node</th>
                  <th className="p-5 font-semibold text-purple-200">Invocations</th>
                  <th className="p-5 font-semibold text-purple-200">Compute (Tokens)</th>
                  <th className="p-5 font-semibold text-purple-200">Capital Burn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/30">
                {models.map((m: any) => (
                  <tr key={m.model} className="hover:bg-purple-900/20 transition-colors">
                    <td className="p-5 font-mono text-sm text-fuchsia-300 font-bold">{m.model}</td>
                    <td className="p-5 text-gray-300">{m.requests}</td>
                    <td className="p-5 text-gray-300 font-mono">{m.tokens.toLocaleString()}</td>
                    <td className="p-5 text-purple-300 font-medium">${m.cost.toFixed(4)}</td>
                  </tr>
                ))}
                {models.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-purple-300/50 italic tracking-widest text-sm">Swarm intelligence has not yet initialized.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}
