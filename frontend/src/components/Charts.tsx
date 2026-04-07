"use client";
import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SecurityChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    fetch(`${apiUrl}/api/charts`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (data.length === 0) return <div className="h-64 flex items-center justify-center text-purple-500/50 font-mono text-sm">Gathering timeline data...</div>;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#4c1d95" opacity={0.3} vertical={false} />
          <XAxis dataKey="date" stroke="#9333ea" tick={{fill: '#c084fc', fontSize: 12}} tickLine={false} axisLine={false} />
          <YAxis stroke="#9333ea" tick={{fill: '#c084fc', fontSize: 12}} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(10, 5, 20, 0.9)', borderColor: 'rgba(139, 92, 246, 0.3)', borderRadius: '8px', color: '#fff' }}
            itemStyle={{ color: '#e879f9' }}
          />
          <Area type="monotone" dataKey="count" name="Issues Found" stroke="#d946ef" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
