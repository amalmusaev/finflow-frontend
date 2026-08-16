import { useState, useEffect, useCallback } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Wallet, ArrowLeftRight, Settings as SettingsIcon, PanelLeftClose, RefreshCw, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../api';

export function Layout() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [backendVersion, setBackendVersion] = useState<string>('');

  const checkStatus = useCallback(async () => {
    try {
      const res = await api.health.checkHealth();
      setBackendStatus('online');
      setBackendVersion(res.version || '0.1.0');
    } catch {
      setBackendStatus('offline');
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [checkStatus]);

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
        
        {/* Backend Status & Version */}
        <div className={cn(
          "p-4 border-t border-mono-200 text-xs flex flex-col gap-2 transition-all duration-300",
          isCollapsed && "items-center"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2" title={backendStatus === 'online' ? `API онлайн (v${backendVersion})` : backendStatus === 'offline' ? 'API недоступен' : 'Проверка API...'}>
              <span className={cn(
                "w-2 h-2 rounded-full flex-shrink-0 transition-colors",
                backendStatus === 'online' && "bg-emerald-500",
                backendStatus === 'offline' && "bg-rose-500",
                backendStatus === 'checking' && "bg-amber-400 animate-pulse"
              )} />
              {!isCollapsed && (
                <span className="text-mono-500 font-mono text-[11px]">
                  {backendStatus === 'online' ? `API v${backendVersion}` : backendStatus === 'offline' ? 'API Офлайн' : 'Проверка...'}
                </span>
              )}
            </div>
            {!isCollapsed && backendStatus === 'offline' && (
              <button 
                onClick={checkStatus} 
                className="text-mono-400 hover:text-mono-700 transition-colors p-1"
                title="Повторить подключение"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {!isCollapsed && (
            <div className="text-mono-400 font-mono text-[10px]">
              FinFlow v1.0.0
            </div>
          )}
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-mono-50">
        <Outlet />
      </main>
    </div>
  );
}
