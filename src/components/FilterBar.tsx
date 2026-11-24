import React from 'react';
import { Search, ArrowUpDown, RotateCcw, X } from 'lucide-react';
import { Priority, SortOption, StatusFilter } from '../types/task';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  priorityFilter: Priority | 'All';
  onPriorityChange: (val: Priority | 'All') => void;
  categoryFilter: string;
  onCategoryChange: (val: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (val: StatusFilter) => void;
  sortBy: SortOption;
  onSortChange: (val: SortOption) => void;
  categories: string[];
  showStatusFilter?: boolean;
  showSearch?: boolean;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

const PRIORITY_OPTIONS: Array<Priority | 'All'> = ['All', 'High', 'Medium', 'Low'];

export function FilterBar({
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
  categories,
  showStatusFilter = true,
  showSearch = true,
  onResetFilters,
  hasActiveFilters,
}: FilterBarProps) {
  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col gap-3.5">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {showSearch && (
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by title, description, or category..."
              aria-label="Search tasks"
              className="w-full rounded-xl bg-slate-950/60 border border-white/[0.08] pl-10 pr-9 py-2 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-indigo-400/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
        )}

        {/* Priority Segmented Filter */}
        <div
          className="inline-flex items-center rounded-xl bg-slate-950/60 p-1 border border-white/[0.06] self-start lg:self-auto overflow-x-auto max-w-full"
          role="group"
          aria-label="Filter by priority"
        >
          {PRIORITY_OPTIONS.map((option) => {
            const active = priorityFilter === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onPriorityChange(option)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                  active
                    ? 'bg-indigo-500/25 text-white border border-indigo-400/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {option === 'All' ? 'All Priorities' : option}
              </button>
            );
          })}
        </div>

        {/* Category & Status & Sort Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            aria-label="Filter by category"
            className="rounded-xl bg-slate-950/60 border border-white/[0.08] px-3 py-2 text-xs font-medium text-slate-200 focus:border-indigo-400/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {showStatusFilter && (
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
              aria-label="Filter by completion status"
              className="rounded-xl bg-slate-950/60 border border-white/[0.08] px-3 py-2 text-xs font-medium text-slate-200 focus:border-indigo-400/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="completed">Completed Only</option>
            </select>
          )}

          <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950/60 border border-white/[0.08] px-3 py-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              aria-label="Sort tasks"
              className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none"
            >
              <option value="dueDate" className="bg-slate-900">
                Sort: Due Date
              </option>
              <option value="priority" className="bg-slate-900">
                Sort: Priority
              </option>
              <option value="createdAt" className="bg-slate-900">
                Sort: Newest
              </option>
              <option value="title" className="bg-slate-900">
                Sort: Alphabetical
              </option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.08] hover:text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
