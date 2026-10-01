'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Link2, Mail, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

type ClaimLink = {
  status: 'not_generated' | 'generated' | 'emailed' | 'claimed' | 'expired';
  claimUrl: string | null;
  expiresAt: string | null;
  emailedAt: string | null;
  claimedAt: string | null;
  claimedBy: string | null;
  legacy: boolean;
};

const STATUS_LABEL: Record<ClaimLink['status'], string> = {
  not_generated: 'Not generated',
  generated: 'Link generated (not opened)',
  emailed: 'Invite emailed',
  claimed: 'Claimed',
  expired: 'Expired',
};

export function ClaimLinkCopyButton({ kind, id }: { kind: 'professionals' | 'artisans'; id: string }) {
  const [label, setLabel] = useState('Copy');
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs"
      onClick={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const link = (await api.post(`/admin/${kind}/${id}/claim-link`, {})) as ClaimLink;
        if (!link.claimUrl) {
          setLabel(link.status === 'claimed' ? 'Claimed' : 'No link');
          return;
        }
        await navigator.clipboard.writeText(link.claimUrl);
        setLabel('Copied');
      }}
    >
      <Copy className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

export default function ClaimLinkPanel({
  kind,
  id,
  email,
}: {
  kind: 'professionals' | 'artisans';
  id: string;
  email?: string | null;
}) {
  const [link, setLink] = useState<ClaimLink | null>(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const base = `/admin/${kind}/${id}/claim-link`;

  const run = async (method: 'get' | 'post', path = '', body?: Record<string, unknown>) => {
    setBusy(true);
    setNotice('');
    try {
      const next = (method === 'get' ? await api.get(base) : await api.post(`${base}${path}`, body || {})) as ClaimLink;
      setLink(next);
      return next;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to update the claim link.');
      return null;
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void run('get');
    // Load the current link once. Generate is a separate action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base]);

  const status = link?.status || 'not_generated';
  const statusText =
    status === 'emailed' && link?.emailedAt
      ? `Invite emailed (${new Date(link.emailedAt).toLocaleString()})`
      : status === 'claimed'
        ? `Claimed${link?.claimedAt ? ` (${new Date(link.claimedAt).toLocaleString()})` : ''}${link?.claimedBy ? ` by ${link.claimedBy}` : ''}`
        : STATUS_LABEL[status];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <Link2 className="h-4 w-4" />
        <span className="font-medium">Claim link</span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{link ? statusText : 'Not loaded'}</span>
      </div>
      <input
        readOnly
        value={link?.claimUrl || ''}
        placeholder="No link yet"
        className="w-full rounded-lg border px-3 py-2 text-xs"
        onFocus={(event) => event.currentTarget.select()}
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="rounded-full border px-3 py-1.5 text-sm" disabled={busy} onClick={() => run('get')}>
          Refresh
        </button>
        <button type="button" className="rounded-full bg-gray-950 px-3 py-1.5 text-sm text-white" disabled={busy} onClick={() => run('post')}>
          Generate link
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm"
          disabled={busy || !link?.claimUrl}
          onClick={async () => {
            if (!link?.claimUrl) return;
            await navigator.clipboard.writeText(link.claimUrl);
            setNotice('Claim link copied. No email was sent.');
          }}
        >
          <Copy className="h-3.5 w-3.5" /> Copy claim link
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm"
          disabled={busy || !email}
          title={email ? 'Send the claim link to the email on this listing' : 'Add an email address before sending a claim invite'}
          onClick={() => run('post', '/email', email ? { email } : {})}
        >
          <Mail className="h-3.5 w-3.5" /> Email claim invite to owner
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm"
          disabled={busy}
          onClick={() => {
            if (window.confirm('Regenerate the claim link? The previous link will stop working.')) void run('post', '/regenerate');
          }}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Regenerate link
        </button>
      </div>
      {link?.legacy ? (
        <p className="text-sm text-amber-800">A valid link was already issued, but it cannot be displayed. Regenerate it to get a copyable URL. That will invalidate the old link.</p>
      ) : null}
      {!email ? <p className="text-sm text-gray-500">No email address on this listing. You can still copy the link.</p> : null}
      {notice ? (
        <p className="inline-flex items-center gap-1 text-sm text-gray-700">
          <Check className="h-3.5 w-3.5" /> {notice}
        </p>
      ) : null}
    </div>
  );
}
