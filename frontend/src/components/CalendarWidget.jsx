'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';

export default function CalendarWidget({ tasks = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const taskDates = useMemo(() => {
    const map = {};
    tasks.forEach(task => {
      if (task.deadline) {
        const d = new Date(task.deadline);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (!map[key]) map[key] = [];
        map[key].push(task);
      }
    });
    return map;
  }, [tasks]);

  const getTasksForDate = (day) => {
    const key = `${year}-${month}-${day}`;
    return taskDates[key] || [];
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const isToday = (day) => {
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const calendarContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-linear-to-r from-indigo-500 to-indigo-600">
        <button onClick={prevMonth} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <button onClick={goToToday} className="text-sm font-bold text-white hover:text-indigo-100 transition-colors">
          {monthNames[month]} {year}
        </button>
        <div className="flex items-center gap-1">
          <button onClick={nextMonth} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
          {/* Close button on mobile */}
          <button onClick={() => setIsOpen(false)} className="sm:hidden p-1.5 hover:bg-white/20 rounded-lg transition-colors ml-1">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 px-3 pt-3">
        {dayNames.map(day => (
          <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
        {calendarDays.map((day, index) => {
          if (day === null) return <div key={`empty-${index}`} className="h-9" />;

          const dayTasks = getTasksForDate(day);
          const hasPending = dayTasks.some(t => t.status === 'pending');
          const hasInProgress = dayTasks.some(t => t.status === 'in-progress');
          const hasCompleted = dayTasks.some(t => t.status === 'completed');
          const hasOverdue = dayTasks.some(t =>
            t.status !== 'completed' && t.deadline && new Date(t.deadline) < today
          );

          return (
            <div
              key={day}
              className={`h-9 flex flex-col items-center justify-center rounded-lg relative cursor-default transition-all ${
                isToday(day)
                  ? 'bg-indigo-500 text-white font-bold shadow-md shadow-indigo-200'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="text-xs">{day}</span>
              {dayTasks.length > 0 && (
                <div className="flex items-center gap-0.5 absolute bottom-0.5">
                  {hasOverdue && <div className="w-1 h-1 rounded-full bg-red-500" />}
                  {hasPending && !hasOverdue && <div className="w-1 h-1 rounded-full bg-amber-500" />}
                  {hasInProgress && <div className="w-1 h-1 rounded-full bg-blue-500" />}
                  {hasCompleted && <div className="w-1 h-1 rounded-full bg-emerald-500" />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-[9px] text-slate-500 font-medium">Overdue</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-[9px] text-slate-500 font-medium">Pending</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-[9px] text-slate-500 font-medium">In Progress</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[9px] text-slate-500 font-medium">Done</span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
      >
        <Calendar className="w-4 h-4 text-indigo-500" />
        <span className="hidden sm:inline">
          {today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <span className="sm:hidden">
          {today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </button>

      {/* ===== MOBILE: Full-screen bottom sheet ===== */}
      {isOpen && (
        <div className="sm:hidden fixed inset-0 z-70">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl animate-slideUp overflow-hidden">
            {calendarContent}
            {/* Safe area padding for phones with notch */}
            <div className="h-2" />
          </div>
        </div>
      )}

      {/* ===== DESKTOP: Dropdown ===== */}
      {isOpen && (
        <div className="hidden sm:block">
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-12 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 w-[320px] animate-fadeIn overflow-hidden">
            {calendarContent}
          </div>
        </div>
      )}
    </div>
  );
}
