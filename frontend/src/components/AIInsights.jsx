'use client';

import { TrendingUp, TrendingDown, AlertTriangle, Info, CheckCircle } from 'lucide-react';

export default function AIInsights({ insights, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 animate-fadeIn">
        <h3 className="font-bold text-slate-800 mb-4">AI Insights </h3>
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-slate-400">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">Generating Insights...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!insights || insights.length === 0) return null;

  const typeConfig = {
    success: { icon: CheckCircle, bg: 'bg-emerald-50', border: 'border-emerald-200', iconColor: 'text-emerald-500', titleColor: 'text-emerald-700' },
    warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', iconColor: 'text-amber-500', titleColor: 'text-amber-700' },
    danger: { icon: TrendingDown, bg: 'bg-red-50', border: 'border-red-200', iconColor: 'text-red-500', titleColor: 'text-red-700' },
    info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', iconColor: 'text-blue-500', titleColor: 'text-blue-700' },
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 animate-fadeIn">
      <h3 className="font-bold text-slate-800 mb-4">AI Insights</h3>
      <div className="space-y-3">
        {insights.map((insight, i) => {
          const config = typeConfig[insight.type] || typeConfig.info;
          const Icon = config.icon;

          return (
            <div
              key={i}
              className={`${config.bg} border ${config.border} rounded-xl p-4 flex items-start gap-3 animate-fadeIn`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${config.iconColor}`} />
              <div>
                <p className={`text-sm font-semibold ${config.titleColor}`}>{insight.title}</p>
                <p className="text-xs text-slate-600 mt-0.5">{insight.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
