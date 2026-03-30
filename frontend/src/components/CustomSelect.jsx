'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

const CustomSelect = memo(({ 
  value, 
  onChange, 
  options, 
  placeholder = 'Select option', 
  label, 
  icon: Icon,
  className = '',
  error = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null); // Ref for the portal-rendered menu
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutsideButton = dropdownRef.current && !dropdownRef.current.contains(event.target);
      const clickedOutsideMenu = menuRef.current && !menuRef.current.contains(event.target);
      
      if (clickedOutsideButton && clickedOutsideMenu) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      
      // Calculate position and handle flipping
      if (dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const menuHeight = 280; // Estimated max height of the menu
        const shouldFlip = spaceBelow < menuHeight && rect.top > menuHeight;
        
        setCoords({
          top: shouldFlip ? rect.top - 8 : rect.bottom + 8,
          left: rect.left,
          width: rect.width,
          transform: shouldFlip ? 'translateY(-100%)' : 'translateY(0)'
        });
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => 
    typeof opt === 'string' ? opt === value : opt.value === value
  );

  const displayValue = selectedOption 
    ? (typeof selectedOption === 'string' ? selectedOption : selectedOption.label)
    : placeholder;

  const handleSelect = (e, opt) => {
    e.preventDefault();
    e.stopPropagation();
    const newVal = typeof opt === 'string' ? opt : opt.value;
    onChange(newVal);
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2 transition-colors duration-200">
          {label}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between px-4 py-3 
          bg-white border text-sm rounded-xl transition-all duration-300
          ${isOpen ? 'border-indigo-500 ring-4 ring-indigo-50 shadow-sm' : 'border-slate-200 hover:border-slate-300'}
          ${error ? 'border-red-500 ring-red-50' : ''}
          ${!value ? 'text-slate-400' : 'text-slate-800'}
        `}
      >
        <div className="flex items-center gap-3 truncate">
          {Icon && <Icon className={`w-5 h-5 ${isOpen ? 'text-indigo-500' : 'text-slate-400'} transition-colors`} />}
          <span className="truncate font-medium">{displayValue}</span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} 
        />
      </button>

      {/* Dropdown Menu using Portal with Smart Positioning */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          ref={menuRef}
          className="fixed z-[9999] bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-slideUpMenu backdrop-blur-xl bg-white/95"
          style={{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            transform: coords.transform
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="max-h-64 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {options.map((opt, idx) => {
              const optVal = typeof opt === 'string' ? opt : opt.value;
              const optLabel = typeof opt === 'string' ? opt : opt.label;
              const isSelected = optVal === value;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => handleSelect(e, opt)}
                  className={`
                    w-full flex items-center justify-between px-4 py-2.5 text-sm 
                    transition-all duration-200 group
                    ${isSelected ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-600 hover:bg-slate-50'}
                  `}
                >
                  <span className="truncate">{optLabel}</span>
                  {isSelected && <Check className="w-4 h-4 text-indigo-600 animate-fadeIn" />}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}

      {error && <p className="mt-1.5 text-xs text-red-500 animate-fadeIn">{error}</p>}
    </div>
  );
});

CustomSelect.displayName = 'CustomSelect';

export default CustomSelect;
