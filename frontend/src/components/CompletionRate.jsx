'use client';

export default function CompletionRate({ rate = 0 }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 animate-fadeIn">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-800">Completion Rate</h3>
        <span className="text-3xl font-bold text-slate-800">{rate}%</span>
      </div>
      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-slate-800 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${rate}%` }}
        />
      </div>
    </div>
  );
}
