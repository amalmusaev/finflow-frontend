import { useState, useEffect, useCallback } from 'react';
import { Moon, Sun, ChevronDown, Plus, X, Trash2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../api';
import type { Category, OperationType, Currency } from '../api';

import { CURRENCY_LABELS } from '../lib/utils';

export function Settings() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('finflow_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  const [defaultCurrency, setDefaultCurrency] = useState<Currency>(() => {
    return (localStorage.getItem('finflow_currency') as Currency) || 'RUB';
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<OperationType>('expense');

  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.categories.getCategories();
      setCategories(res.categories || []);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки категорий');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    localStorage.setItem('finflow_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleCurrencyChange = (curr: Currency) => {
    setDefaultCurrency(curr);
    localStorage.setItem('finflow_currency', curr);
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Удалить категорию "${name}"?`)) return;
    try {
      await api.categories.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert(`Не удалось удалить категорию: ${err.message}`);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;

    try {
      setIsSaving(true);
      const created = await api.categories.createCategory({
        name,
        type: newCategoryType,
      });
      setCategories(prev => [...prev, created]);
      setIsCategoryModalOpen(false);
      setNewCategoryName('');
    } catch (err: any) {
      alert(`Не удалось создать категорию: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  return (
    <div className="p-8 h-full flex flex-col max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold text-mono-900 tracking-tight">Настройки</h1>
        <button 
          onClick={loadCategories}
          disabled={isLoading}
          className="p-2 border border-mono-200 rounded-md hover:bg-mono-200 text-mono-600 transition-colors disabled:opacity-50"
          title="Обновить данные"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center justify-between text-rose-700 dark:text-rose-400">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button 
            onClick={loadCategories}
            className="text-xs font-semibold underline hover:no-underline ml-4"
          >
            Повторить
          </button>
        </div>
      )}

      <div className="space-y-6 pb-8">
        {/* Appearance Section */}
        <section className="bg-mono-100 border border-mono-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-mono-900 mb-1">Внешний вид</h2>
          <p className="text-sm text-mono-500 mb-4">Настройка темы оформления интерфейса FinFlow.</p>
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="font-medium text-mono-900 text-sm">Тема приложения</p>
              <p className="text-xs text-mono-500">
                Текущая тема: <strong className="text-mono-800">{theme === 'dark' ? 'Тёмная' : 'Светлая'}</strong>
              </p>
            </div>
            <button 
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 bg-mono-200 hover:bg-mono-300 text-mono-900 rounded-md transition-colors text-sm font-medium"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              <span>{theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}</span>
            </button>
          </div>
        </section>

        {/* General Settings Section */}
        <section className="bg-mono-100 border border-mono-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-mono-900 mb-1">Основные параметры</h2>
          <p className="text-sm text-mono-500 mb-4">Настройка предпочтений для новых операций и счетов.</p>
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-mono-700 mb-1.5">Основная валюта по умолчанию</label>
              <div className="relative w-full md:w-72">
                <select 
                  value={defaultCurrency}
                  onChange={e => handleCurrencyChange(e.target.value as Currency)}
                  className="w-full appearance-none bg-mono-50 border border-mono-200 rounded-md pl-3 pr-10 py-2 text-mono-900 focus:outline-none focus:border-mono-400 focus:ring-1 focus:ring-mono-400 text-sm cursor-pointer"
                >
                  {(Object.keys(CURRENCY_LABELS) as Currency[]).map(curr => (
                    <option key={curr} value={curr}>
                      {CURRENCY_LABELS[curr]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mono-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="bg-mono-100 border border-mono-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-mono-900">Категории операций</h2>
              <p className="text-sm text-mono-500">Управление категориями для классификации доходов и расходов.</p>
            </div>
            <button 
              onClick={() => {
                setNewCategoryName('');
                setNewCategoryType('expense');
                setIsCategoryModalOpen(true);
              }}
              className="flex items-center gap-1.5 text-sm font-medium text-mono-50 bg-mono-900 px-3.5 py-1.5 rounded-md hover:bg-mono-800 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить</span>
            </button>
          </div>
          
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-mono-500">
              <Loader2 className="w-6 h-6 animate-spin text-mono-400 mb-2" />
              <span className="text-xs">Загрузка категорий...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Expense Categories */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-mono-200">
                  <h3 className="text-xs font-semibold text-mono-500 uppercase tracking-wider">
                    Расходы ({expenseCategories.length})
                  </h3>
                </div>
                {expenseCategories.length === 0 ? (
                  <p className="text-xs text-mono-400 py-4 text-center">Нет категорий расходов</p>
                ) : (
                  <ul className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {expenseCategories.map(c => (
                      <li key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-mono-50 border border-mono-200 group hover:border-mono-300 transition-colors">
                        <span className="text-sm font-medium text-mono-900">{c.name}</span>
                        <button 
                          onClick={() => handleDeleteCategory(c.id, c.name)}
                          className="text-mono-400 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100 p-1"
                          title="Удалить категорию"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Income Categories */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-mono-200">
                  <h3 className="text-xs font-semibold text-mono-500 uppercase tracking-wider">
                    Доходы ({incomeCategories.length})
                  </h3>
                </div>
                {incomeCategories.length === 0 ? (
                  <p className="text-xs text-mono-400 py-4 text-center">Нет категорий доходов</p>
                ) : (
                  <ul className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {incomeCategories.map(c => (
                      <li key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-mono-50 border border-mono-200 group hover:border-mono-300 transition-colors">
                        <span className="text-sm font-medium text-mono-900">{c.name}</span>
                        <button 
                          onClick={() => handleDeleteCategory(c.id, c.name)}
                          className="text-mono-400 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100 p-1"
                          title="Удалить категорию"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-mono-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-mono-50 rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col border border-mono-200">
            <div className="flex items-center justify-between p-5 border-b border-mono-200">
              <h2 className="text-lg font-semibold text-mono-900">Новая категория</h2>
              <button 
                onClick={() => !isSaving && setIsCategoryModalOpen(false)} 
                className="text-mono-500 hover:text-mono-900 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddCategory} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-mono-700 mb-1.5">Тип операции</label>
                <div className="flex bg-mono-100 p-1 rounded-md border border-mono-200">
                  <button
                    type="button"
                    onClick={() => setNewCategoryType('expense')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors ${
                      newCategoryType === 'expense'
                        ? 'bg-mono-50 text-mono-900 shadow-sm'
                        : 'text-mono-500 hover:text-mono-800'
                    }`}
                  >
                    Расход
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCategoryType('income')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors ${
                      newCategoryType === 'income'
                        ? 'bg-mono-50 text-mono-900 shadow-sm'
                        : 'text-mono-500 hover:text-mono-800'
                    }`}
                  >
                    Доход
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-mono-700 mb-1.5">Название категории</label>
                <input
                  type="text"
                  required
                  maxLength={128}
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 bg-mono-50 border border-mono-200 rounded-md focus:outline-none focus:border-mono-400 focus:ring-1 focus:ring-mono-400 text-mono-900 placeholder:text-mono-400 text-sm"
                  placeholder="Например, Продукты, Рестораны"
                  autoFocus
                />
              </div>

              <div className="pt-3 border-t border-mono-200 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-mono-600 hover:text-mono-900 transition-colors font-medium text-sm"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-mono-900 text-mono-50 rounded-md hover:bg-mono-800 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Добавить</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
