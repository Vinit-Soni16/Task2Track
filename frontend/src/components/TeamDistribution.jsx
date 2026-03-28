'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TeamDistribution({ data }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 animate-fadeIn">
        <h3 className="font-bold text-slate-800 mb-4">Team Task Distribution</h3>
        <p className="text-sm text-slate-400 py-8 text-center">No team data available</p>
      </div>
    );
  }

  if (!mounted) return <div className="h-50 w-full bg-slate-50/50 rounded-xl animate-pulse" />;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 animate-fadeIn">
      <h3 className="font-bold text-slate-800 mb-4">Team Task Distribution</h3>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40)}>
        <BarChart data={data} layout="vertical" barSize={20}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis 
            type="number"
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis 
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#fff'
            }}
          />
          <Bar dataKey="totalTasks" fill="#10b981" radius={[0, 4, 4, 0]} name="Tasks" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
