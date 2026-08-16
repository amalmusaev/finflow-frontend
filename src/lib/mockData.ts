export const accounts = [
  { id: '1', name: 'Наличные', type: 'cash', balance: 15000.0, currency: 'RUB' },
  { id: '2', name: 'Tinkoff Black', type: 'card', balance: 125400.5, currency: 'RUB' },
  { id: '3', name: 'Сбербанк Зарплатный', type: 'bank', balance: 54000.0, currency: 'RUB' },
  { id: '4', name: 'Накопительный счет', type: 'deposit', balance: 500000.0, currency: 'RUB' },
  { id: '5', name: 'USD Cash', type: 'cash', balance: 1200.0, currency: 'USD' },
];

export const categories = [
  { id: '1', name: 'Продукты', type: 'expense' },
  { id: '2', name: 'Транспорт', type: 'expense' },
  { id: '3', name: 'Развлечения', type: 'expense' },
  { id: '4', name: 'Зарплата', type: 'income' },
  { id: '5', name: 'Переводы', type: 'income' },
];

export const transactions = [
  { id: 't1', date: '2026-08-09T10:00:00Z', amount: -1500, categoryId: '1', accountId: '2', description: 'Перекресток' },
  { id: 't2', date: '2026-08-08T18:30:00Z', amount: -450, categoryId: '2', accountId: '2', description: 'Такси Яндекс' },
  { id: 't3', date: '2026-08-05T09:00:00Z', amount: 150000, categoryId: '4', accountId: '3', description: 'Аванс за август' },
  { id: 't4', date: '2026-08-06T12:15:00Z', amount: -25000, categoryId: '5', accountId: '3', description: 'Перевод маме' },
  { id: 't5', date: '2026-08-07T20:00:00Z', amount: -3500, categoryId: '3', accountId: '1', description: 'Ресторан' },
];
