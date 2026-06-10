import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, 
  CalendarDays, 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X,
  ChevronRight,
  Calendar,
  Clock,
  PieChart
} from 'lucide-react';

const DAYS_OF_WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const QUARTER_MONTHS = ['1-й месяц квартала', '2-й месяц квартала', '3-й месяц квартала'];

// Цветовая гамма маркеров как на скриншоте "123.jpg" для разделения категорий
const COLOR_PALETTE = [
  '#5B50F2', // Ультрамарин / Индиго
  '#30B0C7', // Бирюзовый
  '#4ADE80', // Салатовый / Зеленый
  '#FF9500', // Оранжевый
  '#FF3B30', // Красный
];

const INITIAL_TEMPLATES = [
  { id: '1', name: 'Ипотека / Аренда', amount: 48000, period: 'Ежемесячно', day: '5', color: '#5B50F2' },
  { id: '2', name: 'Коммунальные услуги', amount: 6200, period: 'Ежемесячно', day: '10', color: '#30B0C7' },
  { id: '3', name: 'Интернет и связь', amount: 950, period: 'Еженедельно', dayOfWeek: 'Пн', color: '#4ADE80' },
  { id: '4', name: 'Страховка авто', amount: 12000, period: 'Ежеквартально', day: '15', monthInQuarter: '1-й месяц квартала', color: '#FF9500' },
  { id: '5', name: 'Налог на имущество', amount: 4500, period: 'Ежегодно', day: '20', monthOfYear: 'Ноябрь', color: '#FF3B30' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'month' | 'registry'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  
  // Переключатель фильтра на вкладке списка (по аналогии со слайдером "Мне должны / Я должен" из 123.jpg)
  const [monthFilter, setMonthFilter] = useState('all'); // 'all' | 'pending' | 'completed'

  // --- Состояния данных ---
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('saldo_templates');
    return saved ? JSON.parse(saved) : INITIAL_TEMPLATES;
  });

  const [monthlyPayments, setMonthlyPayments] = useState(() => {
    const saved = localStorage.getItem('saldo_monthly');
    if (saved) return JSON.parse(saved);
    
    // Генерация дефолтных платежей на основе шаблонов
    return INITIAL_TEMPLATES.map((t, idx) => ({
      id: `m-${t.id}`,
      templateId: t.id,
      name: t.name,
      amount: t.amount,
      day: t.period === 'Еженедельно' ? t.dayOfWeek : t.day,
      completed: false,
      color: t.color || COLOR_PALETTE[idx % COLOR_PALETTE.length]
    }));
  });

  const [currentTemplate, setCurrentTemplate] = useState({
    id: '',
    name: '',
    amount: '',
    period: 'Ежемесячно',
    day: '1',
    dayOfWeek: 'Пн',
    monthOfYear: 'Январь',
    monthInQuarter: '1-й месяц квартала',
    color: '#5B50F2'
  });

  useEffect(() => {
    localStorage.setItem('saldo_templates', JSON.stringify(templates));
    localStorage.setItem('saldo_monthly', JSON.stringify(monthlyPayments));
  }, [templates, monthlyPayments]);

  const stats = useMemo(() => {
    const total = monthlyPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const paid = monthlyPayments.filter(p => p.completed).reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = total - paid;
    const percent = total > 0 ? Math.round((paid / total) * 100) : 0;
    
    // Подготовка сегментов для круговой диаграммы (как на экране Статистика в 123.jpg)
    // Группируем по платежам, чтобы показать долю каждого
    let currentOffset = 0;
    const chartSegments = monthlyPayments.map((p) => {
      const share = total > 0 ? (Number(p.amount) / total) * 100 : 0;
      const segment = {
        id: p.id,
        name: p.name,
        amount: p.amount,
        share: Math.round(share),
        color: p.color || '#5B50F2',
        offset: currentOffset,
        completed: p.completed
      };
      currentOffset += share;
      return segment;
    });

    return { total, paid, remaining, percent, segments: chartSegments };
  }, [monthlyPayments]);

  const generateMonthlyFromTemplates = (allTemplates) => {
    const newMonthly = allTemplates.map((t, idx) => {
      // Ищем старый платеж, чтобы сохранить статус отметки "Выполнено"
      const existing = monthlyPayments.find(p => p.templateId === t.id);
      return {
        id: `m-${t.id}`,
        templateId: t.id,
        name: t.name,
        amount: Number(t.amount),
        day: t.period === 'Еженедельно' ? t.dayOfWeek : t.day,
        completed: existing ? existing.completed : false,
        color: t.color || COLOR_PALETTE[idx % COLOR_PALETTE.length]
      };
    });
    setMonthlyPayments(newMonthly);
  };

  const handleSaveTemplate = (e) => {
    e.preventDefault();
    const newId = modalMode === 'create' ? Date.now().toString() : currentTemplate.id;
    const randomColor = COLOR_PALETTE[templates.length % COLOR_PALETTE.length];
    
    const templateData = { 
      ...currentTemplate, 
      id: newId, 
      amount: Number(currentTemplate.amount),
      color: currentTemplate.color || randomColor
    };

    let updatedTemplates;
    if (modalMode === 'create') {
      updatedTemplates = [...templates, templateData];
    } else {
      updatedTemplates = templates.map(t => t.id === newId ? templateData : t);
    }

    setTemplates(updatedTemplates);
    setIsModalOpen(false);
    
    // Синхронизируем список на месяц мгновенно
    const newMonthly = updatedTemplates.map((t, idx) => {
      const existing = monthlyPayments.find(p => p.templateId === t.id);
      return {
        id: `m-${t.id}`,
        templateId: t.id,
        name: t.name,
        amount: Number(t.amount),
        day: t.period === 'Еженедельно' ? t.dayOfWeek : t.day,
        completed: existing ? existing.completed : false,
        color: t.color || COLOR_PALETTE[idx % COLOR_PALETTE.length]
      };
    });
    setMonthlyPayments(newMonthly);
  };

  const deleteTemplate = (id) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    setMonthlyPayments(prev => prev.filter(p => p.templateId !== id));
  };

  const toggleComplete = (id) => {
    setMonthlyPayments(prev => prev.map(p => 
      p.id === id ? { ...p, completed: !p.completed } : p
    ));
  };

  // Сортировка списка на месяц: невыполненные выше (по возрастанию дат), выполненные в самом низу
  const sortedMonthly = useMemo(() => {
    const sorted = [...monthlyPayments].sort((a, b) => {
      // Сначала разделяем по признаку выполнения
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      // Внутри групп сортируем по дате (попроще, числом)
      const dayA = parseInt(a.day) || 0;
      const dayB = parseInt(b.day) || 0;
      return dayA - dayB;
    });

    // Применяем фильтр по аналогии со вкладками "Мне должны / Я должен" из 123.jpg
    if (monthFilter === 'pending') {
      return sorted.filter(p => !p.completed);
    }
    if (monthFilter === 'completed') {
      return sorted.filter(p => p.completed);
    }
    return sorted;
  }, [monthlyPayments, monthFilter]);

  return (
    <div className="min-h-screen bg-[#F0F2F6] text-[#111214] flex justify-center font-sans antialiased">
      {/* Имитация премиального смартфона, идеально повторяющего интерфейс Saldo */}
      <div className="w-full max-w-md bg-white min-h-screen shadow-[0_24px_64px_-16px_rgba(0,0,0,0.15)] flex flex-col relative pb-28 overflow-hidden rounded-none md:rounded-[40px] md:my-6 md:min-h-[840px] md:max-h-[900px]">
        
        {/* ШАПКА ПРИЛОЖЕНИЯ В СТИЛЕ SALDO */}
        <header className="px-6 pt-6 pb-4 bg-white flex justify-between items-center border-b border-[#F0F2F6]">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#1A1C1F]">
              {activeTab === 'home' && 'Статистика'}
              {activeTab === 'month' && 'План месяца'}
              {activeTab === 'registry' && 'Реестр платежей'}
            </h1>
            <p className="text-xs text-[#8E939F] font-semibold mt-0.5">
              {new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="h-10 w-10 bg-[#F4F6FB] rounded-full flex items-center justify-center border border-[#E9ECEF] shadow-sm">
            <span className="text-sm font-bold text-[#5B50F2]">₽</span>
          </div>
        </header>

        {/* ОСНОВНОЙ КОНТЕНТ */}
        <main className="flex-1 px-5 py-4 overflow-y-auto bg-[#F6F8FC]">
          
          {/* ==================== ВКЛАДКА 1: СТАТУС / СТАТИСТИКА ==================== */}
          {activeTab === 'home' && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* Кольцевой прогресс-бар и финансовые метрики в стиле 123.jpg */}
              <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.03)] border border-[#EFF2F7] flex flex-col items-center">
                
                {/* Легендарный круговой секторный график как в Saldo */}
                <div className="relative w-44 h-44 flex items-center justify-center mb-6 mt-2">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    {/* Фоновая серая подложка */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F1F3F7" strokeWidth="3.2" />
                    
                    {/* Цветные сегменты на основе структуры расходов */}
                    {stats.segments.map((seg, i) => (
                      <circle
                        key={seg.id}
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="none"
                        stroke={seg.completed ? '#E2E8F0' : seg.color}
                        strokeWidth="3.5"
                        strokeDasharray={`${seg.share} ${100 - seg.share}`}
                        strokeDashoffset={100 - seg.offset}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    ))}
                  </svg>
                  
                  {/* Контент внутри кольца */}
                  <div className="absolute text-center flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase tracking-wider text-[#8E939F] font-bold">Осталось оплатить</span>
                    <span className="text-xl font-black mt-1 text-[#1A1C1F]">
                      {stats.remaining.toLocaleString()} ₽
                    </span>
                    <div className="mt-2 px-2.5 py-0.5 bg-[#EEF2FF] rounded-full">
                      <span className="text-[10px] font-bold text-[#5B50F2]">{stats.percent}% готово</span>
                    </div>
                  </div>
                </div>

                {/* Быстрая статистика в 2 колонки */}
                <div className="w-full grid grid-cols-2 gap-4 pt-4 border-t border-[#F2F4F7]">
                  <div className="text-center border-r border-[#F2F4F7]">
                    <span className="text-[10px] uppercase text-[#8E939F] font-bold block">Оплачено</span>
                    <span className="text-base font-extrabold text-[#4ADE80] mt-1 block">
                      {stats.paid.toLocaleString()} ₽
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] uppercase text-[#8E939F] font-bold block">Всего</span>
                    <span className="text-base font-extrabold text-[#1A1C1F] mt-1 block">
                      {stats.total.toLocaleString()} ₽
                    </span>
                  </div>
                </div>
              </div>

              {/* Легенда категорий как на скриншоте 123.jpg */}
              <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.02)] border border-[#EFF2F7] space-y-3.5">
                <h3 className="text-xs font-black text-[#8E939F] uppercase tracking-wider mb-1">Структура платежей</h3>
                
                {stats.segments.map((seg) => (
                  <div key={seg.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Цветной маркер как на скриншоте */}
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }}></span>
                      <span className={`text-sm font-bold ${seg.completed ? 'text-[#8E939F] line-through' : 'text-[#1A1C1F]'}`}>
                        {seg.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-[#1A1C1F]">{seg.amount.toLocaleString()} ₽</span>
                      <span className="text-xs text-[#8E939F] ml-2 font-medium">{seg.share}%</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ==================== ВКЛАДКА 2: СПИСОК НА МЕСЯЦ ==================== */}
          {activeTab === 'month' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Пилюля-фильтр в стиле "Мне должны / Я должен" из 123.jpg */}
              <div className="bg-[#E9ECEF] p-1 rounded-2xl flex items-center justify-between shadow-inner">
                <button 
                  onClick={() => setMonthFilter('all')}
                  className={`flex-1 py-2 text-center text-xs font-extrabold rounded-xl transition-all duration-300 ${monthFilter === 'all' ? 'bg-white text-black shadow-sm' : 'text-[#6C727A]'}`}
                >
                  Все
                </button>
                <button 
                  onClick={() => setMonthFilter('pending')}
                  className={`flex-1 py-2 text-center text-xs font-extrabold rounded-xl transition-all duration-300 ${monthFilter === 'pending' ? 'bg-white text-black shadow-sm' : 'text-[#6C727A]'}`}
                >
                  Ожидают
                </button>
                <button 
                  onClick={() => setMonthFilter('completed')}
                  className={`flex-1 py-2 text-center text-xs font-extrabold rounded-xl transition-all duration-300 ${monthFilter === 'completed' ? 'bg-white text-black shadow-sm' : 'text-[#6C727A]'}`}
                >
                  Оплачено
                </button>
              </div>

              {/* Список платежей */}
              <div className="space-y-3">
                {sortedMonthly.map((payment) => (
                  <div 
                    key={payment.id} 
                    className={`bg-white rounded-[24px] p-5 border transition-all duration-300 flex items-center justify-between ${
                      payment.completed 
                        ? 'border-transparent bg-opacity-70 shadow-none' 
                        : 'border-[#F0F2F6] shadow-[0_8px_24px_rgba(0,0,0,0.02)] hover:border-[#E2E8F0]'
                    }`}
                  >
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      
                      {/* Интерактивный Чекбокс - ЗЕЛЕНЫЙ ПРИ АКТИВНОСТИ */}
                      <button 
                        onClick={() => toggleComplete(payment.id)}
                        className={`w-7 h-7 rounded-xl flex items-center justify-center border-2 transition-all duration-300 shrink-0 ${
                          payment.completed 
                            ? 'bg-[#4ADE80] border-[#4ADE80] text-white shadow-[0_4px_12px_rgba(74,222,128,0.3)]' 
                            : 'border-[#D1D5DB] bg-white hover:border-black'
                        }`}
                      >
                        {payment.completed && <Check size={18} strokeWidth={4} />}
                      </button>

                      {/* Текст со стилизацией */}
                      <div className="min-w-0">
                        <p className={`text-sm font-bold leading-tight truncate transition-all ${
                          payment.completed ? 'line-through text-[#8E939F]' : 'text-[#1A1C1F]'
                        }`}>
                          {payment.name}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {/* Маленькая точка цвета категории */}
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: payment.color }}></span>
                          <span className="text-[10px] text-[#8E939F] font-bold uppercase">
                            День: {payment.day}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Сумма */}
                    <p className={`text-base font-black ${
                      payment.completed ? 'text-[#8E939F]' : 'text-[#1A1C1F]'
                    }`}>
                      {payment.amount.toLocaleString()} ₽
                    </p>
                  </div>
                ))}

                {sortedMonthly.length === 0 && (
                  <div className="text-center py-16">
                    <Calendar className="w-12 h-12 text-[#A0A5AB] mx-auto mb-3 stroke-[1.5]" />
                    <p className="text-sm font-bold text-[#1A1C1F]">Список пуст</p>
                    <p className="text-xs text-[#8E939F] mt-1">Нет платежей, соответствующих выбранному фильтру.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== ВКЛАДКА 3: РЕЕСТР ПЛАТЕЖЕЙ ==================== */}
          {activeTab === 'registry' && (
            <div className="space-y-4 animate-fadeIn">
              
              <button 
                onClick={() => { 
                  setModalMode('create'); 
                  setCurrentTemplate({
                    id: '',
                    name: '',
                    amount: '',
                    period: 'Ежемесячно',
                    day: '1',
                    dayOfWeek: 'Пн',
                    monthOfYear: 'Январь',
                    monthInQuarter: '1-й месяц квартала',
                    color: COLOR_PALETTE[templates.length % COLOR_PALETTE.length]
                  });
                  setIsModalOpen(true); 
                }}
                className="w-full py-4 rounded-[24px] bg-[#5B50F2] hover:bg-[#483DD4] text-white font-black text-sm flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(91,80,242,0.25)] active:scale-95 transition-transform"
              >
                <Plus size={18} strokeWidth={3} /> Новый шаблон
              </button>

              <div className="space-y-3">
                {templates.map((t) => (
                  <div key={t.id} className="bg-white border border-[#EFF2F7] rounded-[24px] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.02)]">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-3">
                        {/* Индикатор цвета шаблона */}
                        <span className="w-3 h-3 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: t.color || '#5B50F2' }}></span>
                        <div>
                          <h4 className="font-bold text-sm text-[#1A1C1F]">{t.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black bg-[#F2F4F7] px-2 py-0.5 rounded-md uppercase text-[#6C727A]">{t.period}</span>
                            <span className="text-[10px] text-[#8E939F] font-bold">
                              {t.period === 'Еженедельно' && `Каждый ${t.dayOfWeek}`}
                              {t.period === 'Ежемесячно' && `${t.day}-е число`}
                              {t.period === 'Ежеквартально' && `${t.day}-е число (${t.monthInQuarter})`}
                              {t.period === 'Ежегодно' && `${t.day} ${t.monthOfYear}`}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Кнопка быстрого удаления */}
                      <button 
                        onClick={() => deleteTemplate(t.id)} 
                        className="p-1.5 text-[#FF3B30] hover:bg-red-50 rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#F2F4F7] flex justify-between items-center">
                      <p className="font-black text-base text-[#1A1C1F]">{t.amount.toLocaleString()} ₽</p>
                      <button 
                        onClick={() => { 
                          setCurrentTemplate(t); 
                          setModalMode('edit'); 
                          setIsModalOpen(true); 
                        }} 
                        className="text-xs font-bold text-[#5B50F2] bg-[#EEF2FF] px-3 py-1.5 rounded-xl hover:bg-[#E0E7FF] transition-all"
                      >
                        Изменить
                      </button>
                    </div>
                  </div>
                ))}

                {templates.length === 0 && (
                  <div className="text-center py-16">
                    <FileText className="w-12 h-12 text-[#A0A5AB] mx-auto mb-3 stroke-[1.5]" />
                    <p className="text-sm font-bold text-[#1A1C1F]">Шаблоны отсутствуют</p>
                    <p className="text-xs text-[#8E939F] mt-1">Создайте шаблон, чтобы он появился в плане месяца.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* ==================== НИЖНЯЯ ПАНЕЛЬ НАВИГАЦИИ (СТИЛЬ SALDO, БЕЗ НАДПИСЕЙ) ==================== */}
        <nav className="absolute bottom-0 w-full h-20 bg-white border-t border-[#F0F2F6] flex justify-around items-center px-8 pb-4 z-30 shadow-[0_-8px_24px_rgba(0,0,0,0.02)]">
          
          <button 
            onClick={() => setActiveTab('home')} 
            className={`p-3 rounded-2xl transition-all duration-300 ${activeTab === 'home' ? 'bg-[#5B50F2] text-white shadow-[0_8px_20px_rgba(91,80,242,0.3)] scale-110' : 'text-[#A0A5AB] hover:text-[#1A1C1F]'}`}
          >
            <Home size={22} strokeWidth={2.5} />
          </button>
          
          <button 
            onClick={() => setActiveTab('month')} 
            className={`p-3 rounded-2xl transition-all duration-300 ${activeTab === 'month' ? 'bg-[#5B50F2] text-white shadow-[0_8px_20px_rgba(91,80,242,0.3)] scale-110' : 'text-[#A0A5AB] hover:text-[#1A1C1F]'}`}
          >
            <CalendarDays size={22} strokeWidth={2.5} />
          </button>
          
          <button 
            onClick={() => setActiveTab('registry')} 
            className={`p-3 rounded-2xl transition-all duration-300 ${activeTab === 'registry' ? 'bg-[#5B50F2] text-white shadow-[0_8px_20px_rgba(91,80,242,0.3)] scale-110' : 'text-[#A0A5AB] hover:text-[#1A1C1F]'}`}
          >
            <FileText size={22} strokeWidth={2.5} />
          </button>

        </nav>

        {/* Имитатор системного нижнего индикатора для полного соответствия */}
        <div className="absolute bottom-1 w-full flex justify-center pointer-events-none z-40">
          <div className="w-32 h-1 bg-[#1A1C1F] rounded-full opacity-20"></div>
        </div>

        {/* ==================== УМНОЕ МОДАЛЬНОЕ ОКНО СОЗДАНИЯ/ИЗМЕНЕНИЯ ==================== */}
        {isModalOpen && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-end animate-fadeIn">
            <div className="bg-white w-full rounded-t-[32px] p-6 pb-10 space-y-5 animate-slideUp max-h-[85vh] overflow-y-auto shadow-[0_-12px_36px_rgba(0,0,0,0.1)]">
              
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-[#1A1C1F]">
                  {modalMode === 'create' ? 'Новый шаблон' : 'Редактирование'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="bg-[#F2F4F7] p-2 rounded-full hover:bg-[#E9ECEF] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveTemplate} className="space-y-4">
                {/* Название */}
                <div>
                  <label className="text-[10px] font-black uppercase text-[#8E939F] mb-1.5 block">Название платежа</label>
                  <input 
                    type="text" 
                    required 
                    value={currentTemplate.name} 
                    onChange={e => setCurrentTemplate({...currentTemplate, name: e.target.value})} 
                    className="w-full bg-[#F4F6FB] border border-[#EFF2F7] rounded-xl p-3.5 font-bold text-sm focus:ring-2 focus:ring-[#5B50F2] outline-none text-[#1A1C1F] placeholder-[#A0A5AB]" 
                    placeholder="Например: Аренда квартиры" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Сумма */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-[#8E939F] mb-1.5 block">Сумма (₽)</label>
                    <input 
                      type="number" 
                      required 
                      value={currentTemplate.amount} 
                      onChange={e => setCurrentTemplate({...currentTemplate, amount: e.target.value})}
                      className="w-full bg-[#F4F6FB] border border-[#EFF2F7] rounded-xl p-3.5 font-bold text-sm focus:ring-2 focus:ring-[#5B50F2] outline-none text-[#1A1C1F]" 
                    />
                  </div>
                  
                  {/* Период */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-[#8E939F] mb-1.5 block">Период</label>
                    <select 
                      value={currentTemplate.period} 
                      onChange={e => setCurrentTemplate({...currentTemplate, period: e.target.value})}
                      className="w-full bg-[#F4F6FB] border border-[#EFF2F7] rounded-xl p-3.5 font-bold text-sm focus:ring-2 focus:ring-[#5B50F2] outline-none text-[#1A1C1F] appearance-none cursor-pointer"
                    >
                      <option>Еженедельно</option>
                      <option>Ежемесячно</option>
                      <option>Ежеквартально</option>
                      <option>Ежегодно</option>
                    </select>
                  </div>
                </div>

                {/* ДИНАМИЧЕСКИЕ НАСТРОЙКИ ДАТЫ ДЛЯ UX 2026 */}
                <div className="bg-[#F8F9FB] p-4 rounded-2xl border border-[#EFF2F7] space-y-3">
                  
                  {/* Сценарий: Еженедельно */}
                  {currentTemplate.period === 'Еженедельно' && (
                    <div>
                      <label className="text-[10px] font-black uppercase text-[#8E939F] mb-2 block text-center">Выберите день недели</label>
                      <div className="flex justify-between gap-1">
                        {DAYS_OF_WEEK.map(d => (
                          <button 
                            key={d} 
                            type="button" 
                            onClick={() => setCurrentTemplate({...currentTemplate, dayOfWeek: d})}
                            className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${currentTemplate.dayOfWeek === d ? 'bg-[#5B50F2] text-white shadow-sm' : 'bg-white text-[#1A1C1F] border border-[#EFF2F7]'}`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                      {/* Индикация неактивности стандартного поля */}
                      <p className="text-[9px] text-[#A0A5AB] text-center mt-2.5">Число месяца неактивно для еженедельных платежей</p>
                    </div>
                  )}

                  {/* Сценарий: Ежегодно */}
                  {currentTemplate.period === 'Ежегодно' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase text-[#8E939F] mb-1.5 block">Месяц года</label>
                        <select 
                          value={currentTemplate.monthOfYear} 
                          onChange={e => setCurrentTemplate({...currentTemplate, monthOfYear: e.target.value})}
                          className="w-full bg-white border border-[#EFF2F7] rounded-lg p-2 text-xs font-bold text-[#1A1C1F]"
                        >
                          {MONTHS.map(m => <option key={m}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-[#8E939F] mb-1.5 block">Число (1-31)</label>
                        <input 
                          type="number" 
                          min="1" 
                          max="31" 
                          value={currentTemplate.day} 
                          onChange={e => setCurrentTemplate({...currentTemplate, day: e.target.value})}
                          className="w-full bg-white border border-[#EFF2F7] rounded-lg p-2 text-xs font-bold text-[#1A1C1F]" 
                        />
                      </div>
                    </div>
                  )}

                  {/* Сценарий: Ежеквартально */}
                  {currentTemplate.period === 'Ежеквартально' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase text-[#8E939F] mb-1.5 block">Месяц в квартале</label>
                        <select 
                          value={currentTemplate.monthInQuarter} 
                          onChange={e => setCurrentTemplate({...currentTemplate, monthInQuarter: e.target.value})}
                          className="w-full bg-white border border-[#EFF2F7] rounded-lg p-2 text-xs font-bold text-[#1A1C1F]"
                        >
                          {QUARTER_MONTHS.map(m => <option key={m}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-[#8E939F] mb-1.5 block">Число (1-31)</label>
                        <input 
                          type="number" 
                          min="1" 
                          max="31" 
                          value={currentTemplate.day} 
                          onChange={e => setCurrentTemplate({...currentTemplate, day: e.target.value})}
                          className="w-full bg-white border border-[#EFF2F7] rounded-lg p-2 text-xs font-bold text-[#1A1C1F]" 
                        />
                      </div>
                    </div>
                  )}

                  {/* Сценарий: Ежемесячно */}
                  {currentTemplate.period === 'Ежемесячно' && (
                    <div>
                      <label className="text-[10px] font-black uppercase text-[#8E939F] mb-1.5 block">Число месяца (1-31)</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="31" 
                        value={currentTemplate.day} 
                        onChange={e => setCurrentTemplate({...currentTemplate, day: e.target.value})}
                        className="w-full bg-white border border-[#EFF2F7] rounded-lg p-2.5 text-xs font-bold text-[#1A1C1F]" 
                      />
                    </div>
                  )}
                </div>

                {/* Выбор цвета категории для соответствия скриншоту 123.jpg */}
                <div>
                  <label className="text-[10px] font-black uppercase text-[#8E939F] mb-2 block">Цветовой маркер</label>
                  <div className="flex gap-2">
                    {COLOR_PALETTE.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCurrentTemplate({...currentTemplate, color: c})}
                        className={`w-7 h-7 rounded-full transition-transform ${currentTemplate.color === c ? 'scale-125 border-2 border-white ring-2 ring-[#5B50F2]' : ''}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-4 rounded-[20px] bg-[#5B50F2] hover:bg-[#483DD4] text-white font-black text-sm shadow-xl active:scale-[0.98] transition-all"
                >
                  Сохранить шаблон
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
