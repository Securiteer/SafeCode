"use client";
import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';

export default function Leaderboard() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    fetch(`${apiUrl}/api/leaderboard`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-4">
      {data.map((repo: any, i: number) => (
        <div key={repo.repo} className="flex items-center justify-between p-4 bg-purple-950/20 rounded-xl border border-purple-900/30 hover:bg-purple-900/40 transition">
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${i === 0 ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' : i === 1 ? 'bg-gray-300 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-purple-900 text-purple-300'}`}>
              {i === 0 ? <Trophy className="w-4 h-4" /> : i + 1}
            </div>
            <div>
              <div className="font-bold text-fuchsia-200">{repo.repo}</div>
              <div className="text-xs text-purple-400">Quality: {repo.quality}%</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-black text-2xl text-emerald-400">{repo.fixes}</div>
            <div className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold">Fixes</div>
          </div>
        </div>
      ))}
      {data.length === 0 && <div className="text-center p-8 text-purple-500/50 italic text-sm">No patches generated yet.</div>}
    </div>
  );
}
