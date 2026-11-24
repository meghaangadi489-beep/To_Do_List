import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, RotateCcw } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  canUndo?: boolean;
}

interface ToastProps {
  toast: ToastMessage | null;
  onUndo?: () => void;
  onDismiss: () => void;
}

export function Toast({ toast, onUndo, onDismiss }: ToastProps) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl glass-modal px-4 py-3 text-sm text-slate-100 shadow-2xl"
        >
          <span>{toast.message}</span>
          {toast.canUndo && onUndo && (
            <button
              type="button"
              onClick={onUndo}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/25 border border-indigo-400/30 px-2.5 py-1 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/35 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Undo</span>
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss notification"
            className="rounded-lg p-1 text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
