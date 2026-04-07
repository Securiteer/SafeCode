"use client";

import { useEffect, useState } from 'react';
import { Trophy, Award, Medal, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  repo: string;
  quality: number;
  fixes: number;
}

export default function Leaderboard() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    fetch(`${apiUrl}/api/leaderboard`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {data.map((repo: LeaderboardEntry, i: number) => (
          <motion.div 
            key={repo.repo}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02, x: -5 }}
            className="flex items-center justify-between p-5 bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl border border-white/5 hover:border-white/10 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-black text-xs shadow-lg transition-transform group-hover:rotate-12",
                  i === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-600 text-black shadow-yellow-500/20' : 
                  i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black shadow-gray-400/20' : 
                  i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-900 text-white shadow-amber-700/20' : 
                  'bg-white/5 text-purple-400 border border-white/10'
                )}>
                  {i === 0 ? <Trophy className="w-5 h-5" /> : 
                   i === 1 ? <Medal className="w-5 h-5" /> :
                   i === 2 ? <Award className="w-5 h-5" /> : 
                   i + 1}
                </div>
                {i < 3 && (
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-black"
                  />
                )}
              </div>
              <div className="space-y-0.5">
                <div className="font-black text-sm text-white group-hover:text-purple-400 transition-colors tracking-tight">{repo.repo}</div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${repo.quality}%` }} />
                  </div>
                  <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest">{repo.quality}%</span>
                </div>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="flex items-center gap-1.5 font-black text-2xl text-white tracking-tighter">
                <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                {repo.fixes}
              </div>
              <div className="text-[8px] uppercase tracking-[0.2em] text-gray-500 font-black">Remediations</div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {data.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center p-12 space-y-4 opacity-20">
          <Trophy size={40} />
          <p className="text-xs font-black uppercase tracking-[0.3em]">No data streams found</p>
        </div>
      )}
    </div>
  );
}
