'use client';

import { useState } from 'react';
import PartnerProgramNav from '@/components/growth/PartnerProgramNav';
import { usePartnerRules } from '@/hooks/useReferrals';
import { api } from '@/lib/api';
import { naira } from '@/lib/referrals';

export default function ReferralRulesPage() {
  const query = usePartnerRules();
  const [status, setStatus] = useState('');
  const [rate, setRate] = useState('250');
  const [days, setDays] = useState('30');
  const [referrerAmount, setReferrerAmount] = useState('');
  const example = query.data?.example;
  const published = (query.data?.rules || []).find((rule) => rule.program === 'affiliate' && rule.status === 'published');

  const publish = async (program: 'affiliate' | 'referrer', publishRule: boolean) => {
    setStatus('');
    try {
      await api.post('/admin/referrals/rules', {
        program,
        publish: publishRule,
        rateBps: program === 'affiliate' ? Number(rate) : undefined,
        clickWindowDays: Number(days),
        rewardKind: program === 'referrer' ? (publishRule ? 'fixed' : 'unpublished') : 'percent',
        fixedRewardNaira: program === 'referrer' && referrerAmount ? Number(referrerAmount) : undefined,
      });
      setStatus('Saved. Existing affiliate agreements keep the rate they were given.');
      await query.refetch();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not save.');
    }
  };

  return (
    <div className="min-h-full bg-gray-100 p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Program rules</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">
        Affiliate commission is a percentage of the contractor amount, paid from the 10% controlling fee. The 20% contingency is excluded.
        A published rule does not rewrite commissions already calculated.
      </p>
      <div className="mt-4">
        <PartnerProgramNav />
      </div>
      {example ? (
        <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-900">₦50 million contractor amount</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Contingency, untouched" value={naira(example.contingencyAmount)} />
            <Stat label="Controlling fee" value={naira(example.controllingFeeAmount)} />
            <Stat label={`Affiliate at ${example.rateBps / 100}%`} value={naira(example.commission)} />
            <Stat label="BuildMyHouse keeps" value={naira(example.bmhRetainedControllingFee)} />
          </dl>
          <p className="mt-3 text-xs text-gray-500">
            BuildMyHouse also keeps whatever part of the contingency is later retained. That amount is not used to pay an affiliate.
          </p>
        </section>
      ) : null}
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Affiliate rate</h2>
        <p className="mt-1 text-xs text-gray-500">
          Current published rate: {published ? `${Number(published.rateBps) / 100}%` : 'not published'}. Click window{' '}
          {published ? `${published.clickWindowDays} days` : '30 days'}.
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="text-sm">
            Basis points
            <input className="mt-1 block w-32 rounded-lg border px-3 py-2" value={rate} onChange={(event) => setRate(event.target.value)} />
          </label>
          <label className="text-sm">
            Click window, days
            <input className="mt-1 block w-32 rounded-lg border px-3 py-2" value={days} onChange={(event) => setDays(event.target.value)} />
          </label>
          <button type="button" className="rounded-lg bg-black px-4 py-2 text-sm text-white" onClick={() => publish('affiliate', true)}>
            Publish affiliate rule
          </button>
        </div>
        <h2 className="mt-6 text-sm font-semibold">One-time referrer reward</h2>
        <p className="mt-1 text-xs text-gray-500">
          Ordinary referrers, including contractor invite links, are not paid the lifetime affiliate rate. Leave this unpublished until a reward is agreed.
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="text-sm">
            Fixed amount, naira
            <input className="mt-1 block w-40 rounded-lg border px-3 py-2" value={referrerAmount} onChange={(event) => setReferrerAmount(event.target.value)} />
          </label>
          <button type="button" className="rounded-lg border bg-white px-4 py-2 text-sm" onClick={() => publish('referrer', false)}>
            Keep unpublished
          </button>
          <button type="button" className="rounded-lg bg-black px-4 py-2 text-sm text-white" onClick={() => publish('referrer', true)}>
            Publish one-time reward
          </button>
        </div>
        {status ? <p className="mt-3 text-sm text-gray-700">{status}</p> : null}
      </section>
      <section className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Program</th>
              <th className="px-4 py-3">Version</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Rate</th>
              <th className="px-4 py-3">Window</th>
            </tr>
          </thead>
          <tbody>
            {(query.data?.rules || []).map((rule) => (
              <tr key={String(rule.id)} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3">{String(rule.program)}</td>
                <td className="px-4 py-3">{String(rule.version)}</td>
                <td className="px-4 py-3">{String(rule.status)}</td>
                <td className="px-4 py-3">
                  {rule.rewardKind === 'fixed' ? naira(Number(rule.fixedRewardNaira || 0)) : rule.rateBps ? `${Number(rule.rateBps) / 100}%` : 'Unpublished'}
                </td>
                <td className="px-4 py-3">{String(rule.clickWindowDays)} days</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-gray-900">{value}</dd>
    </div>
  );
}
