'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function PriorityDonut({ pending = 0, inProgress = 0, completed = 0 }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const data = [
    { name: 'Pending', value: pending, color: '#ef4444' },
    { name: 'In Progress', value: inProgress, color: '#3b82f6' },
    { name: 'Completed', value: completed, color: '#10b981' },
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    data.push({ name: 'No tasks', value: 1, color: '#e2e8f0' });
  }

  if (!mounted) return <div className="h-50 w-full bg-slate-50/50 rounded-xl animate-pulse" />;

  const renderLegend = () => (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-2">
      {[
        { label: 'Pending', color: '#ef4444' },
        { label: 'In Progress', color: '#3b82f6' },
        { label: 'Completed', color: '#10b981' },
      ].map(item => (
        <div key={item.label} className="flex items-center gap-1.5 min-w-fit">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-[11px] font-medium text-slate-500">{item.label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 animate-fadeIn">
      <h3 className="font-bold text-slate-800 mb-2">Task Ratio</h3>
      <div className="h-50 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
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
          </PieChart>
        </ResponsiveContainer>
      </div>
      {renderLegend()}
    </div>
  );
}
