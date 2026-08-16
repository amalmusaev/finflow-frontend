import type { Account, Category, Operation } from '../api/types';
import { formatCurrency, formatDate } from './utils';

export interface FinancialContext {
  accounts: Account[];
  categories: Category[];
  operations: Operation[];
}

/**
 * Генерирует реалистичный и структурированный ответ финансового ИИ-агента на основе вопроса и текущих данных.
 */
export async function generateMockAiResponse(
  userQuery: string,
  context?: FinancialContext
): Promise<string> {
  const query = userQuery.toLowerCase().trim();

  const accounts = context?.accounts || [];
  const categories = context?.categories || [];
  const operations = context?.operations || [];

  const categoryMap = new Map<string, Category>();
  categories.forEach((c) => categoryMap.set(c.id, c));

  const accountMap = new Map<string, Account>();
  accounts.forEach((a) => accountMap.set(a.id, a));

  // Вычисляем базовые метрики
  const totalBalance = accounts.reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0);
  const expenseOps = operations.filter((op) => op.type === 'expense');
  const incomeOps = operations.filter((op) => op.type === 'income');

  const totalExpense = expenseOps.reduce((sum, op) => sum + Math.abs(parseFloat(op.amount) || 0), 0);
  const totalIncome = incomeOps.reduce((sum, op) => sum + (parseFloat(op.amount) || 0), 0);

  // Группировка расходов по категориям
  const categoryExpenses = new Map<string, number>();
  expenseOps.forEach((op) => {
    const catName = categoryMap.get(op.category_id)?.name || 'Без категории';
    const amount = Math.abs(parseFloat(op.amount) || 0);
    categoryExpenses.set(catName, (categoryExpenses.get(catName) || 0) + amount);
  });

  const sortedCategories = Array.from(categoryExpenses.entries()).sort((a, b) => b[1] - a[1]);

  // 1. Приветствие / Помощь
  if (
    query.includes('привет') ||
    query.includes('здравствуй') ||
    query.includes('кто ты') ||
    query.includes('что ты умеешь') ||
    query === 'помощь'
  ) {
    return `### Привет! Я твой финансовый ИИ-ассистент в Finflow 📊

Я анализирую ваши счета, доходы и расходы в реальном времени, помогая оптимизировать бюджет и достигать финансовых целей.

**Чем я могу помочь прямо сейчас:**
* **Анализ расходов**: расчет трат за текущий период, разбивка по категориям и динамика.
* **Сводка по счетам**: текущие остатки, распределение активов по картам, вкладам и валютам.
* **Поиск аномалий и оптимизация**: выявление крупнейших трат, расчет среднего чека и рекомендации по экономии.
* **Финансовое планирование**: расчет нормы сбережений и правила 50/30/20.

*Задайте любой вопрос или выберите одну из быстрых подсказок ниже!*`;
  }

  // 2. Расходы / Траты / Анализ за месяц
  if (
    query.includes('расход') ||
    query.includes('потратил') ||
    query.includes('трат') ||
    query.includes('статистик') ||
    query.includes('анализ')
  ) {
    if (expenseOps.length === 0) {
      return `### 📉 Анализ расходов

На данный момент в системе не зафиксировано расходных операций. 

Вы можете добавить первые операции в разделе **«Операции»**, чтобы я мог подготовить детальный аналитический отчет.`;
    }

    const topCategory = sortedCategories[0];
    const topCategoryPercent = totalExpense > 0 && topCategory
      ? Math.round((topCategory[1] / totalExpense) * 100)
      : 0;

    let response = `### 📊 Анализ расходов за текущий период\n\n`;
    response += `* **Всего израсходовано:** \`${formatCurrency(totalExpense, 'RUB')}\`\n`;
    response += `* **Всего операций расхода:** \`${expenseOps.length}\`\n`;
    if (topCategory) {
      response += `* **Главная статья расходов:** **${topCategory[0]}** (${formatCurrency(topCategory[1], 'RUB')}, **${topCategoryPercent}%** от всех трат)\n\n`;
    }

    response += `#### 🏷️ Распределение по категориям:\n\n`;
    response += `| Категория | Сумма | Доля |\n`;
    response += `| :--- | :--- | :--- |\n`;

    sortedCategories.forEach(([catName, amount]) => {
      const share = totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : '0';
      response += `| **${catName}** | \`${formatCurrency(amount, 'RUB')}\` | \`${share}%\` |\n`;
    });

    response += `\n> **💡 Рекомендация:** Обратите внимание на категорию **${topCategory?.[0] || 'основных трат'}**. Снижение необязательных расходов в ней всего на 10% позволит высвобождать до \`${formatCurrency((topCategory?.[1] || 0) * 0.1, 'RUB')}\` ежемесячно.`;

    return response;
  }

  // 3. Баланс и счета
  if (
    query.includes('баланс') ||
    query.includes('счет') ||
    query.includes('деньги') ||
    query.includes('сколько у меня') ||
    query.includes('остаток')
  ) {
    if (accounts.length === 0) {
      return `### 💳 Сводка по счетам\n\nУ вас пока нет созданных счетов. Вы можете добавить их в разделе **«Счета»**.`;
    }

    let response = `### 💳 Состояние счетов и активов\n\n`;
    response += `* **Совокупный баланс (RUB):** \`${formatCurrency(totalBalance, 'RUB')}\`\n`;
    response += `* **Активных счетов:** \`${accounts.length}\`\n\n`;

    response += `#### 📋 Список счетов:\n\n`;
    response += `| Счет | Тип | Валюта | Баланс |\n`;
    response += `| :--- | :--- | :--- | :--- |\n`;

    accounts.forEach((acc) => {
      response += `| **${acc.name}** | ${acc.type} | \`${acc.currency}\` | \`${formatCurrency(acc.balance, acc.currency)}\` |\n`;
    });

    response += `\n> **📌 Статус ликвидности:** Ваши средства распределены по ${accounts.length} счетам. Рекомендуется держать резервный фонд в размере 3–6 месячных расходов на высоколиквидных накопительных счетах.`;

    return response;
  }

  // 4. Крупные траты / Топ расходов / Средний чек
  if (
    query.includes('крупн') ||
    query.includes('топ') ||
    query.includes('средн') ||
    query.includes('больш') ||
    query.includes('макс')
  ) {
    const sortedOps = [...expenseOps].sort(
      (a, b) => Math.abs(parseFloat(b.amount) || 0) - Math.abs(parseFloat(a.amount) || 0)
    );

    const top5 = sortedOps.slice(0, 5);
    const avgCheck = expenseOps.length > 0 ? totalExpense / expenseOps.length : 0;

    let response = `### 🔍 Крупнейшие расходы и средний чек\n\n`;
    response += `* **Средний чек расхода:** \`${formatCurrency(avgCheck, 'RUB')}\`\n`;
    response += `* **Всего расходных транзакций:** \`${expenseOps.length}\`\n\n`;

    if (top5.length > 0) {
      response += `#### 🏆 Топ-${top5.length} крупнейших списаний:\n\n`;
      response += `| Дата | Описание | Категория | Сумма |\n`;
      response += `| :--- | :--- | :--- | :--- |\n`;

      top5.forEach((op) => {
        const cat = categoryMap.get(op.category_id)?.name || '—';
        response += `| ${formatDate(op.date)} | ${op.description || 'Без описания'} | ${cat} | \`${formatCurrency(Math.abs(parseFloat(op.amount)), 'RUB')}\` |\n`;
      });
    }

    return response;
  }

  // 5. Советы по экономии / Оптимизация / Накопления
  if (
    query.includes('совет') ||
    query.includes('эконом') ||
    query.includes('накоп') ||
    query.includes('оптимиз') ||
    query.includes('бюджет') ||
    query.includes('цель')
  ) {
    const netCashFlow = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((netCashFlow / totalIncome) * 100) : 0;

    return `### 💡 Персональные финансовые рекомендации

На основе анализа текущего денежного потока в Finflow:

1. **Правило 50 / 30 / 20:**
   * **50% — Базовые потребности** (продукты, жилье, транспорт, обязательные платежи).
   * **30% — Желания и образ жизни** (кафе, развлечения, хобби).
   * **20% — Сбережения и инвестиции** (пополнение подушки безопасности, вклады).

2. **Финансовая подушка безопасности:**
   * Рекомендуемый объем: \`${formatCurrency(totalExpense > 0 ? totalExpense * 3 : 150000, 'RUB')}\` (3 месяца текущих расходов).
   * Хранить на накопительном счете с ежедневным начислением процентов для защиты от инфляции.

3. **Текущие метрики потока:**
   * **Доходы:** \`${formatCurrency(totalIncome, 'RUB')}\`
   * **Расходы:** \`${formatCurrency(totalExpense, 'RUB')}\`
   * **Чистый остаток:** \`${formatCurrency(netCashFlow, 'RUB')}\` ${totalIncome > 0 ? `(норма сбережений: **${savingsRate}%**)` : ''}

> 🎯 **Следующий шаг:** Настройте регулярный автоматический перевод 10–15% от любого дохода на накопительный счет сразу в день поступления средств.`;
  }

  // 6. Дефолтный интеллектуальный ответ
  return `### 💬 Анализ вашего запроса

Вы спросили: *«${userQuery}»*

На основе текущих данных в Finflow:
* **Совокупный баланс:** \`${formatCurrency(totalBalance, 'RUB')}\` на **${accounts.length}** счетах.
* **Зафиксированные расходы:** \`${formatCurrency(totalExpense, 'RUB')}\` (${expenseOps.length} операций).
* **Зафиксированные доходы:** \`${formatCurrency(totalIncome, 'RUB')}\` (${incomeOps.length} операций).

Вы можете уточнить вопрос, например:
* *«Покажи подробный отчет по расходам»*
* *«Какой у меня остаток на картах?»*
* *«Какие 3 самые большие траты были недавно?»*
* *«Как мне оптимизировать бюджет?»*`;
}
