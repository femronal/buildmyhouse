'use client';

import { FormEvent, ReactNode, useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export type HrFeedbackTone = 'success' | 'error' | 'info';

export type HrFeedbackState = {
  open: boolean;
  title: string;
  message: string;
  tone: HrFeedbackTone;
};

export type HrConfirmState = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm?: () => void | Promise<void>;
};

const FEEDBACK_STYLES: Record<
  HrFeedbackTone,
  { icon: typeof Info; wrap: string; button: string }
> = {
  success: {
    icon: CheckCircle2,
    wrap: 'bg-green-50 text-green-700',
    button: 'bg-green-600 hover:bg-green-700 text-white',
  },
  error: {
    icon: AlertTriangle,
    wrap: 'bg-red-50 text-red-700',
    button: 'bg-red-600 hover:bg-red-700 text-white',
  },
  info: {
    icon: Info,
    wrap: 'bg-blue-50 text-blue-700',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
};

export function HrModalShell({
  title,
  children,
  onClose,
  maxWidthClassName = 'max-w-md',
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  maxWidthClassName?: string;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hr-modal-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${maxWidthClassName} overflow-hidden rounded-xl bg-white shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
              People & HR
            </p>
            <h3 id="hr-modal-title" className="mt-1 text-lg font-semibold text-gray-900">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function HrFeedbackModal({
  open,
  title,
  message,
  tone = 'info',
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  tone?: HrFeedbackTone;
  onClose: () => void;
}) {
  if (!open) return null;
  const styles = FEEDBACK_STYLES[tone];
  const Icon = styles.icon;

  return (
    <HrModalShell title={title} onClose={onClose}>
      <div className="flex items-start gap-3">
        <div className={`rounded-full p-2 ${styles.wrap}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm leading-6 text-gray-600">{message}</p>
      </div>
      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${styles.button}`}
        >
          OK
        </button>
      </div>
    </HrModalShell>
  );
}

export function HrConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  busy = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <HrModalShell title={title} onClose={onCancel}>
      <p className="text-sm leading-6 text-gray-600">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
            danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </HrModalShell>
  );
}

export function useHrFeedback() {
  const [feedback, setFeedback] = useState<HrFeedbackState>({
    open: false,
    title: '',
    message: '',
    tone: 'info',
  });

  const notify = useCallback(
    (tone: HrFeedbackTone, title: string, message: string) => {
      setFeedback({ open: true, title, message, tone });
    },
    [],
  );

  const closeFeedback = useCallback(() => {
    setFeedback((prev) => ({ ...prev, open: false }));
  }, []);

  const feedbackModal = (
    <HrFeedbackModal
      open={feedback.open}
      title={feedback.title}
      message={feedback.message}
      tone={feedback.tone}
      onClose={closeFeedback}
    />
  );

  return { notify, feedbackModal };
}

export function useHrConfirm() {
  const [state, setState] = useState<HrConfirmState>({
    open: false,
    title: '',
    message: '',
  });
  const [busy, setBusy] = useState(false);

  const askConfirm = useCallback(
    (options: {
      title: string;
      message: string;
      confirmLabel?: string;
      danger?: boolean;
      onConfirm: () => void | Promise<void>;
    }) => {
      setState({
        open: true,
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel,
        danger: options.danger,
        onConfirm: options.onConfirm,
      });
    },
    [],
  );

  const closeConfirm = useCallback(() => {
    if (busy) return;
    setState((prev) => ({ ...prev, open: false }));
  }, [busy]);

  const handleConfirm = useCallback(async () => {
    if (!state.onConfirm) return;
    setBusy(true);
    try {
      await state.onConfirm();
      setState((prev) => ({ ...prev, open: false }));
    } finally {
      setBusy(false);
    }
  }, [state]);

  const confirmModal = (
    <HrConfirmModal
      open={state.open}
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      danger={state.danger}
      busy={busy}
      onCancel={closeConfirm}
      onConfirm={() => void handleConfirm()}
    />
  );

  return { askConfirm, confirmModal };
}

export function AddKpiModal({
  open,
  busy,
  onClose,
  onSubmit,
}: {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (values: { kpi: string; target: string; period: string }) => void | Promise<void>;
}) {
  const [kpi, setKpi] = useState('');
  const [target, setTarget] = useState('');
  const [period, setPeriod] = useState('');

  useEffect(() => {
    if (open) {
      setKpi('');
      setTarget('');
      setPeriod('');
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!kpi.trim() || !target.trim() || !period.trim()) return;
    await onSubmit({
      kpi: kpi.trim(),
      target: target.trim(),
      period: period.trim(),
    });
  };

  return (
    <HrModalShell title="Add KPI" onClose={onClose}>
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
        <label className="block text-sm">
          <span className="text-gray-600">KPI name</span>
          <input
            required
            autoFocus
            value={kpi}
            onChange={(event) => setKpi(event.target.value)}
            placeholder="e.g. Qualified consultants researched"
            className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <label className="block text-sm">
          <span className="text-gray-600">Target</span>
          <input
            required
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            placeholder="e.g. 30"
            className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <label className="block text-sm">
          <span className="text-gray-600">Period</span>
          <input
            required
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            placeholder="e.g. 2026-08"
            className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save KPI'}
          </button>
        </div>
      </form>
    </HrModalShell>
  );
}
