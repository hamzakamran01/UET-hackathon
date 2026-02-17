'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { DateRangePreset } from '@/types/analytics';
import { motion, AnimatePresence } from 'framer-motion';

interface DateRangePickerProps {
  value: {
    preset?: DateRangePreset;
    startDate?: string;
    endDate?: string;
  };
  onChange: (value: {
    preset?: DateRangePreset;
    startDate?: string;
    endDate?: string;
  }) => void;
}

const presets = [
  { label: 'Today', value: DateRangePreset.TODAY },
  { label: 'Yesterday', value: DateRangePreset.YESTERDAY },
  { label: 'Last 7 Days', value: DateRangePreset.LAST_7_DAYS },
  { label: 'Last 30 Days', value: DateRangePreset.LAST_30_DAYS },
  { label: 'This Week', value: DateRangePreset.THIS_WEEK },
  { label: 'This Month', value: DateRangePreset.THIS_MONTH },
  { label: 'Custom Range', value: DateRangePreset.CUSTOM },
];

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePresetChange = (preset: DateRangePreset) => {
    onChange({ preset, startDate: value.startDate, endDate: value.endDate });
    if (preset !== DateRangePreset.CUSTOM) {
      setIsOpen(false);
    }
  };

  const handleCustomDateChange = (field: 'startDate' | 'endDate', dateValue: string) => {
    onChange({
      preset: DateRangePreset.CUSTOM,
      startDate: field === 'startDate' ? dateValue : value.startDate,
      endDate: field === 'endDate' ? dateValue : value.endDate,
    });
  };

  const currentLabel = presets.find(p => p.value === value.preset)?.label || 'Select Range';

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 transition-all text-sm font-medium min-w-[180px] justify-between"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{currentLabel}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-2 space-y-1">
              {presets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handlePresetChange(preset.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${value.preset === preset.value
                      ? 'bg-blue-600/10 text-blue-400'
                      : 'text-slate-300 hover:bg-slate-800'
                    }`}
                >
                  <span>{preset.label}</span>
                  {value.preset === preset.value && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>

            {value.preset === DateRangePreset.CUSTOM && (
              <div className="p-4 border-t border-slate-800 bg-slate-950/50 space-y-3">
                <div>
                  <label className="block text-xs uppercase text-slate-500 font-semibold mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={value.startDate || ''}
                    onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase text-slate-500 font-semibold mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={value.endDate || ''}
                    onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
