import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Filter, Plus, X, Trash2, ChevronDown, Loader2, AlertCircle, RefreshCw, ArrowDownRight, ArrowUpRight, Calendar, RotateCcw } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { api } from '../api';
import type { Operation, Account, Category, OperationType } from '../api';
import { CURRENCY_SYMBOLS, formatDate } from '../lib/utils';

export function Transactions() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & search
  const [search, setSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<{
    type: 'all' | OperationType;
    accountId: string;
    categoryId: string;
    startDate: string;
    endDate: string;
  }>({
    type: 'all',
    accountId: 'all',
    categoryId: 'all',
    startDate: '',
    endDate: '',
  });

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);
  const [formData, setFormData] = useState<{
    type: OperationType;
    amount: string;
    date: string;
    description: string;
    categoryId: string;
    accountId: string;
  }>({
    type: 'expense',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    categoryId: '',
    accountId: '',
  });

  const parentRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [opsRes, accsRes, catsRes] = await Promise.all([
        api.operations.getAllOperations(),
        api.accounts.getAccounts(),
        api.categories.getCategories(),
      ]);

      setOperations(opsRes.operations || []);
      setAccounts(accsRes.accounts || []);
      setCategories(catsRes.categories || []);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки данных');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered operations
  const filteredOperations = useMemo(() => {
    return operations.filter(op => {
      const matchesSearch = !search || op.description.toLowerCase().includes(search.toLowerCase());
      const matchesType = filters.type === 'all' || op.type === filters.type;
      const matchesAccount = filters.accountId === 'all' || op.account_id === filters.accountId;
      const matchesCategory = filters.categoryId === 'all' || op.category_id === filters.categoryId;
      const matchesStartDate = !filters.startDate || op.date >= filters.startDate;
      const matchesEndDate = !filters.endDate || op.date <= filters.endDate;
      return matchesSearch && matchesType && matchesAccount && matchesCategory && matchesStartDate && matchesEndDate;
    });
  }, [operations, search, filters]);

  // Virtualizer for high-performance rendering of huge datasets
  const rowVirtualizer = useVirtualizer({
    count: filteredOperations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 15,
  });

  // Account map for quick lookup
  const accountMap = useMemo(() => {
    const map = new Map<string, Account>();
    accounts.forEach(a => map.set(a.id, a));
    return map;
  }, [accounts]);

  // Category map for quick lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach(c => map.set(c.id, c));
    return map;
  }, [categories]);

  const handleDatePreset = (preset: 'all' | 'today' | '7days' | '30days' | 'month') => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'all') {
      setFilters(prev => ({ ...prev, startDate: '', endDate: '' }));
    } else if (preset === 'today') {
      setFilters(prev => ({ ...prev, startDate: todayStr, endDate: todayStr }));
    } else if (preset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setFilters(prev => ({ ...prev, startDate: d.toISOString().split('T')[0], endDate: todayStr }));
    } else if (preset === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setFilters(prev => ({ ...prev, startDate: d.toISOString().split('T')[0], endDate: todayStr }));
    } else if (preset === 'month') {
      const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      setFilters(prev => ({ ...prev, startDate: startOfMonth, endDate: todayStr }));
    }
  };

  const handleResetFilters = () => {
    setFilters({
      type: 'all',
      accountId: 'all',
      categoryId: 'all',
      startDate: '',
      endDate: '',
    });
    setSearch('');
  };

  const activeFiltersCount = [
    filters.type !== 'all',
    filters.accountId !== 'all',
    filters.categoryId !== 'all',
    Boolean(filters.startDate || filters.endDate),
  ].filter(Boolean).length;

  const handleCreate = () => {
    setEditingOperation(null);
    const defaultType: OperationType = 'expense';
    const firstCat = categories.find(c => c.type === defaultType)?.id || categories[0]?.id || '';
    const firstAcc = accounts[0]?.id || '';

    setFormData({
      type: defaultType,
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      categoryId: firstCat,
      accountId: firstAcc,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (operation: Operation) => {
    setEditingOperation(operation);
    setFormData({
      type: operation.type,
      amount: operation.amount,
      date: operation.date,
      description: operation.description,
      categoryId: operation.category_id,
      accountId: operation.account_id,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!editingOperation) return;
    if (!window.confirm('Вы уверены, что хотите удалить эту операцию?')) return;

    try {
      setIsSaving(true);
      await api.operations.deleteOperation(editingOperation.id);
      setOperations(prev => prev.filter(o => o.id !== editingOperation.id));
      setIsModalOpen(false);
      // Reload accounts to reflect updated balances
      api.accounts.getAccounts().then(res => setAccounts(res.accounts || []));
    } catch (err: any) {
      alert(`Не удалось удалить операцию: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formData.amount);
    if (!amountNum || amountNum <= 0) {
      alert('Пожалуйста, введите корректную положительную сумму');
      return;
    }

    if (!formData.categoryId) {
      alert('Пожалуйста, выберите категорию');
      return;
    }

    if (!formData.accountId) {
      alert('Пожалуйста, выберите счет');
      return;
    }

    try {
      setIsSaving(true);
      if (editingOperation) {
        const updated = await api.operations.updateOperation(editingOperation.id, {
          description: formData.description.trim() || 'Без описания',
          amount: amountNum,
          type: formData.type,
          date: formData.date,
          category_id: formData.categoryId,
          account_id: formData.accountId,
        });
        setOperations(prev => prev.map(o => (o.id === editingOperation.id ? updated : o)));
      } else {
        const created = await api.operations.createOperation({
          description: formData.description.trim() || 'Без описания',
          amount: amountNum,
          type: formData.type,
          date: formData.date,
          category_id: formData.categoryId,
          account_id: formData.accountId,
        });
        setOperations(prev => [created, ...prev]);
      }
      setIsModalOpen(false);
      // Reload accounts to reflect updated balances
      api.accounts.getAccounts().then(res => setAccounts(res.accounts || []));
    } catch (err: any) {
      alert(`Ошибка при сохранении: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-mono-900 tracking-tight">Операции</h1>
          <p className="text-xs text-mono-500 mt-1">
            Всего операций: <span className="font-mono font-semibold text-mono-900">{filteredOperations.length}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadData}
            disabled={isLoading}
            className="p-2 border border-mono-200 rounded-none hover:bg-mono-200 text-mono-600 transition-colors disabled:opacity-50"
            title="Обновить список"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleCreate}
            className="flex items-center gap-2 bg-mono-900 text-mono-50 px-4 py-2 rounded-none hover:bg-mono-800 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Новая операция</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-none flex items-center justify-between text-rose-700 dark:text-rose-400">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button 
            onClick={loadData}
            className="text-xs font-semibold underline hover:no-underline ml-4"
          >
            Повторить
          </button>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-mono-400" />
            <input
              type="text"
              placeholder="Поиск по описанию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-mono-50 border border-mono-200 rounded-none focus:outline-none focus:border-mono-400 focus:ring-1 focus:ring-mono-400 text-mono-900 placeholder:text-mono-400 text-sm"
            />
          </div>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-none transition-colors text-sm font-medium ${
              isFilterOpen 
                ? 'bg-mono-900 text-mono-50 border-mono-900' 
                : 'bg-mono-100 border-mono-200 hover:bg-mono-200 text-mono-900'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Фильтры</span>
            {activeFiltersCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-none text-[11px] font-mono font-medium ${
                isFilterOpen ? 'bg-mono-700 text-mono-100' : 'bg-mono-300 text-mono-800'
              }`}>
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {isFilterOpen && (
          <div className="p-4 bg-mono-50 border border-mono-200 rounded-none space-y-4">
            {/* Main filter selectors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-mono-600 mb-1.5 uppercase tracking-wider">Тип операции</label>
                <div className="relative">
                  <select
                    value={filters.type}
                    onChange={e => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full appearance-none pl-3 pr-10 py-2 bg-mono-50 border border-mono-200 rounded-none focus:outline-none focus:border-mono-400 text-mono-900 text-sm cursor-pointer"
                  >
                    <option value="all">Все типы</option>
                    <option value="expense">Расходы</option>
                    <option value="income">Доходы</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mono-500 pointer-events-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-mono-600 mb-1.5 uppercase tracking-wider">Счет</label>
                <div className="relative">
                  <select
                    value={filters.accountId}
                    onChange={e => setFilters(prev => ({ ...prev, accountId: e.target.value }))}
                    className="w-full appearance-none pl-3 pr-10 py-2 bg-mono-50 border border-mono-200 rounded-none focus:outline-none focus:border-mono-400 text-mono-900 text-sm cursor-pointer"
                  >
                    <option value="all">Все счета ({accounts.length})</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.balance} {CURRENCY_SYMBOLS[a.currency] || a.currency})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mono-500 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-mono-600 mb-1.5 uppercase tracking-wider">Категория</label>
                <div className="relative">
                  <select
                    value={filters.categoryId}
                    onChange={e => setFilters(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full appearance-none pl-3 pr-10 py-2 bg-mono-50 border border-mono-200 rounded-none focus:outline-none focus:border-mono-400 text-mono-900 text-sm cursor-pointer"
                  >
                    <option value="all">Все категории ({categories.length})</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type === 'income' ? 'Доход' : 'Расход'})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mono-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Date filter row */}
            <div className="pt-3 border-t border-mono-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-mono-500 flex-shrink-0" />
                  <span className="text-xs font-semibold text-mono-600 uppercase tracking-wider">Период:</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="px-2.5 py-1.5 bg-mono-50 border border-mono-200 rounded-none text-xs font-mono text-mono-900 focus:outline-none focus:border-mono-400"
                    title="Дата от"
                  />
                  <span className="text-mono-400 text-xs">—</span>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="px-2.5 py-1.5 bg-mono-50 border border-mono-200 rounded-none text-xs font-mono text-mono-900 focus:outline-none focus:border-mono-400"
                    title="Дата до"
                  />
                </div>

                {/* Quick presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDatePreset('today')}
                    className="px-2 py-1 rounded bg-mono-200/70 hover:bg-mono-200 text-mono-700 text-xs font-medium transition-colors"
                  >
                    Сегодня
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDatePreset('7days')}
                    className="px-2 py-1 rounded bg-mono-200/70 hover:bg-mono-200 text-mono-700 text-xs font-medium transition-colors"
                  >
                    7 дней
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDatePreset('30days')}
                    className="px-2 py-1 rounded bg-mono-200/70 hover:bg-mono-200 text-mono-700 text-xs font-medium transition-colors"
                  >
                    30 дней
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDatePreset('month')}
                    className="px-2 py-1 rounded bg-mono-200/70 hover:bg-mono-200 text-mono-700 text-xs font-medium transition-colors"
                  >
                    Этот месяц
                  </button>
                </div>
              </div>

              {(activeFiltersCount > 0 || search) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-xs text-mono-500 hover:text-mono-900 transition-colors font-medium self-end md:self-center"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Сбросить все</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Table Container with Virtual Scrolling */}
      <div className="flex-1 bg-mono-50 border border-mono-200 rounded-none overflow-hidden flex flex-col min-h-0">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-mono-500 py-16">
            <Loader2 className="w-8 h-8 animate-spin text-mono-400 mb-3" />
            <p className="text-sm">Загрузка операций...</p>
          </div>
        ) : filteredOperations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-mono-500 py-16 px-4">
            <p className="text-sm font-medium text-mono-700 mb-1">Операций не найдено</p>
            <p className="text-xs text-mono-400 mb-4 text-center">
              {operations.length === 0 
                ? 'Добавьте первую операцию дохода или расхода.' 
                : 'Попробуйте сбросить параметры фильтрации или поисковый запрос.'}
            </p>
            {operations.length === 0 && (
              <button 
                onClick={handleCreate}
                className="flex items-center gap-2 bg-mono-900 text-mono-50 px-4 py-2 rounded-none hover:bg-mono-800 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить операцию</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Sticky Table Header */}
            <div className="bg-mono-100 border-b border-mono-200 text-xs font-semibold uppercase tracking-wider text-mono-500 grid grid-cols-12 px-4 py-3 items-center select-none shrink-0">
              <div className="col-span-2">Дата</div>
              <div className="col-span-4">Описание</div>
              <div className="col-span-2">Категория</div>
              <div className="col-span-2">Счет</div>
              <div className="col-span-2 text-right">Сумма</div>
            </div>

            {/* Virtualized Scrollable Rows Container */}
            <div ref={parentRef} className="overflow-auto flex-1 relative bg-mono-50">
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const op = filteredOperations[virtualRow.index];
                  const category = categoryMap.get(op.category_id);
                  const account = accountMap.get(op.account_id);
                  const isIncome = op.type === 'income';
                  const amountNum = parseFloat(op.amount) || 0;
                  const currencySymbol = account ? CURRENCY_SYMBOLS[account.currency] || account.currency : '₽';

                  return (
                    <div
                      key={op.id}
                      onClick={() => handleEdit(op)}
                      className="hover:bg-mono-100 transition-colors cursor-pointer group absolute top-0 left-0 w-full grid grid-cols-12 px-4 py-3 items-center border-b border-mono-200/70 text-sm"
                      style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <div className="col-span-2 text-xs font-mono text-mono-500 whitespace-nowrap">
                        {formatDate(op.date)}
                      </div>
                      <div className="col-span-4 font-medium text-mono-900 flex items-center gap-2 min-w-0 pr-2">
                        <span className={`p-1 rounded-none flex-shrink-0 ${isIncome ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                          {isIncome ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        </span>
                        <span className="truncate">{op.description}</span>
                      </div>
                      <div className="col-span-2 whitespace-nowrap truncate pr-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-mono-200 text-mono-700 truncate max-w-full">
                          {category?.name || 'Без категории'}
                        </span>
                      </div>
                      <div className="col-span-2 text-xs text-mono-600 whitespace-nowrap truncate pr-2">
                        {account?.name || 'Счет удален'}
                      </div>
                      <div className={`col-span-2 text-right font-mono font-semibold text-sm whitespace-nowrap ${
                        isIncome ? 'text-emerald-600' : 'text-mono-900'
                      }`}>
                        {isIncome ? '+' : '-'}{amountNum.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} {currencySymbol}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Operation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-mono-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-mono-50 rounded-none shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-mono-200 max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-mono-200 shrink-0">
              <h2 className="text-lg font-semibold text-mono-900">
                {editingOperation ? 'Редактировать операцию' : 'Новая операция'}
              </h2>
              <button 
                onClick={() => !isSaving && setIsModalOpen(false)} 
                className="text-mono-500 hover:text-mono-900 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex flex-col gap-4">
              {/* Type Switcher */}
              <div className="flex bg-mono-100 p-1 rounded-none border border-mono-200">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      type: 'expense',
                      categoryId: categories.find(c => c.type === 'expense')?.id || prev.categoryId,
                    }));
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors ${
                    formData.type === 'expense'
                      ? 'bg-mono-50 text-mono-900'
                      : 'text-mono-500 hover:text-mono-800'
                  }`}
                >
                  Расход
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      type: 'income',
                      categoryId: categories.find(c => c.type === 'income')?.id || prev.categoryId,
                    }));
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors ${
                    formData.type === 'income'
                      ? 'bg-mono-50 text-mono-900'
                      : 'text-mono-500 hover:text-mono-800'
                  }`}
                >
                  Доход
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-mono-700 mb-1.5">Сумма</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={formData.amount}
                  onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 bg-mono-50 border border-mono-200 rounded-none focus:outline-none focus:border-mono-400 focus:ring-1 focus:ring-mono-400 text-mono-900 font-mono text-base placeholder:text-mono-400"
                  placeholder="0.00"
                  autoFocus={!editingOperation}
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-mono-700 mb-1.5">Дата</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 bg-mono-50 border border-mono-200 rounded-none focus:outline-none focus:border-mono-400 focus:ring-1 focus:ring-mono-400 text-mono-900 text-sm font-mono"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-mono-700 mb-1.5">Описание</label>
                <input
                  type="text"
                  required
                  maxLength={255}
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-mono-50 border border-mono-200 rounded-none focus:outline-none focus:border-mono-400 focus:ring-1 focus:ring-mono-400 text-mono-900 placeholder:text-mono-400 text-sm"
                  placeholder="Например, Покупка продуктов, Зарплата"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-mono-700 mb-1.5">Категория</label>
                <div className="relative">
                  <select
                    required
                    value={formData.categoryId}
                    onChange={e => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full appearance-none pl-3 pr-10 py-2 bg-mono-50 border border-mono-200 rounded-none focus:outline-none focus:border-mono-400 text-mono-900 text-sm cursor-pointer"
                  >
                    <option value="" disabled>Выберите категорию</option>
                    {categories.filter(c => c.type === formData.type).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mono-500 pointer-events-none" />
                </div>
              </div>

              {/* Account */}
              <div>
                <label className="block text-sm font-medium text-mono-700 mb-1.5">Счет</label>
                <div className="relative">
                  <select
                    required
                    value={formData.accountId}
                    onChange={e => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
                    className="w-full appearance-none pl-3 pr-10 py-2 bg-mono-50 border border-mono-200 rounded-none focus:outline-none focus:border-mono-400 text-mono-900 text-sm cursor-pointer"
                  >
                    <option value="" disabled>Выберите счет</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.balance} {CURRENCY_SYMBOLS[a.currency] || a.currency})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mono-500 pointer-events-none" />
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-mono-200 flex justify-between items-center gap-3 shrink-0">
                {editingOperation ? (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleDelete}
                    className="px-3.5 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 rounded-none transition-colors font-medium text-sm flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Удалить</span>
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-mono-600 hover:text-mono-900 transition-colors font-medium text-sm"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-mono-900 text-mono-50 rounded-none hover:bg-mono-800 transition-colors font-medium text-sm disabled:opacity-50"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{editingOperation ? 'Сохранить' : 'Создать'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
