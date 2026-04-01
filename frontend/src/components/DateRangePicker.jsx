'use client';

import { useState, useMemo, useCallback } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isWithinInterval, 
  isAfter, 
  isBefore,
  startOfToday,
  subDays,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear
} from 'date-fns';
import { ChevronLeft, ChevronRight, ArrowRight, X } from 'lucide-react';
import './DateRangePicker.css';

const PRESETS = [
  { id: 'today', label: 'Today', getValue: () => ({ start: startOfToday(), end: startOfToday() }) },
  { id: 'yesterday', label: 'Yesterday', getValue: () => ({ start: subDays(startOfToday(), 1), end: subDays(startOfToday(), 1) }) },
  { id: 'last7', label: 'Last 7 days', getValue: () => ({ start: subDays(startOfToday(), 6), end: startOfToday() }) },
  { id: 'last30', label: 'Last 30 days', getValue: () => ({ start: subDays(startOfToday(), 29), end: startOfToday() }) },
  { id: 'thisMonth', label: 'This Month', getValue: () => ({ start: startOfMonth(startOfToday()), end: endOfMonth(startOfToday()) }) },
  { id: 'lastMonth', label: 'Last Month', getValue: () => {
    const prev = subMonths(startOfToday(), 1);
    return { start: startOfMonth(prev), end: endOfMonth(prev) };
  }},
  { id: 'thisQuarter', label: 'This Quarter', getValue: () => ({ start: startOfQuarter(startOfToday()), end: endOfQuarter(startOfToday()) }) },
  { id: 'thisYear', label: 'This Year', getValue: () => ({ start: startOfYear(startOfToday()), end: endOfYear(startOfToday()) }) },
];

export default function DateRangePicker({ initialRange = { start: null, end: null }, onApply, onCancel }) {
  const [range, setRange] = useState(initialRange);
  const [hoverDate, setHoverDate] = useState(null);
  const [baseMonth, setBaseMonth] = useState(startOfMonth(initialRange.start || new Date()));
  const nextMonth = addMonths(baseMonth, 1);

  const handleDateClick = (date) => {
    if (!range.start || (range.start && range.end)) {
      setRange({ start: date, end: null });
    } else {
      if (isBefore(date, range.start)) {
        setRange({ start: date, end: range.start });
      } else {
        setRange({ start: range.start, end: date });
      }
    }
  };

  const handlePresetClick = (preset) => {
    const val = preset.getValue();
    setRange(val);
    setBaseMonth(startOfMonth(val.start));
  };

  const isInRange = (date) => {
    if (range.start && range.end) {
      return isWithinInterval(date, { start: range.start, end: range.end });
    }
    if (range.start && hoverDate) {
      const start = isBefore(hoverDate, range.start) ? hoverDate : range.start;
      const end = isBefore(hoverDate, range.start) ? range.start : hoverDate;
      return isWithinInterval(date, { start, end });
    }
    return false;
  };

  const renderMonth = (monthDate, showPrev = false, showNext = false) => {
    const days = eachDayOfInterval({
      start: startOfMonth(monthDate),
      end: endOfMonth(monthDate)
    });
    const startDay = startOfMonth(monthDate).getDay();
    const emptyDays = Array.from({ length: startDay });

    return (
      <div className="month-view">
        <div className="month-header">
          {showPrev ? (
            <button className="nav-btn" onClick={() => setBaseMonth(subMonths(baseMonth, 1))}>
              <ChevronLeft size={18} />
            </button>
          ) : <div className="w-8" />}
          <span className="month-title">{format(monthDate, 'MMMM yyyy')}</span>
          {showNext ? (
            <button className="nav-btn" onClick={() => setBaseMonth(addMonths(baseMonth, 1))}>
              <ChevronRight size={18} />
            </button>
          ) : <div className="w-8" />}
        </div>
        
        <div className="calendar-grid">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} className="day-name">{d}</div>
          ))}
          {emptyDays.map((_, i) => <div key={`e-${i}`} className="day-cell empty" />)}
          {days.map(date => {
            const selected = (range.start && isSameDay(date, range.start)) || (range.end && isSameDay(date, range.end));
            const active = isInRange(date);
            const today = isSameDay(date, new Date());

            return (
              <div 
                key={date.toString()}
                className={`day-cell ${selected ? 'selected' : ''} ${active ? 'in-range' : ''} ${today ? 'today-marker' : ''}`}
                onClick={() => handleDateClick(date)}
                onMouseEnter={() => setHoverDate(date)}
                onMouseLeave={() => setHoverDate(null)}
              >
                {format(date, 'd')}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="date-range-picker-overlay animate-fadeIn" onClick={onCancel}>
      <div className="date-range-picker-container" onClick={(e) => e.stopPropagation()}>
        <div className="picker-mobile-header sm:hidden">
          <span className="font-bold text-slate-800">Select Dates</span>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="picker-sidebar">
          <div className="sidebar-scrollable">
            {PRESETS.map(p => (
              <button 
                key={p.id} 
                className={`preset-btn ${range.start && range.end && isSameDay(range.start, p.getValue().start) && isSameDay(range.end, p.getValue().end) ? 'active' : ''}`}
                onClick={() => handlePresetClick(p)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="picker-main">
          <div className="picker-header-inputs">
            <div className="date-input-field">
              {range.start ? format(range.start, 'MMM d, yyyy') : 'Start Date'}
            </div>
            <ArrowRight size={16} className="arrow-separator" />
            <div className="date-input-field">
              {range.end ? format(range.end, 'MMM d, yyyy') : 'End Date'}
            </div>
          </div>

          <div className="calendars-wrapper">
            {renderMonth(baseMonth, true, false)}
            <div className="hidden sm:block">
              {renderMonth(nextMonth, false, true)}
            </div>
          </div>

          <div className="picker-footer">
            <button className="footer-btn btn-cancel" onClick={onCancel}>Cancel</button>
            <button 
              className="footer-btn btn-apply" 
              onClick={() => onApply(range)}
              disabled={!range.start || !range.end}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
