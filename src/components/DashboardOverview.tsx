import React from 'react';
import {
  Search,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Layers,
  X,
  LogOut,
} from 'lucide-react';
import { formatCurrentFullDate, getTimeGreeting } from '../utils/date';
import { NavView } from '../types/task';

interface DashboardOverviewProps {
  userName: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  stats: {
    total: number;
    completed: number;
    dueToday: number;
    highPriorityPending: number;
    overdue: number;
  };
  onOpenAddModal: () => void;
  onNavigateView: (view: NavView) => void;
  onViewHighPriority: () => void;
  onSignOut: () => void;
}

export function DashboardOverview({
  userName,
  searchQuery,
  onSearchChange,
  stats,
  onOpenAddModal,
  onNavigateView,
  onViewHighPriority,
  onSignOut,
}: DashboardOverviewProps) {
  const completionRate =
    stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);
  const greeting = getTimeGreeting();
  const formattedDate = formatCurrentFullDate();

  return (
    <section className="space-y-6">
      {/* Greeting Header & Search Row */}
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-300/90 mb-1">{formattedDate}</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white [text-wrap:balance]">
            {greeting}, {userName}
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            {stats.dueToday > 0
              ? `You have ${stats.dueToday} ${stats.dueToday === 1 ? 'task' : 'tasks'} scheduled for today.`
              : 'Your schedule for today is clear. Plan ahead or add a new priority.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tasks, categories..."
              aria-label="Search tasks"
              className="w-full rounded-xl bg-slate-900/70 border border-white/[0.1] pl-10 pr-9 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-indigo-400/60 focus:bg-slate-900/90 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl brand-gradient brand-gradient-hover px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all duration-150 active:scale-[0.98] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>Add Task</span>
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2.5 text-sm font-medium text-slate-300 hover:bg-rose-500/15 hover:border-rose-400/30 hover:text-rose-200 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Single-Elevation Glass Statistics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigateView('all')}
          className="glass-panel rounded-2xl p-5 text-left transition-all duration-150 hover:border-indigo-400/30 hover:bg-slate-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium tracking-wide">Total Tasks</span>
            <Layers className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-white tabular-nums">
            {stats.total}
          </div>
          <p className="mt-1 text-xs text-slate-400 tabular-nums">
            {stats.total - stats.completed} remaining
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateView('completed')}
          className="glass-panel rounded-2xl p-5 text-left transition-all duration-150 hover:border-emerald-400/30 hover:bg-slate-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium tracking-wide">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-white tabular-nums">
            {stats.completed}
          </div>
          <p className="mt-1 text-xs text-emerald-400/90 tabular-nums">
            {completionRate}% completion rate
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateView('today')}
          className="glass-panel rounded-2xl p-5 text-left transition-all duration-150 hover:border-blue-400/30 hover:bg-slate-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium tracking-wide">Due Today</span>
            <Clock className="h-4 w-4 text-blue-400" />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-white tabular-nums">
            {stats.dueToday}
          </div>
          <p className="mt-1 text-xs text-slate-400 tabular-nums">
            {stats.overdue > 0 ? `${stats.overdue} overdue` : 'No overdue tasks'}
          </p>
        </button>

        <button
          type="button"
          onClick={onViewHighPriority}
          className="glass-panel rounded-2xl p-5 text-left transition-all duration-150 hover:border-amber-400/30 hover:bg-slate-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium tracking-wide">High Priority</span>
            <AlertCircle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-white tabular-nums">
            {stats.highPriorityPending}
          </div>
          <p className="mt-1 text-xs text-slate-400">Active focus items</p>
        </button>
      </div>

      {/* Task Completion Progress Bar */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="font-display text-sm font-semibold text-white">
              Workspace Completion Progress
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
              {stats.completed} of {stats.total} {stats.total === 1 ? 'task' : 'tasks'} completed
            </p>
          </div>
          <span className="font-mono text-lg font-semibold text-indigo-300 tabular-nums">
            {completionRate}%
          </span>
        </div>

        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-slate-950/80 border border-white/[0.06]"
          role="progressbar"
          aria-valuenow={completionRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Overall task completion progress"
        >
          <div
            className="h-full rounded-full brand-gradient transition-all duration-500 ease-out"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>
    </section>
  );
}
