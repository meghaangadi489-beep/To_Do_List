import React, { useEffect, useState } from 'react';
import {
  Download,
  Plus,
  Trash2,
  RotateCcw,
  Check,
  User,
  FolderPlus,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { NavView, Priority, Task, UserSettings } from '../types/task';

interface SettingsViewProps {
  settings: UserSettings;
  userEmail: string;
  tasks: Task[];
  onUpdateSettings: (next: UserSettings) => Promise<void> | void;
  onClearCompleted: () => Promise<void> | void;
  onRestoreSamples: () => Promise<void> | void;
  onClearAllTasks: () => Promise<void> | void;
  onSignOut: () => Promise<void> | void;
  onNotify: (message: string) => void;
}

export function SettingsView({
  settings,
  userEmail,
  tasks,
  onUpdateSettings,
  onClearCompleted,
  onRestoreSamples,
  onClearAllTasks,
  onSignOut,
  onNotify,
}: SettingsViewProps) {
  const [nameInput, setNameInput] = useState(settings.userName);
  const [newCategory, setNewCategory] = useState('');
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [busyAction, setBusyAction] = useState(false);

  useEffect(() => {
    setNameInput(settings.userName);
  }, [settings.userName]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = nameInput.trim() || 'Alex';
    setNameInput(cleaned);
    setBusyAction(true);
    try {
      await onUpdateSettings({
        ...settings,
        userName: cleaned,
      });
      onNotify('Profile preferences saved.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newCategory.trim();
    if (!cleaned) return;
    if (settings.categories.some((c) => c.toLowerCase() === cleaned.toLowerCase())) {
      onNotify(`Category "${cleaned}" already exists.`);
      return;
    }
    setBusyAction(true);
    try {
      await onUpdateSettings({
        ...settings,
        categories: [...settings.categories, cleaned],
      });
      setNewCategory('');
      onNotify(`Added category "${cleaned}".`);
    } finally {
      setBusyAction(false);
    }
  };

  const handleRemoveCategory = async (category: string) => {
    if (settings.categories.length <= 1) {
      onNotify('Keep at least one category.');
      return;
    }
    setBusyAction(true);
    try {
      await onUpdateSettings({
        ...settings,
        categories: settings.categories.filter((c) => c !== category),
      });
      onNotify(`Removed category "${category}".`);
    } finally {
      setBusyAction(false);
    }
  };

  const handleExportTasks = () => {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), tasks }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `taskflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    onNotify('Exported tasks to JSON.');
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage your Supabase account, task defaults, categories, and cloud data.
        </p>
      </div>

      {/* Account Session Card */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-400/25 text-indigo-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-white">Account Session</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Signed in as <span className="text-slate-200 font-medium">{userEmail}</span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 hover:bg-rose-500/15 hover:border-rose-400/30 hover:text-rose-200 transition-colors self-start sm:self-auto"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Profile & Workspace Defaults */}
      <form onSubmit={handleSaveProfile} className="glass-panel rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2.5 border-b border-white/[0.08] pb-4">
          <User className="h-4 w-4 text-indigo-400" />
          <h2 className="font-display text-base font-semibold text-white">
            Profile & Defaults
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="settings-name"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Display Name
            </label>
            <input
              id="settings-name"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl bg-slate-950/70 border border-white/[0.1] px-3.5 py-2.5 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="settings-priority"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Default Priority
            </label>
            <select
              id="settings-priority"
              value={settings.defaultPriority}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  defaultPriority: e.target.value as Priority,
                })
              }
              className="w-full rounded-xl bg-slate-950/70 border border-white/[0.1] px-3.5 py-2.5 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="High" className="bg-slate-900">
                High
              </option>
              <option value="Medium" className="bg-slate-900">
                Medium
              </option>
              <option value="Low" className="bg-slate-900">
                Low
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="settings-view"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Default Startup View
            </label>
            <select
              id="settings-view"
              value={settings.defaultView}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  defaultView: e.target.value as NavView,
                })
              }
              className="w-full rounded-xl bg-slate-950/70 border border-white/[0.1] px-3.5 py-2.5 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="dashboard" className="bg-slate-900">
                Dashboard
              </option>
              <option value="all" className="bg-slate-900">
                All Tasks
              </option>
              <option value="today" className="bg-slate-900">
                Today
              </option>
              <option value="upcoming" className="bg-slate-900">
                Upcoming
              </option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={busyAction}
            className="inline-flex items-center gap-2 rounded-xl brand-gradient brand-gradient-hover px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition-all duration-150 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
          >
            <Check className="h-4 w-4" />
            <span>Save Profile</span>
          </button>
        </div>
      </form>

      {/* Category Management */}
      <div className="glass-panel rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2.5 border-b border-white/[0.08] pb-4">
          <FolderPlus className="h-4 w-4 text-indigo-400" />
          <h2 className="font-display text-base font-semibold text-white">Task Categories</h2>
        </div>

        <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Add a new category (e.g., Marketing, Health)..."
            aria-label="New category name"
            className="flex-1 rounded-xl bg-slate-950/70 border border-white/[0.1] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            type="submit"
            disabled={busyAction}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-500/20 px-4 py-2.5 text-sm font-semibold text-indigo-100 hover:bg-indigo-500/30 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </button>
        </form>

        <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
          {settings.categories.map((cat) => {
            const count = tasks.filter((t) => t.category === cat).length;
            return (
              <div key={cat} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-medium text-slate-200">{cat}</span>
                  <span aria-hidden="true" className="text-slate-600">
                    ·
                  </span>
                  <span className="text-xs text-slate-400 tabular-nums">
                    {count} {count === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(cat)}
                  disabled={busyAction}
                  aria-label={`Remove category ${cat}`}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:bg-rose-500/15 hover:text-rose-300 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data & Supabase Storage Controls */}
      <div className="glass-panel rounded-2xl p-6 space-y-5">
        <div className="border-b border-white/[0.08] pb-4">
          <h2 className="font-display text-base font-semibold text-white">
            Data & Cloud Sync
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            All tasks are synced directly to your Supabase database and scoped to your user account.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportTasks}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/[0.08] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <Download className="h-4 w-4 text-indigo-300" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              setBusyAction(true);
              try {
                await onClearCompleted();
              } finally {
                setBusyAction(false);
              }
            }}
            disabled={completedCount === 0 || busyAction}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/[0.08] hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <Trash2 className="h-4 w-4 text-slate-400" />
            <span>Clear Completed ({completedCount})</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              setBusyAction(true);
              try {
                await onRestoreSamples();
              } finally {
                setBusyAction(false);
              }
            }}
            disabled={busyAction}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/[0.08] hover:text-white disabled:opacity-40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <RotateCcw className="h-4 w-4 text-blue-300" />
            <span>Add Sample Tasks</span>
          </button>

          {!confirmClearAll ? (
            <button
              type="button"
              onClick={() => setConfirmClearAll(true)}
              disabled={tasks.length === 0 || busyAction}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-300 hover:bg-rose-500/20 disabled:opacity-40 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete All Tasks</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busyAction}
                onClick={async () => {
                  setBusyAction(true);
                  try {
                    await onClearAllTasks();
                    setConfirmClearAll(false);
                  } finally {
                    setBusyAction(false);
                  }
                }}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-60 transition-colors"
              >
                Confirm Delete All
              </button>
              <button
                type="button"
                onClick={() => setConfirmClearAll(false)}
                className="rounded-xl border border-white/[0.1] px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
