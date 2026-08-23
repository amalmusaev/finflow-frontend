export const accounts = [
  { id: '1', name: 'Наличные', type: 'cash', balance: 15000.0, currency: 'RUB' },
  { id: '2', name: 'Tinkoff Black', type: 'card', balance: 125400.5, currency: 'RUB' },
  { id: '3', name: 'Сбербанк Зарплатный', type: 'bank', balance: 84000.0, currency: 'RUB' },
  { id: '4', name: 'Накопительный счет', type: 'deposit', balance: 500000.0, currency: 'RUB' },
  { id: '5', name: 'USD Cash', type: 'cash', balance: 1200.0, currency: 'USD' },
];

export const categories = [
  { id: '1', name: 'Продукты', type: 'expense' },
  { id: '2', name: 'Транспорт', type: 'expense' },
  { id: '3', name: 'Кафе и рестораны', type: 'expense' },
  { id: '4', name: 'Зарплата', type: 'income' },
  { id: '5', name: 'Переводы и близким', type: 'expense' },
  { id: '6', name: 'Подписки и сервисы', type: 'expense' },
  { id: '7', name: 'Покупки и техника', type: 'expense' },
  { id: '8', name: 'Здоровье и аптеки', type: 'expense' },
  { id: '9', name: 'ЖКХ и связь', type: 'expense' },
  { id: '10', name: 'Фриланс и проекты', type: 'income' },
  { id: '11', name: 'Проценты по вкладу', type: 'income' },
];

export const transactions = [
  // Август 2026
  { id: 't-aug-15', date: '2026-08-20T14:30:00Z', amount: -2890, categoryId: '1', accountId: '2', description: 'ВкусВилл — Продукты' },
  { id: 't-aug-14', date: '2026-08-18T19:00:00Z', amount: -1750, categoryId: '3', accountId: '2', description: 'Кофейня Surf Coffee' },
  { id: 't-aug-13', date: '2026-08-16T11:20:00Z', amount: -650, categoryId: '2', accountId: '2', description: 'Яндекс Go Такси' },
  { id: 't-aug-12', date: '2026-08-15T16:00:00Z', amount: 45000, categoryId: '10', accountId: '2', description: 'Оплата за UI/UX аудит' },
  { id: 't-aug-11', date: '2026-08-14T10:00:00Z', amount: -4200, categoryId: '8', accountId: '2', description: 'Аптека 36.6 — Витамины' },
  { id: 't-aug-10', date: '2026-08-12T13:40:00Z', amount: -1990, categoryId: '6', accountId: '2', description: 'Яндекс Плюс + Музыка' },
  { id: 't-aug-9', date: '2026-08-10T15:00:00Z', amount: 4800, categoryId: '11', accountId: '4', description: 'Выплата процентов по вкладу' },
  { id: 't-aug-8', date: '2026-08-09T10:00:00Z', amount: -1500, categoryId: '1', accountId: '2', description: 'Перекресток — Еда' },
  { id: 't-aug-7', date: '2026-08-08T18:30:00Z', amount: -450, categoryId: '2', accountId: '2', description: 'Такси Ситимобил' },
  { id: 't-aug-6', date: '2026-08-07T20:00:00Z', amount: -3500, categoryId: '3', accountId: '1', description: 'Ужин в ресторане' },
  { id: 't-aug-5', date: '2026-08-06T12:15:00Z', amount: -25000, categoryId: '5', accountId: '3', description: 'Перевод родителям' },
  { id: 't-aug-4', date: '2026-08-05T09:00:00Z', amount: 165000, categoryId: '4', accountId: '3', description: 'Аванс / Зарплата за август' },
  { id: 't-aug-3', date: '2026-08-04T17:10:00Z', amount: -5800, categoryId: '9', accountId: '2', description: 'ЖКУ и квартплата' },
  { id: 't-aug-2', date: '2026-08-02T14:00:00Z', amount: -12900, categoryId: '7', accountId: '2', description: 'Наушники беспроводные' },
  { id: 't-aug-1', date: '2026-08-01T11:00:00Z', amount: -3400, categoryId: '1', accountId: '2', description: 'Ашан — Закупка на неделю' },

  // Июль 2026
  { id: 't-jul-10', date: '2026-07-28T18:00:00Z', amount: -4100, categoryId: '1', accountId: '2', description: 'Лента — Продукты' },
  { id: 't-jul-9', date: '2026-07-25T15:30:00Z', amount: 35000, categoryId: '10', accountId: '2', description: 'Фриланс дизайн-система' },
  { id: 't-jul-8', date: '2026-07-22T20:45:00Z', amount: -4800, categoryId: '3', accountId: '1', description: 'Ресторан с друзьями' },
  { id: 't-jul-7', date: '2026-07-20T10:00:00Z', amount: 4800, categoryId: '11', accountId: '4', description: 'Капитализация вклада' },
  { id: 't-jul-6', date: '2026-07-16T12:00:00Z', amount: -1500, categoryId: '2', accountId: '2', description: 'Заправка Лукойл' },
  { id: 't-jul-5', date: '2026-07-12T14:30:00Z', amount: -18500, categoryId: '7', accountId: '2', description: 'Монитор 4K для работы' },
  { id: 't-jul-4', date: '2026-07-08T19:20:00Z', amount: -3200, categoryId: '1', accountId: '2', description: 'ВкусВилл' },
  { id: 't-jul-3', date: '2026-07-05T09:00:00Z', amount: 165000, categoryId: '4', accountId: '3', description: 'Зарплата за июль' },
  { id: 't-jul-2', date: '2026-07-03T11:00:00Z', amount: -5600, categoryId: '9', accountId: '2', description: 'ЖКХ Июль' },
  { id: 't-jul-1', date: '2026-07-01T16:00:00Z', amount: -20000, categoryId: '5', accountId: '3', description: 'Перевод родителям' },

  // Июнь 2026
  { id: 't-jun-8', date: '2026-06-27T17:00:00Z', amount: -3800, categoryId: '1', accountId: '2', description: 'Продукты SPAR' },
  { id: 't-jun-7', date: '2026-06-22T19:30:00Z', amount: -5200, categoryId: '3', accountId: '2', description: 'Праздничный ужин' },
  { id: 't-jun-6', date: '2026-06-18T10:00:00Z', amount: 4800, categoryId: '11', accountId: '4', description: 'Проценты по депозиту' },
  { id: 't-jun-5', date: '2026-06-15T14:00:00Z', amount: 50000, categoryId: '10', accountId: '2', description: 'Проект веб-приложения' },
  { id: 't-jun-4', date: '2026-06-12T16:15:00Z', amount: -8500, categoryId: '8', accountId: '2', description: 'Стоматология чек' },
  { id: 't-jun-3', date: '2026-06-08T11:00:00Z', amount: -4100, categoryId: '1', accountId: '2', description: 'Ашан закупка' },
  { id: 't-jun-2', date: '2026-06-05T09:00:00Z', amount: 165000, categoryId: '4', accountId: '3', description: 'Зарплата за июнь' },
  { id: 't-jun-1', date: '2026-06-02T13:00:00Z', amount: -20000, categoryId: '5', accountId: '3', description: 'Помощь семье' },
];

