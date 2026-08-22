import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Wallet, ArrowLeftRight, Settings as SettingsIcon, PanelLeftClose, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { isMockMode } from '../api';

export function Layout() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('finflow_sidebar_collapsed');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('finflow_sidebar_collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const navItems = [
    { name: 'Операции', path: '/', icon: ArrowLeftRight },
    { name: 'Счета', path: '/accounts', icon: Wallet },
    { name: 'ИИ-Ассистент', path: '/chat', icon: Sparkles },
    { name: 'Настройки', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-mono-50">
      <aside className={cn(
        "bg-mono-100 border-r border-mono-200 flex flex-col transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <div className={cn("p-6 flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
          {!isCollapsed && <h1 className="text-2xl font-bold text-mono-900 tracking-tight whitespace-nowrap overflow-hidden">Finflow</h1>}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="p-1.5 rounded-md hover:bg-mono-200 text-mono-500 transition-colors"
            title={isCollapsed ? "Развернуть меню" : "Свернуть меню"}
          >
            <PanelLeftClose className={cn("w-5 h-5 transition-transform duration-300", isCollapsed && "rotate-180")} />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors whitespace-nowrap overflow-hidden",
                  isActive 
                    ? "bg-mono-200 text-mono-900 font-medium" 
                    : "text-mono-600 hover:bg-mono-200/50 hover:text-mono-900",
                  isCollapsed && "justify-center px-0"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
        
        {isMockMode && !isCollapsed && (
          <div className="p-4 px-6 text-mono-400 font-mono text-xs select-none">
            Mock Mode
          </div>
        )}
      </aside>
      <main className="flex-1 overflow-auto bg-mono-50">
        <Outlet />
      </main>
    </div>
  );
}
