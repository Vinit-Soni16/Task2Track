'use client';

export default function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-slate-200/50 rounded-xl ${className}`} />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="w-10 h-10 rounded-lg" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-4 px-4"><Skeleton className="h-5 w-5 rounded" /></td>
      <td className="py-4 px-4"><Skeleton className="h-4 w-40" /></td>
      <td className="py-4 px-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
      <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
      <td className="py-4 px-4"><Skeleton className="h-4 w-16" /></td>
    </tr>
  );
}
