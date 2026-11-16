'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function InvoiceBankAccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNotice, setAccountNotice] = useState('');

  const accountQuery = useQuery({
    queryKey: ['funding-account'],
    queryFn: () => api.get<{ account: { bankName: string; accountNumber: string; accountName: string } | null }>('/funding/account'),
    enabled: open,
  });

  useEffect(() => {
    const account = accountQuery.data?.account;
    if (!account) return;
    setBankName((value) => value || account.bankName);
    setAccountNumber((value) => value || account.accountNumber);
    setAccountName((value) => value || account.accountName);
  }, [accountQuery.data]);

  const saveAccountMutation = useMutation({
    mutationFn: () => api.patch('/funding/account', { bankName, accountNumber, accountName }),
    onSuccess: async () => {
      setAccountNotice('Saved. New invoices use this account.');
      await queryClient.invalidateQueries({ queryKey: ['funding-account'] });
    },
    onError: (error: Error) => setAccountNotice(error.message || 'Could not save the account'),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg space-y-3 rounded-xl bg-white p-6 shadow-lg" role="dialog" aria-label="Invoice bank account">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-900">Payment account for invoices</p>
            <p className="mt-1 text-xs text-gray-500">
              This is the account on today’s invoice. Change it when the bank changes. An invoice already sent keeps the account it was sent with until you resend it.
            </p>
          </div>
          <button type="button" className="min-h-11 px-2 text-sm text-gray-500" onClick={onClose}>Close</button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Bank name" value={bankName} onChange={(event) => setBankName(event.target.value)} />
          <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Account number" value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} />
          <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Account name" value={accountName} onChange={(event) => setAccountName(event.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-50"
            disabled={saveAccountMutation.isPending}
            onClick={() => {
              setAccountNotice('');
              saveAccountMutation.mutate();
            }}
          >
            Save account
          </button>
          {accountNotice ? <p className="text-sm text-gray-600">{accountNotice}</p> : null}
        </div>
      </div>
    </div>
  );
}
