'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useReferralList } from '@/hooks/useReferrals';
import { formatLagosDate } from '@/lib/referrals';

type Props = {
  targetType: 'project' | 'artisan_listing' | 'professional_listing' | 'vendor';
  targetId: string;
  currentId?: string | null;
  referralSource?: string | null;
  referredAt?: string | null;
  label?: string;
};

export function ReferrerSelect({
  targetType,
  targetId,
  currentId,
  referralSource,
  referredAt,
  label = 'Brought in by',
}: Props) {
  const list = useReferralList({});
  const [value, setValue] = useState(currentId || '');
  const [status, setStatus] = useState('');

  const save = async (next: string) => {
    setValue(next);
    setStatus('');
    try {
      await api.patch('/admin/referrals/attach', {
        targetType,
        targetId,
        referrerId: next || null,
      });
      setStatus('Saved.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not save.');
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <label className="text-sm font-medium text-gray-900" htmlFor={`referrer-${targetId}`}>
        {label}
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <select
          id={`referrer-${targetId}`}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          value={value}
          onChange={(event) => save(event.target.value)}
        >
          <option value="">No referrer</option>
          {(list.data || []).map((row) => (
            <option key={row.id} value={row.id}>
              {row.name} ({row.code})
            </option>
          ))}
        </select>
      </div>
      {targetType === 'project' && (referralSource || referredAt) ? (
        <p className="mt-2 text-xs text-gray-500">
          {referralSource ? `Source: ${referralSource.replace('_', ' ')}` : ''}
          {referredAt ? ` · ${formatLagosDate(referredAt)}` : ''}
        </p>
      ) : null}
      {status ? <p className="mt-2 text-xs text-gray-600">{status}</p> : null}
    </section>
  );
}
