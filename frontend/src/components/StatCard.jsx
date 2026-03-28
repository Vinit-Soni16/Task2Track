'use client';

export default function StatCard({ label, value, icon: Icon, color = 'slate' }) {
  const colorMap = {
    slate: 'bg-slate-100 text-slate-600',
    green: 'bg-emerald-50 text-emerald-500',
    blue: 'bg-blue-50 text-blue-500',
    red: 'bg-red-50 text-red-500',
    amber: 'bg-amber-50 text-amber-500',
    indigo: 'bg-indigo-50 text-indigo-500',
  };

  const valueColorMap = {
    slate: 'text-slate-800',
    green: 'text-emerald-600',
    blue: 'text-blue-600',
    red: 'text-red-500',
    amber: 'text-amber-600',
    indigo: 'text-indigo-600',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 card-hover animate-fadeIn">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
          <p className={`text-3xl font-bold ${valueColorMap[color] || 'text-slate-800'}`}>{value}</p>
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color] || colorMap.slate}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
