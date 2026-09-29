'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface AlertDialogProps {
  open: boolean;
  message: string;
  variant?: 'error' | 'success';
  onClose: () => void;
}

// Replaces window.alert() across the app — a native browser alert shows up
// as an ugly "localhost says" popup; this matches the same in-app modal
// styling already used for the sign-out confirmation (see ConfirmDialog).
export default function AlertDialog({ open, message, variant = 'error', onClose }: AlertDialogProps) {
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fadeIn p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-950 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className={`rounded-full p-2 shrink-0 ${
              variant === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
            }`}
          >
            {variant === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          </div>
          <p className="pt-1.5 text-sm font-medium text-gray-800 dark:text-gray-200">{message}</p>
        </div>
        <div className="mt-6 flex items-center justify-end">
          <button
            id="alert-dialog-ok-btn"
            onClick={onClose}
            autoFocus
            className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2 text-sm font-bold text-white shadow-sm transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
