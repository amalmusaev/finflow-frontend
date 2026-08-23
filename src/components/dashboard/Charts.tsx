import { useState, useMemo } from 'react';
import { formatCurrency } from '../../lib/utils';
import { cn } from '../../lib/utils';

export interface TimelineDataPoint {
  dateKey: string;      // e.g. "2026-08-01" or "01.08"
  displayDate: string;  // e.g. "1 авг"
  income: number;
  expense: number;
  net: number;
}

export interface CategoryBreakdownItem {
  id: string;
  name: string;
  amount: number;
  percent: number;
  color: string;
  count: number;
}

const PALETTE = [
  '#18181b', // mono-900
  '#52525b', // mono-600
  '#71717a', // mono-500
  '#a1a1aa', // mono-400
  '#e11d48', // rose-600
  '#059669', // emerald-600
  '#d97706', // amber-600
  '#4f46e5', // indigo-600
  '#0891b2', // cyan-600
  '#9333ea', // purple-600
  '#ea580c', // orange-600
  '#2563eb', // blue-600
];

export function getCategoryColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}

// -------------------------------------------------------------
// 1. Timeline Bar Chart (Доходы vs Расходы по времени)
// -------------------------------------------------------------
interface BarTimelineChartProps {
  data: TimelineDataPoint[];
  height?: number;
}

export function BarTimelineChart({ data, height = 260 }: BarTimelineChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxVal = useMemo(() => {
    if (data.length === 0) return 10000;
    const max = Math.max(...data.map((d) => Math.max(d.income, d.expense)));
    return max > 0 ? max * 1.15 : 10000;
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-mono-400 font-mono text-xs">
        <span>Нет операций за выбранный период</span>
      </div>
    );
  }

  const svgWidth = 800;
  const svgHeight = height;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const barGroupWidth = chartWidth / data.length;
  const barSpacing = Math.max(2, Math.min(6, barGroupWidth * 0.04));
  const maxDayBarWidth = Math.min(36, Math.max(12, barGroupWidth - 8));
  const singleBarWidth = Math.max(4, (maxDayBarWidth - barSpacing) / 2);
  const totalDayBarWidth = singleBarWidth * 2 + barSpacing;

  // Y-axis grid levels (4 steps)
  const gridSteps = 4;
  const yTicks = Array.from({ length: gridSteps + 1 }, (_, i) => (maxVal / gridSteps) * (gridSteps - i));

  return (
    <div className="w-full relative select-none">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto overflow-visible"
        style={{ minHeight: `${height}px` }}
      >
        <defs>
          
          
        </defs>

        {/* Y Grid lines and labels */}
        {yTicks.map((val, i) => {
          const y = paddingTop + (i / gridSteps) * chartHeight;
          return (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={svgWidth - paddingRight}
                y2={y}
                stroke="currentColor"
                className="text-mono-200"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 8}
                y={y + 3.5}
                textAnchor="end"
                className="fill-mono-400 font-mono text-[10px]"
              >
                {val >= 1000 ? `${Math.round(val / 1000)}k` : Math.round(val)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, index) => {
          const groupX = paddingLeft + index * barGroupWidth;
          const centerX = groupX + barGroupWidth / 2;

          const incomeHeight = (item.income / maxVal) * chartHeight;
          const expenseHeight = (item.expense / maxVal) * chartHeight;

          const incomeY = paddingTop + chartHeight - incomeHeight;
          const expenseY = paddingTop + chartHeight - expenseHeight;

          const hasIncome = item.income > 0;
          const hasExpense = item.expense > 0;

          let incomeW = singleBarWidth;
          let incomeX = centerX - singleBarWidth - barSpacing / 2;

          let expenseW = singleBarWidth;
          let expenseX = centerX + barSpacing / 2;

          if (hasIncome && !hasExpense) {
            incomeW = totalDayBarWidth;
            incomeX = centerX - totalDayBarWidth / 2;
          } else if (hasExpense && !hasIncome) {
            expenseW = totalDayBarWidth;
            expenseX = centerX - totalDayBarWidth / 2;
          }

          const isHovered = hoveredIdx === index;

          return (
            <g
              key={index}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(index)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Invisible full-day hit area */}
              <rect
                x={groupX}
                y={paddingTop}
                width={barGroupWidth}
                height={chartHeight + paddingBottom}
                fill="transparent"
              />

              {/* Hover highlight (заливка) completely filling the space allocated for the day */}
              {isHovered && (
                <rect
                  x={groupX}
                  y={paddingTop}
                  width={barGroupWidth}
                  height={chartHeight}
                  fill="currentColor"
                  className="text-mono-200/60"
                  rx="4"
                />
              )}

              {/* Income Bar */}
              {hasIncome && (
                <rect
                  x={incomeX}
                  y={incomeY}
                  width={incomeW}
                  height={Math.max(2, incomeHeight)}
                  rx="3"
                  fill="#10b981"
                  className="transition-all duration-150 pointer-events-none"
                  opacity={hoveredIdx === null || isHovered ? 1 : 0.4}
                />
              )}

              {/* Expense Bar */}
              {hasExpense && (
                <rect
                  x={expenseX}
                  y={expenseY}
                  width={expenseW}
                  height={Math.max(2, expenseHeight)}
                  rx="3"
                  fill="#f43f5e"
                  className="transition-all duration-150 pointer-events-none"
                  opacity={hoveredIdx === null || isHovered ? 1 : 0.4}
                />
              )}

              {/* X Axis Label */}
              {(data.length <= 15 || index % Math.ceil(data.length / 10) === 0) && (
                <text
                  x={centerX}
                  y={svgHeight - 10}
                  textAnchor="middle"
                  className={cn(
                    "text-[10px] font-mono transition-colors pointer-events-none",
                    isHovered ? "fill-mono-900 font-bold" : "fill-mono-400"
                  )}
                >
                  {item.displayDate}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div
          className="absolute z-20 pointer-events-none bg-mono-900 text-mono-50 rounded-none p-3 shadow-xl border border-mono-700 text-xs font-sans transition-all duration-75"
          style={{
            left: `${Math.min(
              82,
              Math.max(12, ((paddingLeft + (hoveredIdx + 0.5) * barGroupWidth) / svgWidth) * 100)
            )}%`,
            top: '0px',
            transform: 'translateX(-50%) translateY(-20%)',
          }}
        >
          <div className="font-semibold text-[11px] text-mono-300 font-mono mb-1.5 border-b border-mono-700 pb-1">
            {data[hoveredIdx].dateKey} ({data[hoveredIdx].displayDate})
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-none bg-emerald-400 inline-block" />
                Доходы:
              </span>
              <span className="font-medium">{formatCurrency(data[hoveredIdx].income)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2 h-2 rounded-none bg-rose-400 inline-block" />
                Расходы:
              </span>
              <span className="font-medium">{formatCurrency(data[hoveredIdx].expense)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-mono-700/60 font-semibold">
              <span className="text-mono-300">Сальдо:</span>
              <span
                className={
                  data[hoveredIdx].net >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }
              >
                {data[hoveredIdx].net > 0 ? '+' : ''}
                {formatCurrency(data[hoveredIdx].net)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-none bg-emerald-500" />
          <span className="text-mono-600">Доходы</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-none bg-rose-500" />
          <span className="text-mono-600">Расходы</span>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 2. Interactive Donut Chart (Структура по категориям)
// -------------------------------------------------------------
interface DonutChartProps {
  items: CategoryBreakdownItem[];
  totalAmount: number;
  title?: string;
  size?: number;
}

export function DonutChart({ items, totalAmount, title = 'Всего расходов', size = 170 }: DonutChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const radius = size / 2;
  const strokeWidth = 24;
  const innerRadius = radius - strokeWidth;
  const center = radius;

  // Calculate SVG arc paths
  const slices = useMemo(() => {
    if (items.length === 0 || totalAmount <= 0) return [];

    let currentAngle = -Math.PI / 2; // Start from top 12 o'clock

    return items.map((item) => {
      const sliceAngle = (item.amount / totalAmount) * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;

      const x1 = center + innerRadius * Math.cos(startAngle);
      const y1 = center + innerRadius * Math.sin(startAngle);
      const x2 = center + radius * Math.cos(startAngle);
      const y2 = center + radius * Math.sin(startAngle);

      const x3 = center + radius * Math.cos(endAngle);
      const y3 = center + radius * Math.sin(endAngle);
      const x4 = center + innerRadius * Math.cos(endAngle);
      const y4 = center + innerRadius * Math.sin(endAngle);

      const largeArc = sliceAngle > Math.PI ? 1 : 0;

      // SVG path for donut segment
      const pathData = [
        `M ${x1} ${y1}`,
        `L ${x2} ${y2}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x3} ${y3}`,
        `L ${x4} ${y4}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1} ${y1}`,
        'Z',
      ].join(' ');

      return {
        ...item,
        pathData,
      };
    });
  }, [items, totalAmount, radius, innerRadius, center]);

  const activeItem = items.find((i) => i.id === hoveredId) || null;

  if (items.length === 0 || totalAmount === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-mono-400 font-mono text-xs">
        <span>Нет данных для отображения</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full">
      {/* SVG Donut */}
      <div className="relative select-none flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          {slices.map((slice) => {
            const isHovered = hoveredId === slice.id;
            return (
              <path
                key={slice.id}
                d={slice.pathData}
                fill={slice.color}
                className="transition-all duration-150 cursor-pointer"
                opacity={hoveredId === null || isHovered ? 1 : 0.45}
                style={{
                  transformOrigin: `${center}px ${center}px`,
                  transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                }}
                onMouseEnter={() => setHoveredId(slice.id)}
                onMouseLeave={() => setHoveredId(null)}
              />
            );
          })}
        </svg>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-3">
          <span className="text-[10px] uppercase font-mono tracking-wider text-mono-400 truncate max-w-[110px]">
            {activeItem ? activeItem.name : title}
          </span>
          <span className="text-xs font-bold font-mono text-mono-900 mt-0.5 whitespace-nowrap">
            {formatCurrency(activeItem ? activeItem.amount : totalAmount)}
          </span>
          {activeItem && (
            <span className="text-[10px] font-mono text-mono-500 font-medium">
              {activeItem.percent.toFixed(1)}% ({activeItem.count} оп.)
            </span>
          )}
        </div>
      </div>

      {/* Categories Breakdown List */}
      <div className="space-y-1.5 w-full">
        {items.slice(0, 5).map((item) => {
          const isHovered = hoveredId === item.id;
          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={cn(
                "flex items-center justify-between p-1.5 px-2 rounded-none transition-all cursor-pointer",
                isHovered ? "bg-mono-200" : "hover:bg-mono-200/50"
              )}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className="w-2.5 h-2.5 rounded-none flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-mono-800 font-medium truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-2.5 flex-shrink-0 font-mono text-xs whitespace-nowrap pl-2">
                <span className="text-mono-400 text-[11px]">{item.percent.toFixed(1)}%</span>
                <span className="font-semibold text-mono-900">{formatCurrency(item.amount)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 3. Cumulative Area Trend Chart (Тренд чистого баланса / накопительный)
// -------------------------------------------------------------
interface AreaTrendChartProps {
  data: TimelineDataPoint[];
  height?: number;
}

export function AreaTrendChart({ data, height = 220 }: AreaTrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const cumulativeData = useMemo(() => {
    let runningTotal = 0;
    return data.map((d) => {
      runningTotal += d.net;
      return {
        ...d,
        cumulative: runningTotal,
      };
    });
  }, [data]);

  if (cumulativeData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-mono-400 font-mono text-xs">
        <span>Нет данных</span>
      </div>
    );
  }

  const values = cumulativeData.map((d) => d.cumulative);
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(1000, ...values) * 1.1;
  const valRange = maxVal - minVal || 1;

  const svgWidth = 800;
  const svgHeight = height;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const getX = (i: number) => paddingLeft + (i / (cumulativeData.length - 1 || 1)) * chartWidth;
  const getY = (val: number) => paddingTop + chartHeight - ((val - minVal) / valRange) * chartHeight;

  // Build SVG path
  const points = cumulativeData.map((d, i) => `${getX(i)},${getY(d.cumulative)}`).join(' ');
  const areaPath = `${points} L ${getX(cumulativeData.length - 1)},${paddingTop + chartHeight} L ${getX(0)},${paddingTop + chartHeight} Z`;

  return (
    <div className="w-full relative select-none">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto overflow-visible"
        style={{ minHeight: `${height}px` }}
      >
        <defs>
          
        </defs>

        {/* Zero baseline */}
        {minVal < 0 && (
          <line
            x1={paddingLeft}
            y1={getY(0)}
            x2={svgWidth - paddingRight}
            y2={getY(0)}
            stroke="currentColor"
            className="text-mono-300"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />
        )}

        {/* Area fill */}
        <polygon points={areaPath} fill="url(#areaTrendGrad)" />

        {/* Line */}
        <polyline
          fill="none"
          stroke="currentColor"
          className="text-mono-900"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {/* Interactive Points */}
        {cumulativeData.map((d, i) => {
          const cx = getX(i);
          const cy = getY(d.cumulative);
          const isHovered = hoveredIdx === i;

          return (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 6 : 3.5}
                className={cn(
                  "transition-all duration-150",
                  isHovered
                    ? "fill-mono-900 stroke-mono-50 stroke-2"
                    : "fill-mono-600 hover:fill-mono-900"
                )}
              />

              {/* X label */}
              {(cumulativeData.length <= 15 || i % Math.ceil(cumulativeData.length / 8) === 0) && (
                <text
                  x={cx}
                  y={svgHeight - 8}
                  textAnchor="middle"
                  className="fill-mono-400 font-mono text-[10px]"
                >
                  {d.displayDate}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating tooltip */}
      {hoveredIdx !== null && cumulativeData[hoveredIdx] && (
        <div
          className="absolute z-20 pointer-events-none bg-mono-900 text-mono-50 rounded-none p-2.5 shadow-xl border border-mono-700 text-xs font-mono"
          style={{
            left: `${Math.min(
              85,
              Math.max(10, (getX(hoveredIdx) / svgWidth) * 100)
            )}%`,
            top: '0px',
            transform: 'translateX(-50%) translateY(-20%)',
          }}
        >
          <div className="text-[10px] text-mono-400 mb-1 border-b border-mono-700 pb-0.5">
            {cumulativeData[hoveredIdx].dateKey} ({cumulativeData[hoveredIdx].displayDate})
          </div>
          <div className="text-emerald-400 font-bold">
            {formatCurrency(cumulativeData[hoveredIdx].cumulative)}
          </div>
          <div className="text-[10px] text-mono-300 mt-0.5">
            Накопленный результат периода
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 4. Ranked Category Progress Bars
// -------------------------------------------------------------
interface CategoryProgressBarListProps {
  items: CategoryBreakdownItem[];
  totalAmount: number;
}

export function CategoryProgressBarList({ items, totalAmount }: CategoryProgressBarListProps) {
  if (items.length === 0 || totalAmount === 0) {
    return (
      <div className="text-center py-6 text-mono-400 font-mono text-xs">
        Нет данных
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {items.slice(0, 5).map((item, idx) => {
        const percent = totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0;
        return (
          <div key={item.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[11px] font-mono text-mono-400 w-4">#{idx + 1}</span>
                <span
                  className="w-2.5 h-2.5 rounded-none flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-mono-900 truncate">{item.name}</span>
                <span className="text-mono-400 font-mono text-[10px]">
                  ({item.count} оп.)
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono flex-shrink-0">
                <span className="text-mono-500 text-[11px]">{percent.toFixed(1)}%</span>
                <span className="font-semibold text-mono-900">{formatCurrency(item.amount)}</span>
              </div>
            </div>

            {/* Progress Track */}
            <div className="w-full h-2 bg-mono-200 rounded-none overflow-hidden">
              <div
                className="h-full rounded-none transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(2, percent))}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
