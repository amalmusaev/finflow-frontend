import { useState, useEffect, useMemo } from 'react';
import {
  X,
  Loader2,
  ArrowLeftRight,
  Banknote,
  Coins,
  Trash2,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../api';
import type { Account, Transfer } from '../../api';
import { CURRENCY_SYMBOLS, formatCurrency } from '../../lib/utils';

export type TransferMode = 'transfer' | 'withdrawal' | 'deposit';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: Account[];
  editingTransfer?: Transfer | null;
  initialFromAccountId?: string;
  initialToAccountId?: string;
  initialMode?: TransferMode;
}

export function TransferModal({
  isOpen,
  onClose,
  onSuccess,
  accounts,
  editingTransfer = null,
  initialFromAccountId,
  initialToAccountId,
  initialMode = 'transfer',
}: TransferModalProps) {
  const [mode, setMode] = useState<TransferMode>(initialMode);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [fee, setFee] = useState<string>('0');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');

  const cashAccounts = useMemo(() => accounts.filter(a => a.type === 'cash' && a.is_active), [accounts]);
  const nonCashAccounts = useMemo(() => accounts.filter(a => a.type !== 'cash' && a.is_active), [accounts]);

  // Reset or initialize form
  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    if (editingTransfer) {
      setMode('transfer');
      setFromAccountId(editingTransfer.from_account_id);
      setToAccountId(editingTransfer.to_account_id);
      setAmount(editingTransfer.amount);
      setToAmount(editingTransfer.to_amount);
      setFee(editingTransfer.fee || '0');
      setDate(editingTransfer.date);
      setDescription(editingTransfer.description || '');
    } else {
      setMode(initialMode);
      setAmount('');
      setToAmount('');
      setFee('0');
      setDate(new Date().toISOString().split('T')[0]);

      if (initialMode === 'withdrawal') {
        const from = initialFromAccountId || nonCashAccounts[0]?.id || accounts[0]?.id || '';
        const to = cashAccounts[0]?.id || '';
        setFromAccountId(from);
        setToAccountId(to);
        setDescription('Снятие наличных');
      } else if (initialMode === 'deposit') {
        const from = cashAccounts[0]?.id || '';
        const to = initialToAccountId || nonCashAccounts[0]?.id || accounts[0]?.id || '';
        setFromAccountId(from);
        setToAccountId(to);
        setDescription('Внесение наличных');
      } else {
        const from = initialFromAccountId || accounts[0]?.id || '';
        const to = initialToAccountId || accounts.find(a => a.id !== from)?.id || '';
        setFromAccountId(from);
        setToAccountId(to);
        setDescription('');
      }
    }
  }, [isOpen, editingTransfer, initialMode, initialFromAccountId, initialToAccountId, accounts, cashAccounts, nonCashAccounts]);

  const fromAccount = useMemo(() => accounts.find(a => a.id === fromAccountId), [accounts, fromAccountId]);
  const toAccount = useMemo(() => accounts.find(a => a.id === toAccountId), [accounts, toAccountId]);

  const isCrossCurrency = useMemo(() => {
    if (!fromAccount || !toAccount) return false;
    return fromAccount.currency !== toAccount.currency;
  }, [fromAccount, toAccount]);

  const handleModeChange = (newMode: TransferMode) => {
    setMode(newMode);
    setError(null);

    if (newMode === 'withdrawal') {
      const from = nonCashAccounts[0]?.id || accounts[0]?.id || '';
      const to = cashAccounts[0]?.id || '';
      setFromAccountId(from);
      setToAccountId(to);
      setDescription(prev => (prev === 'Внесение наличных' || !prev ? 'Снятие наличных' : prev));
    } else if (newMode === 'deposit') {
      const from = cashAccounts[0]?.id || '';
      const to = nonCashAccounts[0]?.id || accounts[0]?.id || '';
      setFromAccountId(from);
      setToAccountId(to);
      setDescription(prev => (prev === 'Снятие наличных' || !prev ? 'Внесение наличных' : prev));
    } else {
      setDescription(prev => (prev === 'Снятие наличных' || prev === 'Внесение наличных' ? '' : prev));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setError('Укажите корректную положительную сумму перевода');
      return;
    }

    const feeNum = parseFloat(fee) || 0;
    if (feeNum < 0) {
      setError('Комиссия не может быть отрицательной');
      return;
    }

    if (!fromAccountId) {
      setError('Выберите счет списания');
      return;
    }

    if (mode === 'transfer' && !toAccountId) {
      setError('Выберите счет зачисления');
      return;
    }

    if (fromAccountId === toAccountId) {
      setError('Счет списания и счет зачисления не могут совпадать');
      return;
    }

    let toAmountNum: number | undefined = undefined;
    if (isCrossCurrency) {
      toAmountNum = parseFloat(toAmount);
      if (!toAmountNum || toAmountNum <= 0) {
        setError('Укажите сумму зачисления в валюте счета-получателя');
        return;
      }
    }

    try {
      setIsSaving(true);

      if (editingTransfer) {
        await api.transfers.updateTransfer(editingTransfer.id, {
          from_account_id: fromAccountId,
          to_account_id: toAccountId,
          amount: amountNum,
          to_amount: toAmountNum ?? amountNum,
          fee: feeNum,
          date,
          description: description.trim() || null,
        });
      } else if (mode === 'withdrawal') {
        await api.transfers.createCashWithdrawal({
          from_account_id: fromAccountId,
          to_account_id: toAccountId || null,
          amount: amountNum,
          fee: feeNum,
          date,
          description: description.trim() || 'Снятие наличных',
        });
      } else if (mode === 'deposit') {
        await api.transfers.createCashDeposit({
          to_account_id: toAccountId,
          from_account_id: fromAccountId || null,
          amount: amountNum,
          fee: feeNum,
          date,
          description: description.trim() || 'Внесение наличных',
        });
      } else {
        await api.transfers.createTransfer({
          from_account_id: fromAccountId,
          to_account_id: toAccountId,
          amount: amountNum,
          to_amount: toAmountNum ?? amountNum,
          fee: feeNum,
          date,
          description: description.trim() || null,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка сохранения перевода');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingTransfer) return;
    if (!window.confirm('Вы уверены, что хотите удалить этот перевод? Балансы счетов будут возвращены в исходное состояние.')) {
      return;
    }

    try {
      setIsSaving(true);
      await api.transfers.deleteTransfer(editingTransfer.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка при удалении перевода');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-mono-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-mono-50 border border-mono-200 rounded-none shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-mono-200 shrink-0 bg-mono-100/50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-none bg-mono-900 text-mono-50 flex items-center justify-center font-mono">
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-mono-900 tracking-tight leading-none">
                {editingTransfer ? 'Редактировать перевод' : 'Перевод между счетами'}
              </h2>
              <p className="text-xs text-mono-500 font-mono mt-1">
                Перемещение средств без изменения доходов и расходов
              </p>
            </div>
          </div>
          <button
            onClick={() => !isSaving && onClose()}
            className="text-mono-400 hover:text-mono-900 transition-colors p-1"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="m-5 mb-0 p-3 bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-700 dark:text-rose-400 text-xs font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex flex-col gap-4">
          {/* Mode Switcher (only for new transfers) */}
          {!editingTransfer && (
            <div className="flex bg-mono-100 p-0.5 border border-mono-200 rounded-none">
              <button
                type="button"
                onClick={() => handleModeChange('transfer')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-mono font-medium rounded-none transition-colors ${
                  mode === 'transfer'
                    ? 'bg-mono-900 text-mono-50 font-semibold'
                    : 'text-mono-500 hover:text-mono-900'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Перевод</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('withdrawal')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-mono font-medium rounded-none transition-colors ${
                  mode === 'withdrawal'
                    ? 'bg-mono-900 text-mono-50 font-semibold'
                    : 'text-mono-500 hover:text-mono-900'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Снятие нал</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('deposit')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-mono font-medium rounded-none transition-colors ${
                  mode === 'deposit'
                    ? 'bg-mono-900 text-mono-50 font-semibold'
                    : 'text-mono-500 hover:text-mono-900'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Внесение нал</span>
              </button>
            </div>
          )}

          {/* Account Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* From Account */}
            <div>
              <label className="block text-xs font-semibold text-mono-600 mb-1.5 uppercase tracking-wider font-mono">
                {mode === 'deposit' ? 'Счет наличных (источник)' : 'Счет списания'}
              </label>
              <div className="relative">
                <select
                  required
                  value={fromAccountId}
                  onChange={e => setFromAccountId(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 bg-mono-50 border border-mono-200 rounded-none focus:outline-none focus:border-mono-400 focus:ring-1 focus:ring-mono-400 text-mono-900 text-sm font-medium cursor-pointer"
                >
                  <option value="" disabled>Выберите счет</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id} disabled={a.id === toAccountId}>
                      {a.name} ({formatCurrency(a.balance, a.currency)})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mono-400 pointer-events-none" />
              </div>
            </div>

            {/* To Account */}
            <div>
              <label className="block text-xs font-semibold text-mono-600 mb-1.5 uppercase tracking-wider font-mono">
                {mode === 'withdrawal' ? 'Счет наличных (куда)' : 'Счет зачисления'}
              </label>
              <div className="relative">
                <select
                  required={mode !== 'withdrawal'}
                  value={toAccountId}
                  onChange={e => setToAccountId(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 bg-mono-50 border border-mono-200 rounded-none focus:outline-none focus:border-mono-400 focus:ring-1 focus:ring-mono-400 text-mono-900 text-sm font-medium cursor-pointer"
                >
                  {mode === 'withdrawal' && (
                    <option value="">Авто: Активные наличные</option>
                  )}
                  {accounts.map(a => (
                    <option key={a.id} value={a.id} disabled={a.id === fromAccountId}>
                      {a.name} ({formatCurrency(a.balance, a.currency)})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mono-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Amount and Currency conversion */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-mono-600 mb-1.5 uppercase tracking-wider font-mono">
                Сумма списания {fromAccount ? `(${CURRENCY_SYMBOLS[fromAccount.currency] || fromAccount.currency})` : ''}
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={e => {
                    setAmount(e.target.value);
                    if (!isCrossCurrency) {
                      setToAmount(e.target.value);
                    }
                  }}
                  placeholder="0.00"
                  className="w-full pl-3 pr-10 py-2 bg-mono-50 border border-mono-200 rounded-none focus:outline-none focus:border-mono-400 focus:ring-1 focus:ring-mono-400 font-mono text-base font-semibold text-mono-900"
                  autoFocus={!editingTransfer}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-medium text-mono-400">
                  {fromAccount ? CURRENCY_SYMBOLS[fromAccount.currency] || fromAccount.currency : ''}
                </span>
              </div>
            </div>

            {isCrossCurrency ? (
              <div>
                <label className="block text-xs font-semibold text-mono-700 mb-1.5 uppercase tracking-wider font-mono flex items-center justify-between">
                  <span>Сумма зачисления</span>
                  <span className="text-[10px] text-mono-400 font-normal lowercase">конвертация</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={toAmount}
                    onChange={e => setToAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-3 pr-10 py-2 bg-mono-50 border border-mono-300 rounded-none focus:outline-none focus:border-mono-500 font-mono text-base font-semibold text-mono-900"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-medium text-mono-600">
                    {toAccount ? CURRENCY_SYMBOLS[toAccount.currency] || toAccount.currency : ''}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-mono-600 mb-1.5 uppercase tracking-wider font-mono flex items-center gap-1">
                  <span>Комиссия</span>
                  <span className="text-[10px] text-mono-400 lowercase font-normal">(если есть)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={fee}
                    onChange={e => setFee(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-3 pr-10 py-2 bg-mono-50 border border-mono-200 rounded-none focus:outline-none focus:border-mono-400 focus:ring-1 focus:ring-mono-400 font-mono text-sm text-mono-900"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-mono-400">
                    {fromAccount ? CURRENCY_SYMBOLS[fromAccount.currency] || fromAccount.currency : ''}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Cross currency fee row */}
          {isCrossCurrency && (
            <div>
              <label className="block text-xs font-semibold text-mono-600 mb-1.5 uppercase tracking-wider font-mono flex items-center gap-1">
                <span>Комиссия за перевод</span>
                <span className="text-[10px] text-mono-400 lowercase font-normal">(в валюте списания)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={fee}
                  onChange={e => setFee(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-3 pr-10 py-2 bg-mono-50 border border-mono-200 rounded-none focus:outline-none focus:border-mono-400 focus:ring-1 focus:ring-mono-400 font-mono text-sm text-mono-900"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-mono-400">
                  {fromAccount ? CURRENCY_SYMBOLS[fromAccount.currency] || fromAccount.currency : ''}
                </span>
              </div>
            </div>
          )}

          {/* Date and Description */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-mono-600 mb-1.5 uppercase tracking-wider font-mono">Дата</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-mono-50 border border-mono-200 rounded-none focus:outline-none focus:border-mono-400 text-mono-900 text-xs font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-mono-600 mb-1.5 uppercase tracking-wider font-mono">Примечание</label>
              <input
                type="text"
                maxLength={255}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Например, Пополнение карты, Накопления..."
                className="w-full px-3 py-2 bg-mono-50 border border-mono-200 rounded-none focus:outline-none focus:border-mono-400 text-mono-900 text-sm placeholder:text-mono-400"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 mt-2 border-t border-mono-200 flex justify-between items-center gap-3 shrink-0">
            {editingTransfer ? (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleDelete}
                className="px-3.5 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 rounded-none transition-colors font-medium text-xs flex items-center gap-1.5 font-mono"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Удалить перевод</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={onClose}
                className="px-4 py-2 text-mono-600 hover:text-mono-900 transition-colors font-medium text-xs rounded-none"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2 bg-mono-900 hover:bg-mono-800 text-mono-50 rounded-none transition-colors font-medium text-xs disabled:opacity-50 font-mono"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingTransfer ? 'Сохранить' : 'Выполнить перевод'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
