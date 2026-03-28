'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function WeeklyProgress({ data }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!data || data.length === 0) return null;
  if (!mounted) return <div className="h-55 w-full bg-slate-50/50 rounded-xl animate-pulse" />;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 animate-fadeIn">
      <h3 className="font-bold text-slate-800 mb-4">Weekly Progress</h3>
      <div className="h-55 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 11, fill: '#94a3b8' }} 
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: 'none', 
                borderRadius: '8px',
                fontSize: '11px',
                color: '#fff',
                padding: '8px 12px'
              }}
              itemStyle={{ color: '#fff' }}
            />
            <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={Math.min(30, 100/data.length)} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
