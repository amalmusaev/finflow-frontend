import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';

export type DatePresetKey =
  | 'this_month'
  | 'prev_month'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'this_year'
  | 'all_time'
  | 'custom';

export interface DateRange {
  startDate: string; // YYYY-MM-DD or ''
  endDate: string;   // YYYY-MM-DD or ''
  preset: DatePresetKey;
  label: string;
}

interface DateRangePickerProps {
  range: DateRange;
  onChange: (newRange: DateRange) => void;
  className?: string;
}

export function computePresetRange(preset: DatePresetKey): { startDate: string; endDate: string; label: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  const pad = (n: number) => String(n).padStart(2, '0');
  const formatYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  switch (preset) {
    case 'this_month': {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      return {
        startDate: formatYMD(firstDay),
        endDate: formatYMD(lastDay),
        label: 'Этот месяц',
      };
    }
    case 'prev_month': {
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      return {
        startDate: formatYMD(firstDay),
        endDate: formatYMD(lastDay),
        label: 'Прошлый месяц',
      };
    }
    case 'last_7_days': {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      return {
        startDate: formatYMD(start),
        endDate: formatYMD(now),
        label: 'Последние 7 дней',
      };
    }
    case 'last_30_days': {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      return {
        startDate: formatYMD(start),
        endDate: formatYMD(now),
        label: 'Последние 30 дней',
      };
    }
    case 'last_90_days': {
      const start = new Date(now);
      start.setDate(start.getDate() - 89);
      return {
        startDate: formatYMD(start),
        endDate: formatYMD(now),
        label: 'Последние 90 дней',
      };
    }
    case 'this_year': {
      const firstDay = new Date(year, 0, 1);
      const lastDay = new Date(year, 11, 31);
      return {
        startDate: formatYMD(firstDay),
        endDate: formatYMD(lastDay),
        label: 'Этот год',
      };
    }
    case 'all_time':
    default:
      return {
        startDate: '',
        endDate: '',
        label: 'За всё время',
      };
  }
}

const PRESET_OPTIONS: { key: DatePresetKey; label: string }[] = [
  { key: 'this_month', label: 'Этот месяц' },
  { key: 'prev_month', label: 'Прошлый месяц' },
  { key: 'last_30_days', label: '30 дней' },
  { key: 'last_90_days', label: '90 дней' },
  { key: 'this_year', label: 'Этот год' },
  { key: 'all_time', label: 'Все время' },
  { key: 'custom', label: 'Свой период' },
];

export function DateRangePicker({ range, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(range.startDate);
  const [customEnd, setCustomEnd] = useState(range.endDate);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomStart(range.startDate);
    setCustomEnd(range.endDate);
  }, [range]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectPreset = (key: DatePresetKey) => {
    if (key === 'custom') {
      onChange({
        startDate: customStart,
        endDate: customEnd,
        preset: 'custom',
        label: 'Свой период',
      });
      return;
    }

    const { startDate, endDate, label } = computePresetRange(key);
    onChange({
      startDate,
      endDate,
      preset: key,
      label,
    });
    setIsOpen(false);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    let label = 'Свой период';
    if (customStart && customEnd) {
      label = `${customStart} — ${customEnd}`;
    } else if (customStart) {
      label = `С ${customStart}`;
    } else if (customEnd) {
      label = `До ${customEnd}`;
    } else {
      label = 'За всё время';
    }

    onChange({
      startDate: customStart,
      endDate: customEnd,
      preset: 'custom',
      label,
    });
    setIsOpen(false);
  };

  const formatDisplayRange = () => {
    if (range.preset !== 'custom') {
      return range.label;
    }
    if (!range.startDate && !range.endDate) return 'За всё время';
    if (range.startDate && range.endDate) {
      return `${range.startDate} — ${range.endDate}`;
    }
    if (range.startDate) return `С ${range.startDate}`;
    return `До ${range.endDate}`;
  };

  return (
    <div className={cn("relative inline-block text-left", className)} ref={popoverRef}>
      {/* Quick Pills for desktop */}
      <div className="flex items-center gap-1.5 bg-mono-100 p-1 rounded-none border border-mono-200 shadow-xs h-9">
        <div className="hidden md:flex items-center gap-1">
          {PRESET_OPTIONS.map((item) => {
            const isActive = range.preset === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  if (item.key === 'custom') {
                    setIsOpen((prev) => !prev);
                  } else {
                    handleSelectPreset(item.key);
                  }
                }}
                className={cn(
                  "px-3 py-1.5 rounded-none text-xs font-medium transition-all select-none whitespace-nowrap flex items-center gap-1.5",
                  isActive
                    ? "bg-mono-900 text-mono-50 shadow-xs"
                    : "text-mono-600 hover:text-mono-900 hover:bg-mono-200/60"
                )}
              >
                {item.key === 'custom' && <Calendar className="w-3.5 h-3.5" />}
                <span>{item.key === 'custom' && range.preset === 'custom' ? formatDisplayRange() : item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile / Compact Dropdown Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex md:hidden items-center gap-2 px-3 py-1.5 rounded-none text-xs font-medium text-mono-900 bg-mono-200/60 hover:bg-mono-200 transition-colors"
        >
          <Calendar className="w-3.5 h-3.5 text-mono-500" />
          <span>{formatDisplayRange()}</span>
          <ChevronDown className={cn("w-3.5 h-3.5 text-mono-400 transition-transform", isOpen && "rotate-180")} />
        </button>
      </div>

      {/* Popover Menu / Custom Range Form */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-mono-50 border border-mono-200 rounded-none shadow-xl z-50 p-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-mono-200">
            <span className="text-xs font-semibold text-mono-900">Выбор периода</span>
            <span className="text-[11px] font-mono text-mono-500">{range.label}</span>
          </div>

          {/* Quick presets inside popover */}
          <div className="grid grid-cols-2 gap-1.5 mb-4">
            {PRESET_OPTIONS.filter((p) => p.key !== 'custom').map((p) => {
              const isSelected = range.preset === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handleSelectPreset(p.key)}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-1.5 rounded-none text-xs transition-colors text-left",
                    isSelected
                      ? "bg-mono-900 text-mono-50 font-medium"
                      : "text-mono-700 hover:bg-mono-200"
                  )}
                >
                  <span>{p.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>

          {/* Custom Date Inputs */}
          <form onSubmit={handleApplyCustom} className="space-y-3 pt-2 border-t border-mono-200">
            <div className="text-[11px] font-medium text-mono-500 uppercase tracking-wider">
              Точный интервал
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-mono text-mono-400 mb-1">Дата начала</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full text-xs font-mono bg-mono-50 border border-mono-300 rounded-none px-2 py-1.5 text-mono-900 focus:outline-none focus:border-mono-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-mono-400 mb-1">Дата конца</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full text-xs font-mono bg-mono-50 border border-mono-300 rounded-none px-2 py-1.5 text-mono-900 focus:outline-none focus:border-mono-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCustomStart('');
                  setCustomEnd('');
                  handleSelectPreset('all_time');
                }}
                className="flex items-center gap-1 text-[11px] text-mono-500 hover:text-mono-800 transition-colors p-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Сбросить</span>
              </button>

              <button
                type="submit"
                className="px-3.5 py-1.5 bg-mono-900 hover:bg-mono-800 text-mono-50 text-xs font-medium rounded-none shadow-xs transition-colors"
              >
                Применить
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
