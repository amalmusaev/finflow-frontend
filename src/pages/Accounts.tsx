import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Trash2, Loader2, AlertCircle, RefreshCw, Landmark } from 'lucide-react';
import { api } from '../api';
import type { Account, AccountType, Currency } from '../api';
import { ACCOUNT_TYPE_LABELS, CURRENCY_SYMBOLS, formatCurrency } from '../lib/utils';

const AVAILABLE_CURRENCIES: Currency[] = ['RUB', 'USD', 'EUR', 'BYN', 'KZT', 'CNY'];
const AVAILABLE_TYPES: AccountType[] = ['card', 'bank', 'cash', 'deposit'];

export function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    type: AccountType;
    balance: string;
    currency: Currency;
    is_active: boolean;
  }>({
    name: '',
    type: 'card',
    balance: '',
    currency: 'RUB',
    is_active: true,
  });

  const loadAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.accounts.getAccounts();
      setAccounts(res.accounts || []);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки счетов');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency: account.currency,
      is_active: account.is_active,
    });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingAccount(null);
    setFormData({
      name: '',
      type: 'card',
      balance: '0',
      currency: 'RUB',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!editingAccount) return;
    if (!window.confirm(`Вы уверены, что хотите удалить счет "${editingAccount.name}"?`)) return;

    try {
      setIsSaving(true);
      await api.accounts.deleteAccount(editingAccount.id);
      setAccounts(prev => prev.filter(a => a.id !== editingAccount.id));
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Не удалось удалить счет: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      if (editingAccount) {
        const updated = await api.accounts.updateAccount(editingAccount.id, {
          name: formData.name.trim(),
          type: formData.type,
          currency: formData.currency,
          is_active: formData.is_active,
        });
        setAccounts(prev => prev.map(a => (a.id === editingAccount.id ? updated : a)));
      } else {
        const created = await api.accounts.createAccount({
          name: formData.name.trim(),
          type: formData.type,
          currency: formData.currency,
          balance: parseFloat(formData.balance) || 0,
        });
        setAccounts(prev => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Ошибка при сохранении: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Group balances by currency
  const currencyTotals = accounts.reduce((acc, a) => {
    const balance = parseFloat(a.balance) || 0;
    acc[a.currency] = (acc[a.currency] || 0) + balance;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-8 h-full flex flex-col max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-mono-900 tracking-tight mb-1">Счета</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-mono-500">
            <span>Всего счетов: <strong className="font-mono text-mono-800 font-medium">{accounts.length}</strong></span>
            {Object.keys(currencyTotals).length > 0 && (
              <>
                <span className="text-mono-300">•</span>
                <div className="flex flex-wrap items-center gap-2">
                  {Object.entries(currencyTotals).map(([curr, total]) => (
                    <span key={curr} className="inline-flex items-center px-2 py-0.5 rounded bg-mono-200/70 text-mono-800 font-mono text-xs font-medium">
                      {total.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} {CURRENCY_SYMBOLS[curr as Currency] || curr}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadAccounts}
            disabled={isLoading}
            className="p-2 border border-mono-200 rounded-md hover:bg-mono-200 text-mono-600 transition-colors disabled:opacity-50"
            title="Обновить список счетов"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleCreate}
            className="flex items-center gap-2 bg-mono-900 text-mono-50 px-4 py-2 rounded-md hover:bg-mono-800 transition-colors font-medium text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить счет</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center justify-between text-rose-700 dark:text-rose-400">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button 
            onClick={loadAccounts}
            className="text-xs font-semibold underline hover:no-underline ml-4"
          >
            Повторить
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-mono-500 py-16">
          <Loader2 className="w-8 h-8 animate-spin text-mono-400 mb-3" />
          <p className="text-sm">Загрузка счетов...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-mono-500 py-16 border border-dashed border-mono-200 rounded-xl bg-mono-100/50">
          <Landmark className="w-12 h-12 text-mono-300 mb-3" />
          <h3 className="text-lg font-medium text-mono-800 mb-1">У вас пока нет счетов</h3>
          <p className="text-sm text-mono-500 mb-4 text-center max-w-sm">
            Создайте свой первый счет (банковскую карту, наличные или вклад) для учета операций.
          </p>
          <button 
            onClick={handleCreate}
            className="flex items-center gap-2 bg-mono-900 text-mono-50 px-4 py-2 rounded-md hover:bg-mono-800 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Создать счет</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(account => {
            const balanceNum = parseFloat(account.balance) || 0;

            return (
              <div 
                key={account.id} 
                onClick={() => handleEdit(account)}
                className={`bg-mono-100 border border-mono-200 rounded-xl p-6 hover:border-mono-300 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between ${!account.is_active ? 'opacity-60' : ''}`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-mono-900 leading-snug">{account.name}</h3>
                      <span className="text-xs text-mono-500">{ACCOUNT_TYPE_LABELS[account.type]}</span>
                    </div>
                    <span className="text-xs font-mono font-medium text-mono-600 uppercase bg-mono-200 px-2 py-0.5 rounded">
                      {account.currency}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-xs text-mono-500 font-medium">Баланс</span>
                  <p className="text-xl font-mono font-semibold text-mono-900 tracking-tight">
                    {formatCurrency(balanceNum, account.currency)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-mono-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-mono-50 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-mono-200">
            <div className="flex items-center justify-between p-5 border-b border-mono-200">
              <h2 className="text-lg font-semibold text-mono-900">
                {editingAccount ? 'Редактировать счет' : 'Новый счет'}
              </h2>
              <button 
                onClick={() => !isSaving && setIsModalOpen(false)} 
                className="text-mono-500 hover:text-mono-900 transition-colors p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-mono-700 mb-1.5">Название счета</label>
                <input
                  type="text"
                  required
                  maxLength={128}
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-mono-50 border border-mono-200 rounded-md focus:outline-none focus:border-mono-400 focus:ring-1 focus:ring-mono-400 text-mono-900 placeholder:text-mono-400"
                  placeholder="Например, Tinkoff Black или Наличные"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-mono-700 mb-1.5">Тип счета</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as AccountType }))}
                    className="w-full px-3 py-2 bg-mono-50 border border-mono-200 rounded-md focus:outline-none focus:border-mono-400 focus:ring-1 focus:ring-mono-400 text-mono-900 cursor-pointer"
                  >
                    {AVAILABLE_TYPES.map(type => (
                      <option key={type} value={type}>
                        {ACCOUNT_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-mono-700 mb-1.5">Валюта</label>
                  <select
                    value={formData.currency}
                    onChange={e => setFormData(prev => ({ ...prev, currency: e.target.value as Currency }))}
                    className="w-full px-3 py-2 bg-mono-50 border border-mono-200 rounded-md focus:outline-none focus:border-mono-400 focus:ring-1 focus:ring-mono-400 text-mono-900 cursor-pointer"
                  >
                    {AVAILABLE_CURRENCIES.map(curr => (
                      <option key={curr} value={curr}>
                        {curr} ({CURRENCY_SYMBOLS[curr]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!editingAccount && (
                <div>
                  <label className="block text-sm font-medium text-mono-700 mb-1.5">Начальный баланс</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={e => setFormData(prev => ({ ...prev, balance: e.target.value }))}
                    className="w-full px-3 py-2 bg-mono-50 border border-mono-200 rounded-md focus:outline-none focus:border-mono-400 focus:ring-1 focus:ring-mono-400 text-mono-900 font-mono"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-mono-500 mt-1">Баланс в дальнейшем корректируется операциями доходов и расходов.</p>
                </div>
              )}

              {editingAccount && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 rounded border-mono-300 text-mono-900 focus:ring-mono-400"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-mono-800 cursor-pointer">
                    Счет активен
                  </label>
                </div>
              )}

              <div className="pt-4 mt-2 border-t border-mono-200 flex justify-between items-center gap-3">
                {editingAccount ? (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleDelete}
                    className="px-3.5 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 rounded-md transition-colors font-medium text-sm flex items-center gap-1.5"
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
                    className="flex items-center gap-2 px-4 py-2 bg-mono-900 text-mono-50 rounded-md hover:bg-mono-800 transition-colors font-medium text-sm disabled:opacity-50"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{editingAccount ? 'Сохранить' : 'Создать'}</span>
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
