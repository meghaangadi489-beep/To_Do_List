import React from 'react';
import {
  LayoutDashboard,
  ListTodo,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Settings,
  Plus,
  X,
  CheckSquare,
  LogOut,
} from 'lucide-react';
import { NavView } from '../types/task';

interface SidebarProps {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  onOpenAddModal: () => void;
  counts: {
    all: number;
    today: number;
    upcoming: number;
    completed: number;
  };
  userName: string;
  userEmail: string;
  onSignOut: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItemConfig {
  id: NavView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

export function Sidebar({
  activeView,
  onSelectView,
  onOpenAddModal,
  counts,
  userName,
  userEmail,
  onSignOut,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const mainNavItems: NavItemConfig[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'all', label: 'All Tasks', icon: ListTodo, count: counts.all },
    { id: 'today', label: 'Today', icon: CalendarCheck, count: counts.today },
    { id: 'upcoming', label: 'Upcoming', icon: CalendarClock, count: counts.upcoming },
    { id: 'completed', label: 'Completed', icon: CheckCircle2, count: counts.completed },
  ];

  const handleNavClick = (view: NavView) => {
    onSelectView(view);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-5">
      <div>
        {/* Brand Wordmark */}
        <div className="flex items-center justify-between mb-7 px-1">
          <button
            type="button"
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg py-1"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl brand-gradient shadow-lg shadow-indigo-500/20">
              <CheckSquare className="h-5 w-5 text-white" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap">
              TaskFlow
            </span>
          </button>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Primary Action */}
        <button
          type="button"
          onClick={() => {
            onCloseMobile();
            onOpenAddModal();
          }}
          className="mb-7 flex w-full items-center justify-center gap-2 rounded-xl brand-gradient brand-gradient-hover px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all duration-150 active:scale-[0.98] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span>New Task</span>
        </button>

        {/* Primary Navigation */}
        <nav aria-label="Workspace navigation" className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/20 via-violet-500/15 to-blue-500/10 text-white border border-indigo-400/25 shadow-sm'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive ? 'text-indigo-300' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                </span>
                {typeof item.count === 'number' && (
                  <span
                    className={`ml-2 text-xs font-mono tabular-nums ${
                      isActive ? 'text-indigo-200' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Settings & Account Controls */}
      <div className="pt-4 border-t border-white/[0.08] space-y-1">
        <button
          type="button"
          onClick={() => handleNavClick('settings')}
          className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
            activeView === 'settings'
              ? 'bg-gradient-to-r from-indigo-500/20 via-violet-500/15 to-blue-500/10 text-white border border-indigo-400/25'
              : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100 border border-transparent'
          }`}
        >
          <Settings
            className={`h-4 w-4 shrink-0 transition-colors ${
              activeView === 'settings'
                ? 'text-indigo-300'
                : 'text-slate-400 group-hover:text-slate-200'
            }`}
          />
          <span className="whitespace-nowrap">Settings</span>
        </button>

        <div className="mt-2 pt-3 border-t border-white/[0.06] px-2 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">{userName}</p>
            <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onCloseMobile();
              onSignOut();
            }}
            aria-label="Log out"
            title="Log out"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-500/15 hover:text-rose-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-[260px] shrink-0 glass-sidebar min-h-screen sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-[272px] max-w-[85vw] glass-sidebar h-full shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
