import Link from 'next/link';
import { Database, Shield, LayoutGrid } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Repositories() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000';
  let repos = [];

  try {
    const res = await fetch(`${apiUrl}/api/repositories?limit=100`, { cache: 'no-store' });
    if (res.ok) repos = await res.json();
  } catch (e) {
    console.error("Failed to fetch repositories", e);
  }

  return (
    <main className="min-h-screen text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-8 border-b border-purple-900/50">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-500 to-indigo-500 neon-text flex items-center gap-3">
              <Database className="w-10 h-10 text-purple-500" />
              Scanned Repositories
            </h1>
            <p className="text-purple-300 mt-2 font-medium">Database of codebases analyzed by the swarm</p>
          </div>
          <nav className="space-x-4 mt-6 md:mt-0 flex">
            <Link href="/" className="flex items-center gap-2 text-gray-300 hover:text-white px-5 py-2.5 rounded-lg glass-panel hover:bg-purple-900/30 transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              <LayoutGrid className="w-4 h-4" /> Dashboard
            </Link>
          </nav>
        </header>

        <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-purple-950/40 border-b border-purple-900/50">
              <tr>
                <th className="p-5 font-semibold text-purple-200">Repository Target</th>
                <th className="p-5 font-semibold text-purple-200">Star Rating</th>
                <th className="p-5 font-semibold text-purple-200">Integrity Score</th>
                <th className="p-5 font-semibold text-purple-200">Thematic Clusters</th>
                <th className="p-5 font-semibold text-purple-200">Last Encounter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-900/30">
              {repos.map((repo: any) => (
                <tr key={repo.id} className="hover:bg-purple-900/20 transition-colors">
                  <td className="p-5 font-medium">
                    <a href={`https://github.com/${repo.full_name}`} target="_blank" rel="noreferrer" className="text-fuchsia-300 hover:text-fuchsia-100 hover:underline">
                      {repo.full_name}
                    </a>
                  </td>
                  <td className="p-5 text-gray-300 flex items-center gap-2 font-mono">
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    {repo.stars.toLocaleString()}
                  </td>
                  <td className="p-5">
                    {repo.code_quality_percent !== null ? (
                      <div className="flex items-center gap-3">
                        <div className="w-full bg-purple-950/50 rounded-full h-2 max-w-[120px] overflow-hidden border border-purple-900/50">
                          <div className={`h-full rounded-full transition-all duration-1000 ${repo.code_quality_percent > 80 ? 'bg-gradient-to-r from-emerald-500 to-green-400' : repo.code_quality_percent > 50 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' : 'bg-gradient-to-r from-rose-500 to-red-500'}`} style={{ width: `${repo.code_quality_percent}%` }}></div>
                        </div>
                        <span className="text-sm font-bold text-gray-200 drop-shadow-md">{repo.code_quality_percent}%</span>
                      </div>
                    ) : <span className="text-purple-400/50 text-sm italic tracking-wide">PENDING</span>}
                  </td>
                  <td className="p-5">
                    <div className="flex flex-wrap gap-2">
                      {repo.themes && repo.themes.slice(0, 3).map((theme: string) => (
                        <span key={theme} className="px-2.5 py-1 bg-purple-950/50 text-[10px] uppercase font-bold tracking-wider rounded-md text-fuchsia-200 border border-fuchsia-900/30">
                          {theme}
                        </span>
                      ))}
                      {repo.themes && repo.themes.length > 3 && (
                        <span className="px-2.5 py-1 text-purple-400 text-xs font-bold bg-purple-950/20 rounded-md">+{repo.themes.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-5 text-sm text-purple-300/70 font-mono">
                    {repo.last_scanned_at ? new Date(repo.last_scanned_at).toLocaleString() : new Date(repo.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {repos.length === 0 && (
                <tr><td colSpan={5} className="p-12 text-center text-purple-300/50 italic tracking-wide">No targets have been analyzed by the swarm yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
