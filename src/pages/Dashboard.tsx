import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ChevronDown,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { api } from '../api';
import type { Operation, Account, Category } from '../api/types';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import {
  DateRangePicker,
  computePresetRange,
  type DateRange,
} from '../components/dashboard/DateRangePicker';
import {
  BarTimelineChart,
  DonutChart,
  AreaTrendChart,
  CategoryProgressBarList,
  getCategoryColor,
  type TimelineDataPoint,
  type CategoryBreakdownItem,
} from '../components/dashboard/Charts';

export function Dashboard() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const initial = computePresetRange('this_month');
    return {
      startDate: initial.startDate,
      endDate: initial.endDate,
      preset: 'this_month',
      label: initial.label,
    };
  });

  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [structureTab, setStructureTab] = useState<'expense' | 'income'>('expense');

  // Load Data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [opsRes, accsRes, catsRes] = await Promise.all([
        api.operations.getOperations(),
        api.accounts.getAccounts(),
        api.categories.getCategories(),
      ]);

      setOperations(opsRes.operations || []);
      setAccounts(accsRes.accounts || []);
      setCategories(catsRes.categories || []);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки данных аналитики');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Account and Category maps
  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Filtered operations for current period
  const filteredOperations = useMemo(() => {
    return operations.filter((op) => {
      const matchAccount = selectedAccountId === 'all' || op.account_id === selectedAccountId;
      const matchStart = !dateRange.startDate || op.date >= dateRange.startDate;
      const matchEnd = !dateRange.endDate || op.date <= dateRange.endDate;
      return matchAccount && matchStart && matchEnd;
    });
  }, [operations, selectedAccountId, dateRange]);

  // Previous period comparison calculation
  const previousPeriodMetrics = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) {
      return { prevIncome: 0, prevExpense: 0, hasComparison: false };
    }

    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - diffDays + 1);

    const pad = (n: number) => String(n).padStart(2, '0');
    const formatYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const prevStartStr = formatYMD(prevStart);
    const prevEndStr = formatYMD(prevEnd);

    const prevOps = operations.filter((op) => {
      const matchAccount = selectedAccountId === 'all' || op.account_id === selectedAccountId;
      return matchAccount && op.date >= prevStartStr && op.date <= prevEndStr;
    });

    let prevIncome = 0;
    let prevExpense = 0;

    prevOps.forEach((op) => {
      const amt = Math.abs(parseFloat(op.amount) || 0);
      if (op.type === 'income') prevIncome += amt;
      else prevExpense += amt;
    });

    return { prevIncome, prevExpense, hasComparison: true };
  }, [operations, selectedAccountId, dateRange]);

  // Key KPI totals
  const { totalIncome, totalExpense, netFlow, savingsRate, maxExpenseOp, avgDailyExpense } = useMemo<{
    totalIncome: number;
    totalExpense: number;
    netFlow: number;
    savingsRate: number;
    maxExpenseOp: Operation | null;
    avgDailyExpense: number;
  }>(() => {
    let income = 0;
    let expense = 0;
    let maxExpense = 0;
    let maxOp: Operation | null = null;

    filteredOperations.forEach((op) => {
      const amt = Math.abs(parseFloat(op.amount) || 0);
      if (op.type === 'income') {
        income += amt;
      } else {
        expense += amt;
        if (amt > maxExpense) {
          maxExpense = amt;
          maxOp = op;
        }
      }
    });

    const net = income - expense;
    const rate = income > 0 ? Math.max(0, (net / income) * 100) : 0;

    // Calculate active days in period
    let daysCount = 1;
    if (dateRange.startDate && dateRange.endDate) {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      daysCount = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    } else {
      const dates = filteredOperations.map((o) => o.date);
      if (dates.length > 0) {
        const minD = new Date(Math.min(...dates.map((d) => new Date(d).getTime())));
        const maxD = new Date(Math.max(...dates.map((d) => new Date(d).getTime())));
        daysCount = Math.max(1, Math.ceil((maxD.getTime() - minD.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      }
    }

    const avgDaily = expense / daysCount;

    return {
      totalIncome: income,
      totalExpense: expense,
      netFlow: net,
      savingsRate: rate,
      maxExpenseOp: maxOp,
      avgDailyExpense: avgDaily,
    };
  }, [filteredOperations, dateRange]);

  // Percentage dynamic helpers
  const incomeGrowth = useMemo(() => {
    if (!previousPeriodMetrics.hasComparison || previousPeriodMetrics.prevIncome === 0) return null;
    return ((totalIncome - previousPeriodMetrics.prevIncome) / previousPeriodMetrics.prevIncome) * 100;
  }, [totalIncome, previousPeriodMetrics]);

  const expenseGrowth = useMemo(() => {
    if (!previousPeriodMetrics.hasComparison || previousPeriodMetrics.prevExpense === 0) return null;
    return ((totalExpense - previousPeriodMetrics.prevExpense) / previousPeriodMetrics.prevExpense) * 100;
  }, [totalExpense, previousPeriodMetrics]);

  // Grouped Timeline Data
  const timelineData: TimelineDataPoint[] = useMemo(() => {
    if (filteredOperations.length === 0) return [];

    // Map by date key
    const dateMap = new Map<string, { income: number; expense: number }>();
    const sortedOps = [...filteredOperations].sort((a, b) => a.date.localeCompare(b.date));

    sortedOps.forEach((op) => {
      const amt = Math.abs(parseFloat(op.amount) || 0);
      const current = dateMap.get(op.date) || { income: 0, expense: 0 };
      if (op.type === 'income') {
        current.income += amt;
      } else {
        current.expense += amt;
      }
      dateMap.set(op.date, current);
    });

    const result: TimelineDataPoint[] = [];
    const keys = Array.from(dateMap.keys()).sort();

    keys.forEach((k) => {
      const val = dateMap.get(k)!;
      const d = new Date(k);
      const displayDate = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
      result.push({
        dateKey: k,
        displayDate,
        income: val.income,
        expense: val.expense,
        net: val.income - val.expense,
      });
    });

    return result;
  }, [filteredOperations]);

  // Expense Categories Breakdown
  const expenseCategories: CategoryBreakdownItem[] = useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>();

    filteredOperations
      .filter((op) => op.type === 'expense')
      .forEach((op) => {
        const catId = op.category_id || 'uncategorized';
        const amt = Math.abs(parseFloat(op.amount) || 0);
        const cur = map.get(catId) || { amount: 0, count: 0 };
        cur.amount += amt;
        cur.count += 1;
        map.set(catId, cur);
      });

    const items: CategoryBreakdownItem[] = [];
    let idx = 0;

    map.forEach((val, catId) => {
      const cat = categoryMap.get(catId);
      const name = cat ? cat.name : 'Без категории';
      const percent = totalExpense > 0 ? (val.amount / totalExpense) * 100 : 0;
      items.push({
        id: catId,
        name,
        amount: val.amount,
        percent,
        color: getCategoryColor(idx),
        count: val.count,
      });
      idx++;
    });

    return items.sort((a, b) => b.amount - a.amount);
  }, [filteredOperations, totalExpense, categoryMap]);

  // Income Categories Breakdown
  const incomeCategories: CategoryBreakdownItem[] = useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>();

    filteredOperations
      .filter((op) => op.type === 'income')
      .forEach((op) => {
        const catId = op.category_id || 'uncategorized';
        const amt = Math.abs(parseFloat(op.amount) || 0);
        const cur = map.get(catId) || { amount: 0, count: 0 };
        cur.amount += amt;
        cur.count += 1;
        map.set(catId, cur);
      });

    const items: CategoryBreakdownItem[] = [];
    let idx = 5;

    map.forEach((val, catId) => {
      const cat = categoryMap.get(catId);
      const name = cat ? cat.name : 'Без категории';
      const percent = totalIncome > 0 ? (val.amount / totalIncome) * 100 : 0;
      items.push({
        id: catId,
        name,
        amount: val.amount,
        percent,
        color: getCategoryColor(idx),
        count: val.count,
      });
      idx++;
    });

    return items.sort((a, b) => b.amount - a.amount);
  }, [filteredOperations, totalIncome, categoryMap]);

  // Total Assets across accounts
  const totalBalanceRUB = useMemo(() => {
    return accounts.reduce((acc, a) => {
      const bal = parseFloat(a.balance) || 0;
      return acc + (a.currency === 'RUB' ? bal : 0);
    }, 0);
  }, [accounts]);

  if (isLoading && operations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-mono-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-mono-900" />
        <span className="font-mono text-xs">Загрузка аналитических данных...</span>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-mono-900 tracking-tight">
            Дашборд
          </h1>
        </div>

        {/* Global Filters: Accounts & Date Range */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Account Filter */}
          <div className="flex items-center gap-2 bg-mono-100 px-3.5 py-1.5 rounded-none border border-mono-200 shadow-xs h-9">
            <span className="text-xs font-mono text-mono-400 hidden sm:inline">Счет:</span>
            <div className="relative flex items-center">
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="appearance-none bg-transparent text-xs font-medium text-mono-900 pr-5 py-0.5 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-mono-100 text-mono-900">
                  Все счета ({accounts.length})
                </option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-mono-100 text-mono-900">
                    {acc.name} ({formatCurrency(acc.balance, acc.currency)})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-mono-500 pointer-events-none" />
            </div>
          </div>

          {/* Date Range Picker with Presets & Custom Dates */}
          <DateRangePicker range={dateRange} onChange={setDateRange} />

          <button
            onClick={loadData}
            className="p-2 rounded-none border border-mono-200 bg-mono-100 hover:bg-mono-200 text-mono-600 hover:text-mono-900 transition-colors shadow-xs"
            title="Обновить данные"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Alert if any */}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-none text-rose-600 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-mono-50 border border-mono-200 rounded-none p-5 shadow-xs flex flex-col justify-between transition-all hover:border-mono-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-mono-500">Доходы за период</span>
            <div className="w-8 h-8 rounded-none bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono text-mono-900 tracking-tight whitespace-nowrap">
              {formatCurrency(totalIncome)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-mono">
              {incomeGrowth !== null ? (
                <span
                  className={cn(
                    "flex items-center font-medium",
                    incomeGrowth >= 0 ? "text-emerald-600" : "text-rose-600"
                  )}
                >
                  {incomeGrowth >= 0 ? '+' : ''}
                  {incomeGrowth.toFixed(1)}%
                </span>
              ) : (
                <span className="text-mono-400">—</span>
              )}
              <span className="text-mono-400">к прошл. периоду</span>
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-mono-50 border border-mono-200 rounded-none p-5 shadow-xs flex flex-col justify-between transition-all hover:border-mono-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-mono-500">Расходы за период</span>
            <div className="w-8 h-8 rounded-none bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono text-mono-900 tracking-tight whitespace-nowrap">
              {formatCurrency(totalExpense)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-mono">
              {expenseGrowth !== null ? (
                <span
                  className={cn(
                    "flex items-center font-medium",
                    expenseGrowth <= 0 ? "text-emerald-600" : "text-rose-600"
                  )}
                >
                  {expenseGrowth > 0 ? '+' : ''}
                  {expenseGrowth.toFixed(1)}%
                </span>
              ) : (
                <span className="text-mono-400">—</span>
              )}
              <span className="text-mono-400">к прошл. периоду</span>
            </div>
          </div>
        </div>

        {/* Net Flow (Сальдо) */}
        <div className="bg-mono-50 border border-mono-200 rounded-none p-5 shadow-xs flex flex-col justify-between transition-all hover:border-mono-300">
          <div>
            <span className="text-xs font-medium text-mono-500">Чистый денежный поток</span>
          </div>
          <div className="mt-4">
            <div
              className={cn(
                "text-2xl font-bold font-mono tracking-tight whitespace-nowrap",
                netFlow >= 0 ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {netFlow > 0 ? '+' : ''}
              {formatCurrency(netFlow)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-mono text-mono-500">
              <span>Норма сбережений:</span>
              <span className="font-semibold text-mono-900">{savingsRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Secondary KPI / Avg Check & Large Expense */}
        <div className="bg-mono-50 border border-mono-200 rounded-none p-5 shadow-xs flex flex-col justify-between transition-all hover:border-mono-300">
          <div>
            <span className="text-xs font-medium text-mono-500">Средний расход в день</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono text-mono-900 tracking-tight whitespace-nowrap">
              {formatCurrency(avgDailyExpense)}
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] font-mono text-mono-400 gap-1">
              <span className="truncate">Макс. трата:</span>
              <span className="font-medium text-mono-700 whitespace-nowrap">
                {maxExpenseOp ? formatCurrency(maxExpenseOp.amount) : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Bar Chart (Col span 2) */}
        <div className="lg:col-span-2 bg-mono-50 border border-mono-200 rounded-none p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-mono-900 tracking-tight">
                Динамика доходов и расходов
              </h2>
              <p className="text-xs text-mono-500 mt-0.5">
                Поступления и списания по датам за период «{dateRange.label}»
              </p>
            </div>
            <span className="text-xs font-mono text-mono-500 bg-mono-200/60 px-2.5 py-1 rounded-none">
              {filteredOperations.length} опер.
            </span>
          </div>

          <BarTimelineChart data={timelineData} height={270} />
        </div>

        {/* Structure Donut Chart with Expenses / Income switcher (Col span 1) */}
        <div className="bg-mono-50 border border-mono-200 rounded-none p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-mono-900 tracking-tight">
                {structureTab === 'expense' ? 'Структура расходов' : 'Структура доходов'}
              </h2>
              <p className="text-xs text-mono-500 mt-0.5">
                Распределение по категориям
              </p>
            </div>

            {/* Switcher Tab */}
            <div className="flex items-center bg-mono-200/70 p-0.5 rounded-none text-xs font-medium">
              <button
                type="button"
                onClick={() => setStructureTab('expense')}
                className={cn(
                  "px-2.5 py-1 rounded-none text-[11px] transition-all",
                  structureTab === 'expense'
                    ? "bg-mono-900 text-mono-50 shadow-xs"
                    : "text-mono-600 hover:text-mono-900"
                )}
              >
                Расходы
              </button>
              <button
                type="button"
                onClick={() => setStructureTab('income')}
                className={cn(
                  "px-2.5 py-1 rounded-none text-[11px] transition-all",
                  structureTab === 'income'
                    ? "bg-mono-900 text-mono-50 shadow-xs"
                    : "text-mono-600 hover:text-mono-900"
                )}
              >
                Доходы
              </button>
            </div>
          </div>

          <DonutChart
            items={structureTab === 'expense' ? expenseCategories : incomeCategories}
            totalAmount={structureTab === 'expense' ? totalExpense : totalIncome}
            title={structureTab === 'expense' ? 'Расходы' : 'Доходы'}
            size={160}
          />
        </div>
      </div>

      {/* Second Row of Charts & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cumulative Area Trend */}
        <div className="lg:col-span-2 bg-mono-50 border border-mono-200 rounded-none p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-mono-900 tracking-tight">
                Накопительный денежный поток
              </h2>
              <p className="text-xs text-mono-500 mt-0.5">
                Динамика изменения чистых сбережений (доходы минус расходы)
              </p>
            </div>
          </div>

          <AreaTrendChart data={timelineData} height={230} />
        </div>

        {/* Top Spending Categories Progress Bars */}
        <div className="bg-mono-50 border border-mono-200 rounded-none p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-mono-900 tracking-tight">
                Топ категорий трат
              </h2>
              <span className="text-[11px] font-mono text-mono-400">Рейтинг</span>
            </div>

            <CategoryProgressBarList items={expenseCategories} totalAmount={totalExpense} />
          </div>

          {incomeCategories.length > 0 && (
            <div className="mt-6 pt-4 border-t border-mono-200">
              <div className="text-xs font-semibold text-mono-900 mb-2">Источники доходов:</div>
              <div className="space-y-1.5">
                {incomeCategories.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs font-mono gap-2">
                    <span className="text-mono-600 truncate min-w-0 flex-1">{item.name}</span>
                    <span className="text-emerald-600 font-medium whitespace-nowrap flex-shrink-0">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Accounts Breakdown & Recent Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts Balance Overview */}
        <div className="bg-mono-50 border border-mono-200 rounded-none p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-mono-900 tracking-tight">
                Остатки на счетах
              </h2>
              <p className="text-xs text-mono-500 mt-0.5">
                Всего в RUB: <span className="font-mono font-semibold text-mono-900">{formatCurrency(totalBalanceRUB)}</span>
              </p>
            </div>
            <Link
              to="/accounts"
              className="text-xs font-medium text-mono-600 hover:text-mono-900 flex items-center gap-1 transition-colors"
            >
              Все счета <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5 mt-4">
            {accounts.map((acc) => {
              const isSelected = selectedAccountId === acc.id;

              return (
                <div
                  key={acc.id}
                  onClick={() => setSelectedAccountId(isSelected ? 'all' : acc.id)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-none border transition-all cursor-pointer",
                    isSelected
                      ? "bg-mono-200/80 border-mono-400 shadow-xs"
                      : "bg-mono-50 border-mono-200 hover:bg-mono-200/40"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-mono-900 truncate">{acc.name}</div>
                    <div className="text-[10px] font-mono text-mono-400 capitalize">{acc.type}</div>
                  </div>
                  <div className="text-right flex-shrink-0 pl-2">
                    <div className="text-xs font-bold font-mono text-mono-900 whitespace-nowrap">
                      {formatCurrency(acc.balance, acc.currency)}
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-mono text-mono-500 block">Фильтр активен</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Latest Operations Table of Period */}
        <div className="lg:col-span-2 bg-mono-50 border border-mono-200 rounded-none p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-mono-900 tracking-tight">
                  Операции выбранного периода
                </h2>
                <p className="text-xs text-mono-500 mt-0.5">
                  Показаны последние записи периода ({filteredOperations.length})
                </p>
              </div>
              <Link
                to="/"
                className="text-xs font-medium text-mono-600 hover:text-mono-900 flex items-center gap-1 transition-colors"
              >
                Все операции <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {filteredOperations.length === 0 ? (
              <div className="py-12 text-center text-mono-400 font-mono text-xs">
                Нет операций за период «{dateRange.label}»
              </div>
            ) : (
              <div className="divide-y divide-mono-200 overflow-hidden">
                {filteredOperations.slice(0, 6).map((op) => {
                  const cat = categoryMap.get(op.category_id);
                  const acc = accountMap.get(op.account_id);
                  const isIncome = op.type === 'income';

                  return (
                    <div
                      key={op.id}
                      className="py-3 flex items-center justify-between gap-4 hover:bg-mono-200/30 px-2 rounded-none transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-none flex items-center justify-center flex-shrink-0",
                            isIncome ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                          )}
                        >
                          {isIncome ? (
                            <ArrowDownRight className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-mono-900 truncate">
                            {op.description}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-mono-400">
                            <span>{formatDate(op.date)}</span>
                            <span>•</span>
                            <span className="truncate">{cat?.name || 'Без категории'}</span>
                            <span>•</span>
                            <span className="truncate">{acc?.name || 'Счет'}</span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={cn(
                          "text-xs font-bold font-mono flex-shrink-0 whitespace-nowrap",
                          isIncome ? "text-emerald-600" : "text-mono-900"
                        )}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(op.amount, acc?.currency || 'RUB')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
