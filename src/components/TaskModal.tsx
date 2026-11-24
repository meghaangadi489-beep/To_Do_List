import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Calendar, Flag, Folder } from 'lucide-react';
import { Priority, Task, TaskFormData } from '../types/task';
import { addDaysISO, getTodayISO } from '../utils/date';

interface TaskModalProps {
  isOpen: boolean;
  editingTask: Task | null;
  categories: string[];
  defaultPriority: Priority;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<void> | void;
}

const PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];

export function TaskModal({
  isOpen,
  editingTask,
  categories,
  defaultPriority,
  onClose,
  onSubmit,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>(defaultPriority);
  const [category, setCategory] = useState(categories[0] || 'Work');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description);
      setDueDate(editingTask.dueDate);
      setPriority(editingTask.priority);
      setCategory(editingTask.category);
    } else {
      setTitle('');
      setDescription('');
      setDueDate(getTodayISO());
      setPriority(defaultPriority);
      setCategory(categories[0] || 'Work');
    }
    setError('');
    setSubmitting(false);
  }, [isOpen, editingTask, defaultPriority, categories]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please enter a task title.');
      titleInputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: trimmedTitle,
        description: description.trim(),
        dueDate,
        priority,
        category: category || categories[0] || 'Work',
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-modal-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-lg glass-modal rounded-2xl p-6 sm:p-7"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 id="task-modal-title" className="font-display text-xl font-bold text-white">
                  {editingTask ? 'Edit Task' : 'Create New Task'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editingTask
                    ? 'Update task details, schedule, or priority.'
                    : 'Add a task with priority, due date, and category.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title */}
              <div>
                <label
                  htmlFor="task-title-input"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Task Title <span className="text-rose-400">*</span>
                </label>
                <input
                  ref={titleInputRef}
                  id="task-title-input"
                  type="text"
                  autoFocus
                  value={title}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'task-title-error' : undefined}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="e.g., Finalize Q4 product roadmap"
                  className={`w-full rounded-xl bg-slate-950/70 border px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
                    error
                      ? 'border-rose-400/70 focus:border-rose-400 focus:ring-rose-500/25'
                      : 'border-white/[0.1] focus:border-indigo-400 focus:ring-indigo-500/25'
                  }`}
                />
                {error && (
                  <p id="task-title-error" role="alert" className="mt-1.5 text-xs text-rose-400">
                    {error}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="task-desc-input"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Description
                </label>
                <textarea
                  id="task-desc-input"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add context, links, or acceptance criteria..."
                  className="w-full rounded-xl bg-slate-950/70 border border-white/[0.1] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 resize-none focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                />
              </div>

              {/* Priority Selector */}
              <div>
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-2">
                  <Flag className="h-3.5 w-3.5 text-slate-400" />
                  <span>Priority</span>
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {PRIORITIES.map((p) => {
                    const selected = priority === p;
                    const activeClasses =
                      p === 'High'
                        ? 'bg-rose-500/20 border-rose-400/50 text-rose-200'
                        : p === 'Medium'
                        ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                        : 'bg-sky-500/20 border-sky-400/50 text-sky-200';
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                          selected
                            ? activeClasses
                            : 'border-white/[0.08] bg-slate-950/50 text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Due Date & Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="task-due-input"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1.5"
                  >
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Due Date</span>
                  </label>
                  <input
                    id="task-due-input"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl bg-slate-950/70 border border-white/[0.1] px-3.5 py-2.5 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 [color-scheme:dark]"
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDueDate(getTodayISO())}
                      className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-white/[0.08] hover:text-white transition-colors"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setDueDate(addDaysISO(1))}
                      className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-white/[0.08] hover:text-white transition-colors"
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => setDueDate(addDaysISO(7))}
                      className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-white/[0.08] hover:text-white transition-colors"
                    >
                      Next Week
                    </button>
                    {dueDate && (
                      <button
                        type="button"
                        onClick={() => setDueDate('')}
                        className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-rose-300 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="task-category-select"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1.5"
                  >
                    <Folder className="h-3.5 w-3.5 text-slate-400" />
                    <span>Category</span>
                  </label>
                  <select
                    id="task-category-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl bg-slate-950/70 border border-white/[0.1] px-3.5 py-2.5 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat} className="bg-slate-900">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={onClose}
                  className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/[0.08] hover:text-white disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl brand-gradient brand-gradient-hover px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all duration-150 active:scale-[0.98] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                >
                  {submitting
                    ? 'Saving...'
                    : editingTask
                    ? 'Save Changes'
                    : 'Create Task'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
