import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Wallet, ArrowLeftRight, Settings as SettingsIcon, PanelLeftClose, BarChart3 } from 'lucide-react';
import { cn } from '../lib/utils';
import { isMockMode } from '../api';
import { Logo } from './Logo';

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
    { name: 'Дашборд', path: '/dashboard', icon: BarChart3 },
    { name: 'Операции', path: '/', icon: ArrowLeftRight },
    { name: 'Счета', path: '/accounts', icon: Wallet },
    { name: 'Настройки', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-mono-50">
      <aside className={cn(
        "bg-mono-50 border-r border-mono-200 flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <div className={cn("p-4 border-b border-mono-200 flex items-center h-16", isCollapsed ? "justify-center" : "justify-between")}>
          {!isCollapsed ? (
            <>
              <Logo className="h-9 w-9 flex-shrink-0" />
              <button 
                onClick={() => setIsCollapsed(true)} 
                className="p-1.5 text-mono-500 hover:text-mono-900 transition-colors rounded-md hover:bg-mono-100 cursor-pointer"
                title="Свернуть меню"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsCollapsed(false)} 
              className="p-1 rounded-md hover:opacity-80 transition-opacity flex items-center justify-center cursor-pointer"
              title="Развернуть меню"
            >
              <Logo className="h-9 w-9 flex-shrink-0" />
            </button>
          )}
        </div>
        <nav className="flex-1 space-y-px py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === '/transactions');
            
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-colors whitespace-nowrap overflow-hidden border-l-2",
                  isActive 
                    ? "border-mono-900 bg-mono-100 text-mono-900 font-medium" 
                    : "border-transparent text-mono-500 hover:bg-mono-100/50 hover:text-mono-900",
                  isCollapsed && "justify-center px-0 border-l-0"
                )}
              >
                <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-mono-900" : "text-mono-400")} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
        
        {isMockMode && !isCollapsed && (
          <div className="p-4 border-t border-mono-200 text-mono-400 font-mono text-xs select-none">
            MOCK DATA
          </div>
        )}
      </aside>
      <main className="flex-1 overflow-auto bg-mono-50">
        <Outlet />
      </main>
    </div>
  );
}
