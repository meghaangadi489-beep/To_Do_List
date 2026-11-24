import React from 'react';
import { motion } from 'motion/react';
import { Check, Pencil, Trash2, Calendar, AlertTriangle } from 'lucide-react';
import { Priority, Task } from '../types/task';
import { formatDueDateLabel, isOverdueDate } from '../utils/date';

interface TaskRowProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const PRIORITY_TEXT_STYLES: Record<Priority, string> = {
  High: 'text-rose-400',
  Medium: 'text-amber-300',
  Low: 'text-sky-300',
};

export function TaskRow({ task, onToggleComplete, onEdit, onDelete }: TaskRowProps) {
  const overdue = isOverdueDate(task.dueDate, task.completed);
  const dueDateLabel = formatDueDateLabel(task.dueDate);

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className={`group glass-panel rounded-2xl px-4 py-4 sm:px-5 transition-colors duration-150 ${
        task.completed
          ? 'opacity-70 hover:opacity-90'
          : 'hover:border-indigo-400/25 hover:bg-slate-900/60'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Completion Checkbox */}
        <button
          type="button"
          onClick={() => onToggleComplete(task.id)}
          aria-label={task.completed ? `Mark "${task.title}" incomplete` : `Mark "${task.title}" complete`}
          aria-pressed={task.completed}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
            task.completed
              ? 'brand-gradient border-transparent text-white shadow-sm shadow-indigo-500/30'
              : 'border-slate-500/70 bg-slate-950/60 text-transparent hover:border-indigo-400'
          }`}
        >
          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
        </button>

        {/* Task Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3
              className={`font-display text-[15px] font-semibold leading-snug transition-colors ${
                task.completed ? 'line-through text-slate-400' : 'text-slate-100'
              }`}
            >
              {task.title}
            </h3>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 shrink-0 sm:opacity-75 sm:group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => onEdit(task)}
                aria-label={`Edit "${task.title}"`}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                aria-label={`Delete "${task.title}"`}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-500/15 hover:text-rose-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {task.description && (
            <p
              className={`mt-1 text-sm leading-relaxed line-clamp-2 ${
                task.completed ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              {task.description}
            </p>
          )}

          {/* Clean Unboxed Metadata Line */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
            <span className="font-medium text-slate-300">{task.category}</span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span
              className={`inline-flex items-center gap-1 tabular-nums ${
                overdue ? 'text-rose-400 font-medium' : 'text-slate-400'
              }`}
            >
              {overdue ? (
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              )}
              <span>{overdue ? `Overdue (${dueDateLabel})` : dueDateLabel}</span>
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className={`font-medium ${PRIORITY_TEXT_STYLES[task.priority]}`}>
              {task.priority} priority
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
