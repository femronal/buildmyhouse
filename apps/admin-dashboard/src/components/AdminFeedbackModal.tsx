'use client';

import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

type AdminFeedbackModalProps = {
  open: boolean;
  title: string;
  message: string;
  tone?: 'success' | 'error' | 'info';
  confirmLabel?: string;
  liveUrl?: string;
  onClose: () => void;
};

const toneStyles = {
  success: {
    icon: CheckCircle2,
    iconWrap: 'bg-green-500/15 text-green-300',
    button: 'bg-green-600 hover:bg-green-500',
  },
  error: {
    icon: AlertTriangle,
    iconWrap: 'bg-red-500/15 text-red-300',
    button: 'bg-red-600 hover:bg-red-500',
  },
  info: {
    icon: Info,
    iconWrap: 'bg-blue-500/15 text-blue-300',
    button: 'bg-blue-600 hover:bg-blue-500',
  },
} as const;

export default function AdminFeedbackModal({
  open,
  title,
  message,
  tone = 'info',
  confirmLabel = 'OK',
  liveUrl,
  onClose,
}: AdminFeedbackModalProps) {
  if (!open) return null;

  const styles = toneStyles[tone];
  const Icon = styles.icon;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-feedback-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-blue-900 bg-[#0A1628] p-6 shadow-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-300/80">
          BuildMyHouse Admin
        </p>

        <div className="mt-4 flex items-start gap-3">
          <div className={`mt-0.5 rounded-full p-2 ${styles.iconWrap}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 id="admin-feedback-title" className="text-xl font-semibold text-white">
              {title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-gray-300">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {liveUrl ? (
            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800"
            >
              View live page
            </a>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg px-5 py-2 text-sm font-medium text-white ${styles.button}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export type AdminFeedbackState = {
  open: boolean;
  title: string;
  message: string;
  tone: 'success' | 'error' | 'info';
  liveUrl?: string;
};

export function closedAdminFeedback(): AdminFeedbackState {
  return {
    open: false,
    title: '',
    message: '',
    tone: 'info',
  };
}
