import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, Plus, CheckSquare, Inbox, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import {
  NavView,
  Priority,
  SortOption,
  StatusFilter,
  Task,
  TaskFormData,
  UserSettings,
} from './types/task';
import { supabase } from './lib/supabase';
import {
  clearCompletedTasksForUser,
  createTaskForUser,
  deleteAllTasksForUser,
  deleteTaskForUser,
  fetchUserTasks,
  insertSampleTasksForUser,
  restoreTaskForUser,
  toggleTaskCompletionForUser,
  updateTaskForUser,
} from './services/taskService';
import {
  DEFAULT_SETTINGS,
  extractSettingsFromUser,
  saveSettingsToSupabase,
} from './utils/storage';
import { isOverdueDate, isTodayDate, isUpcomingDate } from './utils/date';
import {
  AuthMode,
  AuthScreen,
  EPHEMERAL_ALIVE_KEY,
  EPHEMERAL_SESSION_KEY,
} from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { FilterBar } from './components/FilterBar';
import { TaskRow } from './components/TaskRow';
import { TaskModal } from './components/TaskModal';
import { SettingsView } from './components/SettingsView';
import { Toast, ToastMessage } from './components/Toast';

const PRIORITY_RANK: Record<Priority, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

const VIEW_HEADERS: Record<
  Exclude<NavView, 'dashboard' | 'settings'>,
  { title: string; subtitle: string }
> = {
  all: {
    title: 'All Tasks',
    subtitle: 'Manage every task across your workspace with filters and sorting.',
  },
  today: {
    title: 'Today',
    subtitle: 'Focus on tasks due today and any overdue items requiring attention.',
  },
  upcoming: {
    title: 'Upcoming',
    subtitle: 'Plan ahead for tasks scheduled beyond today.',
  },
  completed: {
    title: 'Completed',
    subtitle: 'Review finished tasks or reopen them if anything needs another pass.',
  },
};

const VIEW_PATHS: Record<NavView, string> = {
  dashboard: '/dashboard',
  all: '/all',
  today: '/today',
  upcoming: '/upcoming',
  completed: '/completed',
  settings: '/settings',
};

const AUTH_PATHS: Record<AuthMode, string> = {
  login: '/signin',
  signup: '/signup',
  forgot: '/forgot-password',
  recovery: '/reset-password',
};

function getAuthModeFromPath(pathname: string): AuthMode | null {
  const normalized = pathname.toLowerCase();
  if (normalized === '/signin' || normalized === '/login') return 'login';
  if (normalized === '/signup' || normalized === '/register') return 'signup';
  if (normalized === '/forgot-password') return 'forgot';
  if (normalized === '/reset-password') return 'recovery';
  return null;
}

function getViewFromPath(pathname: string): NavView | null {
  const normalized = pathname.toLowerCase();
  if (normalized === '/dashboard') return 'dashboard';
  if (normalized === '/all' || normalized === '/tasks') return 'all';
  if (normalized === '/today') return 'today';
  if (normalized === '/upcoming') return 'upcoming';
  if (normalized === '/completed') return 'completed';
  if (normalized === '/settings') return 'settings';
  return null;
}

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>(
    () => getAuthModeFromPath(window.location.pathname) || 'login'
  );
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<NavView>(
    () => getViewFromPath(window.location.pathname) || 'dashboard'
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const initializedViewForUserRef = useRef<string | null>(null);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Toast & Undo delete state
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const lastDeletedRef = useRef<{ task: Task; index: number } | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((message: string, canUndo = false) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToast({
      id: `${Date.now()}-${Math.random()}`,
      message,
      canUndo,
    });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      lastDeletedRef.current = null;
    }, 4500);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToast(null);
  }, []);

  // Auth Session Initialization, Ephemeral Remember-Me Check & Listener
  useEffect(() => {
    let active = true;

    const initSession = async () => {
      try {
        const isEphemeral = localStorage.getItem(EPHEMERAL_SESSION_KEY) === '1';
        const sessionAlive = sessionStorage.getItem(EPHEMERAL_ALIVE_KEY) === '1';

        if (isEphemeral && !sessionAlive) {
          localStorage.removeItem(EPHEMERAL_SESSION_KEY);
          await supabase.auth.signOut();
        } else if (isEphemeral && sessionAlive) {
          sessionStorage.setItem(EPHEMERAL_ALIVE_KEY, '1');
        }

        const { data } = await supabase.auth.getSession();
        if (!active) return;

        const sessionUser = data.session?.user ?? null;
        setUser(sessionUser);

        if (sessionUser) {
          const userSettings = extractSettingsFromUser(sessionUser);
          setSettings(userSettings);
          if (initializedViewForUserRef.current !== sessionUser.id) {
            const pathView = getViewFromPath(window.location.pathname);
            const targetView = pathView || userSettings.defaultView || 'dashboard';
            setActiveView(targetView);
            if (!pathView) {
              window.history.replaceState(null, '', VIEW_PATHS[targetView]);
            }
            initializedViewForUserRef.current = sessionUser.id;
          }
        } else {
          const requestedAuthMode = getAuthModeFromPath(window.location.pathname);
          if (!requestedAuthMode) {
            window.history.replaceState(null, '', AUTH_PATHS.login);
            setAuthMode('login');
          }
        }
      } catch {
        // Ignore initialization errors
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    };

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true);
        setAuthMode('recovery');
        window.history.replaceState(null, '', AUTH_PATHS.recovery);
      }

      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (nextUser) {
        const userSettings = extractSettingsFromUser(nextUser);
        setSettings(userSettings);
        if (event === 'SIGNED_IN' && initializedViewForUserRef.current !== nextUser.id) {
          setActiveView('dashboard');
          window.history.replaceState(null, '', VIEW_PATHS.dashboard);
          initializedViewForUserRef.current = nextUser.id;
        }
      } else {
        setTasks([]);
        setSettings(DEFAULT_SETTINGS);
        setLoadError(null);
        setPasswordRecovery(false);
        initializedViewForUserRef.current = null;
        if (!getAuthModeFromPath(window.location.pathname)) {
          window.history.replaceState(null, '', AUTH_PATHS.login);
          setAuthMode('login');
        }
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Protect dashboard routes & handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      if (!user || passwordRecovery) {
        const modeFromPath = getAuthModeFromPath(window.location.pathname);
        if (modeFromPath) {
          setAuthMode(modeFromPath);
        } else {
          setAuthMode('login');
          window.history.replaceState(null, '', AUTH_PATHS.login);
        }
        return;
      }

      const viewFromPath = getViewFromPath(window.location.pathname);
      if (viewFromPath) {
        setActiveView(viewFromPath);
      } else {
        setActiveView('dashboard');
        window.history.replaceState(null, '', VIEW_PATHS.dashboard);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user, passwordRecovery]);

  const loadTasksForCurrentUser = useCallback(async (userId: string) => {
    setTasksLoading(true);
    setLoadError(null);
    try {
      const fetched = await fetchUserTasks(userId);
      setTasks(fetched);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to load tasks from Supabase.';
      setLoadError(message);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  // Fetch only the logged-in user's tasks when authenticated
  useEffect(() => {
    if (!user?.id) return;
    loadTasksForCurrentUser(user.id);
  }, [user?.id, loadTasksForCurrentUser]);

  // Derived statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const dueToday = tasks.filter((t) => !t.completed && isTodayDate(t.dueDate)).length;
    const overdue = tasks.filter((t) => isOverdueDate(t.dueDate, t.completed)).length;
    const highPriorityPending = tasks.filter(
      (t) => !t.completed && t.priority === 'High'
    ).length;

    return {
      total,
      completed,
      dueToday,
      overdue,
      highPriorityPending,
    };
  }, [tasks]);

  const navCounts = useMemo(
    () => ({
      all: tasks.length,
      today: tasks.filter(
        (t) => !t.completed && (isTodayDate(t.dueDate) || isOverdueDate(t.dueDate, t.completed))
      ).length,
      upcoming: tasks.filter((t) => !t.completed && isUpcomingDate(t.dueDate)).length,
      completed: tasks.filter((t) => t.completed).length,
    }),
    [tasks]
  );

  // All categories including any categories referenced on tasks
  const allCategories = useMemo(() => {
    const set = new Set(settings.categories);
    tasks.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [settings.categories, tasks]);

  useEffect(() => {
    if (categoryFilter !== 'All' && !allCategories.includes(categoryFilter)) {
      setCategoryFilter('All');
    }
  }, [categoryFilter, allCategories]);

  // Filtered and sorted task list for the active view
  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const viewFiltered = tasks.filter((task) => {
      if (activeView === 'today') {
        if (task.completed) return false;
        if (!isTodayDate(task.dueDate) && !isOverdueDate(task.dueDate, task.completed)) {
          return false;
        }
      } else if (activeView === 'upcoming') {
        if (task.completed || !isUpcomingDate(task.dueDate)) return false;
      } else if (activeView === 'completed') {
        if (!task.completed) return false;
      }

      if (activeView === 'all' || activeView === 'dashboard') {
        if (statusFilter === 'active' && task.completed) return false;
        if (statusFilter === 'completed' && !task.completed) return false;
      }

      if (priorityFilter !== 'All' && task.priority !== priorityFilter) {
        return false;
      }

      if (categoryFilter !== 'All' && task.category !== categoryFilter) {
        return false;
      }

      if (q) {
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description.toLowerCase().includes(q);
        const matchesCat = task.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCat) {
          return false;
        }
      }

      return true;
    });

    return [...viewFiltered].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      if (sortBy === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return b.createdAt.localeCompare(a.createdAt);
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        const cmp = a.dueDate.localeCompare(b.dueDate);
        if (cmp !== 0) return cmp;
        return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      }

      if (sortBy === 'priority') {
        const cmp = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        if (cmp !== 0) return cmp;
        return (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31');
      }

      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }

      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [tasks, activeView, searchQuery, priorityFilter, categoryFilter, statusFilter, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    priorityFilter !== 'All' ||
    categoryFilter !== 'All' ||
    ((activeView === 'dashboard' || activeView === 'all') && statusFilter !== 'all');

  const handleResetFilters = () => {
    setSearchQuery('');
    setPriorityFilter('All');
    setCategoryFilter('All');
    setStatusFilter('all');
  };

  // CRUD Handlers (Supabase)
  const handleOpenAddModal = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleModalSubmit = async (data: TaskFormData) => {
    if (!user) {
      throw new Error('Please sign in before saving tasks.');
    }
    if (editingTask) {
      const updated = await updateTaskForUser(user.id, editingTask.id, data);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      showToast('Task updated.');
    } else {
      const created = await createTaskForUser(user.id, data);
      setTasks((prev) => [created, ...prev]);
      showToast('Task created.');
    }
  };

  const handleToggleComplete = async (id: string) => {
    if (!user) return;
    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    const nextCompleted = !target.completed;

    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t))
    );

    try {
      const updated = await toggleTaskCompletionForUser(user.id, id, nextCompleted);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setTasks((prev) => prev.map((t) => (t.id === id ? target : t)));
      showToast(err instanceof Error ? err.message : 'Failed to update task status.');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!user) return;
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return;
    const removed = tasks[index];

    lastDeletedRef.current = { task: removed, index };
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await deleteTaskForUser(user.id, id);
      showToast(`Deleted "${removed.title}"`, true);
    } catch (err) {
      lastDeletedRef.current = null;
      setTasks((prev) => {
        const next = [...prev];
        next.splice(Math.min(index, next.length), 0, removed);
        return next;
      });
      showToast(err instanceof Error ? err.message : 'Failed to delete task.');
    }
  };

  const handleUndoDelete = async () => {
    if (!user) return;
    const saved = lastDeletedRef.current;
    if (!saved) return;
    lastDeletedRef.current = null;
    dismissToast();

    try {
      const restored = await restoreTaskForUser(user.id, saved.task);
      setTasks((prev) => {
        const next = [...prev];
        const insertAt = Math.min(saved.index, next.length);
        next.splice(insertAt, 0, restored);
        return next;
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to restore task.');
    }
  };

  // Settings & Data Management Actions
  const handleUpdateSettings = async (next: UserSettings) => {
    setSettings(next);
    try {
      const synced = await saveSettingsToSupabase(next);
      setSettings(synced);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save preferences.');
    }
  };

  const handleClearCompleted = async () => {
    if (!user) return;
    const count = tasks.filter((t) => t.completed).length;
    if (count === 0) return;

    try {
      await clearCompletedTasksForUser(user.id);
      setTasks((prev) => prev.filter((t) => !t.completed));
      showToast(`Cleared ${count} completed ${count === 1 ? 'task' : 'tasks'}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to clear completed tasks.');
    }
  };

  const handleRestoreSamples = async () => {
    if (!user) return;
    try {
      const inserted = await insertSampleTasksForUser(user.id);
      setTasks((prev) => [...inserted, ...prev]);
      showToast(`Added ${inserted.length} sample tasks.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add sample tasks.');
    }
  };

  const handleClearAllTasks = async () => {
    if (!user) return;
    try {
      await deleteAllTasksForUser(user.id);
      setTasks([]);
      showToast('All tasks deleted.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete tasks.');
    }
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem(EPHEMERAL_SESSION_KEY);
      sessionStorage.removeItem(EPHEMERAL_ALIVE_KEY);
    } catch {
      // Ignore storage errors
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      showToast(error.message);
      return;
    }
    handleResetFilters();
    setAuthMode('login');
    window.history.pushState(null, '', AUTH_PATHS.login);
  };

  const handleSelectView = (view: NavView) => {
    setActiveView(view);
    if (window.location.pathname !== VIEW_PATHS[view]) {
      window.history.pushState(null, '', VIEW_PATHS[view]);
    }
  };

  const handleViewHighPriority = () => {
    setPriorityFilter('High');
    setStatusFilter('active');
    handleSelectView('all');
  };

  const handleAuthModeChange = (nextMode: AuthMode) => {
    setAuthMode(nextMode);
    if (window.location.pathname !== AUTH_PATHS[nextMode]) {
      window.history.pushState(null, '', AUTH_PATHS[nextMode]);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#070B16] text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
          <p className="text-sm text-slate-400">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!user || passwordRecovery) {
    return (
      <AuthScreen
        mode={passwordRecovery ? 'recovery' : authMode}
        onModeChange={handleAuthModeChange}
        onAuthSuccess={() => {
          setActiveView('dashboard');
          window.history.replaceState(null, '', VIEW_PATHS.dashboard);
        }}
        onRecoveryComplete={() => {
          setPasswordRecovery(false);
          setActiveView('dashboard');
          window.history.replaceState(null, '', VIEW_PATHS.dashboard);
          showToast('Password updated successfully.');
        }}
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-[#070B16] text-slate-100 flex flex-col lg:flex-row overflow-x-hidden">
      {/* Subtle Ambient Purple & Blue Gradient Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-indigo-600/16 blur-[130px]" />
        <div className="absolute top-1/4 right-[-120px] h-[480px] w-[480px] rounded-full bg-violet-600/14 blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 h-[420px] w-[420px] rounded-full bg-blue-600/12 blur-[130px]" />
      </div>

      {/* Left Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        onSelectView={handleSelectView}
        onOpenAddModal={handleOpenAddModal}
        counts={navCounts}
        userName={settings.userName}
        userEmail={user.email || ''}
        onSignOut={handleSignOut}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Shell */}
      <div className="relative z-10 flex-1 min-w-0 flex flex-col">
        {/* Compact Mobile Top Bar (<= 15% viewport height) */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-4 px-4 py-3 bg-[#090E1D]/85 backdrop-blur-xl border-b border-white/[0.08]">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg brand-gradient">
              <CheckSquare className="h-4 w-4 text-white" />
            </span>
            <span className="font-display text-base font-bold text-white whitespace-nowrap">
              TaskFlow
            </span>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            aria-label="Add new task"
            className="flex h-10 w-10 items-center justify-center rounded-xl brand-gradient text-white shadow-md shadow-indigo-600/25"
          >
            <Plus className="h-5 w-5" />
          </button>
        </header>

        {/* Main Viewport Container */}
        <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-8 py-6 sm:py-9">
          {loadError && (
            <div
              role="alert"
              className="mb-6 glass-panel rounded-2xl border-amber-400/35 bg-amber-500/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-semibold text-amber-100">
                    Unable to Load Tasks from Supabase
                  </h2>
                  <p className="mt-1 text-xs text-amber-200/85 leading-relaxed">
                    {loadError}. Check the browser console for the full Supabase error details.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => user && loadTasksForCurrentUser(user.id)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300/30 bg-amber-400/15 px-3.5 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-400/25 transition-colors shrink-0 self-start sm:self-auto"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeView === 'settings' ? (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              >
                <SettingsView
                  settings={settings}
                  userEmail={user.email || ''}
                  tasks={tasks}
                  onUpdateSettings={handleUpdateSettings}
                  onClearCompleted={handleClearCompleted}
                  onRestoreSamples={handleRestoreSamples}
                  onClearAllTasks={handleClearAllTasks}
                  onSignOut={handleSignOut}
                  onNotify={(msg) => showToast(msg)}
                />
              </motion.div>
            ) : (
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                {activeView === 'dashboard' ? (
                  <DashboardOverview
                    userName={settings.userName}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    stats={stats}
                    onOpenAddModal={handleOpenAddModal}
                    onNavigateView={(view) => {
                      if (view === 'all') {
                        handleResetFilters();
                      }
                      handleSelectView(view);
                    }}
                    onViewHighPriority={handleViewHighPriority}
                    onSignOut={handleSignOut}
                  />
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                      <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
                        {VIEW_HEADERS[activeView].title}
                      </h1>
                      <p className="mt-1 text-sm text-slate-400">
                        {VIEW_HEADERS[activeView].subtitle}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenAddModal}
                      className="inline-flex items-center justify-center gap-2 rounded-xl brand-gradient brand-gradient-hover px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all duration-150 active:scale-[0.98] whitespace-nowrap shrink-0 self-start sm:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                    >
                      <Plus className="h-4 w-4 shrink-0" />
                      <span>Add Task</span>
                    </button>
                  </div>
                )}

                {/* Filter & Sort Controls */}
                <FilterBar
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  priorityFilter={priorityFilter}
                  onPriorityChange={setPriorityFilter}
                  categoryFilter={categoryFilter}
                  onCategoryChange={setCategoryFilter}
                  statusFilter={statusFilter}
                  onStatusChange={setStatusFilter}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  categories={allCategories}
                  showStatusFilter={activeView === 'dashboard' || activeView === 'all'}
                  showSearch={activeView !== 'dashboard'}
                  onResetFilters={handleResetFilters}
                  hasActiveFilters={hasActiveFilters}
                />

                {/* Task List Section Header */}
                <div className="flex items-center justify-between px-1">
                  <h2 className="font-display text-sm font-semibold text-slate-300">
                    {activeView === 'dashboard' ? 'Task Queue' : 'Tasks'}
                  </h2>
                  <span className="text-xs font-mono text-slate-400 tabular-nums">
                    {filteredTasks.length} {filteredTasks.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {/* Task List, Loading Skeleton, or Empty State */}
                {tasksLoading ? (
                  <div className="space-y-3" aria-busy="true" aria-label="Loading tasks">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="glass-panel rounded-2xl px-5 py-5 animate-pulse flex items-start gap-3.5"
                      >
                        <div className="h-5 w-5 rounded-md bg-slate-800/90 mt-0.5" />
                        <div className="flex-1 space-y-2.5">
                          <div className="h-4 w-2/5 rounded bg-slate-800/90" />
                          <div className="h-3 w-3/4 rounded bg-slate-800/60" />
                          <div className="h-3 w-1/3 rounded bg-slate-800/50" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredTasks.length > 0 ? (
                  <div className="space-y-3">
                    <AnimatePresence initial={false}>
                      {filteredTasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          onToggleComplete={handleToggleComplete}
                          onEdit={handleOpenEditModal}
                          onDelete={handleDeleteTask}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="glass-panel rounded-2xl px-6 py-14 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 border border-indigo-400/20 text-indigo-300">
                      <Inbox className="h-6 w-6" />
                    </div>
                    <h3 className="font-display text-base font-semibold text-white">
                      {hasActiveFilters
                        ? 'No matching tasks found'
                        : activeView === 'completed'
                        ? 'No completed tasks yet'
                        : activeView === 'today'
                        ? 'Nothing due today'
                        : activeView === 'upcoming'
                        ? 'No upcoming tasks scheduled'
                        : 'Your task list is empty'}
                    </h3>
                    <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-400">
                      {hasActiveFilters
                        ? 'Try clearing or adjusting your search query, priority, or category filters.'
                        : 'Create a new task with a due date, priority level, and category to stay organized.'}
                    </p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      {hasActiveFilters ? (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="rounded-xl border border-white/[0.12] bg-white/[0.05] px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.1] transition-colors"
                        >
                          Clear Filters
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleOpenAddModal}
                          className="inline-flex items-center gap-2 rounded-xl brand-gradient brand-gradient-hover px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Create First Task</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Add / Edit Task Modal */}
      <TaskModal
        isOpen={modalOpen}
        editingTask={editingTask}
        categories={allCategories}
        defaultPriority={settings.defaultPriority}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleModalSubmit}
      />

      {/* Toast Notification */}
      <Toast toast={toast} onUndo={handleUndoDelete} onDismiss={dismissToast} />
    </div>
  );
}
