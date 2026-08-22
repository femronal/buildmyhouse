'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import {
  LISTING_STATUS_LABELS,
  VERIFICATION_CHECK_OPTIONS,
  VERIFICATION_STATUS_LABELS,
  useUpdateVendor,
  useVendor,
  useVendorAction,
} from '@/hooks/useVendors';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-white rounded-xl shadow p-5 space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium mt-0.5 break-words">{value || '—'}</p>
    </div>
  );
}

export default function VendorDetailPage() {
  const params = useParams();
  const id = String(params?.id || '');
  const { data: vendor, isLoading, error } = useVendor(id || null);
  const actions = useVendorAction(id);
  const updateVendor = useUpdateVendor(id);

  const [clarification, setClarification] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [note, setNote] = useState('');
  const [activityType, setActivityType] = useState('contacted');
  const [activityNote, setActivityNote] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [checkState, setCheckState] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!vendor) return;
    setInviteEmail(vendor.publicEmail || '');
    const next: Record<string, string> = {};
    for (const opt of VERIFICATION_CHECK_OPTIONS) {
      next[opt.key] =
        vendor.verificationChecks?.find((c) => c.checkKey === opt.key)?.status || 'not_started';
    }
    setCheckState(next);
  }, [vendor]);

  const primaryPhone = vendor?.publicWhatsApp || vendor?.publicPhone || '';
  const whatsappHref = useMemo(() => {
    if (!primaryPhone) return null;
    const digits = primaryPhone.replace(/\D/g, '');
    return `https://wa.me/${digits}`;
  }, [primaryPhone]);

  const run = async (label: string, fn: () => Promise<unknown>) => {
    setFeedback(null);
    try {
      await fn();
      setFeedback(label);
    } catch (e: any) {
      setFeedback(e?.message || 'Action failed');
    }
  };

  if (!id) {
    return <div className="p-8">Missing vendor id</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/vendors" className="p-2 rounded-lg border hover:bg-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold font-poppins truncate">
            {isLoading ? 'Loading…' : vendor?.tradingName || 'Vendor'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {vendor?.applicationReference || vendor?.slug}
            {vendor ? ` · Completeness ${vendor.profileCompleteness}%` : ''}
          </p>
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {feedback}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load vendor. {(error as Error).message}
        </div>
      )}

      {vendor && (
        <>
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {LISTING_STATUS_LABELS[vendor.listingStatus]}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800">
              {VERIFICATION_STATUS_LABELS[vendor.verificationStatus]}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              Claim: {vendor.claimStatus}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              Procurement: {vendor.procurementRelationship}
            </span>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2 space-y-4">
              <Section title="Identity">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Row label="Trading name" value={vendor.tradingName} />
                  <Row label="Legal name" value={vendor.legalName} />
                  <Row label="Description" value={vendor.description} />
                  <Row label="Years / established" value={vendor.yearEstablished} />
                  <Row label="Business types" value={vendor.businessTypes?.join(', ')} />
                  <Row label="Website" value={vendor.websiteUrl} />
                </div>
              </Section>

              <Section title="Location">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Row label="Public city / state" value={[vendor.cityLabel, vendor.stateLabel].filter(Boolean).join(', ')} />
                  <Row label="Public address" value={vendor.publicAddress} />
                  <Row label="Private business address" value={vendor.privateBusinessAddress} />
                  <Row
                    label="Delivery areas"
                    value={
                      vendor.serviceAreas?.length
                        ? vendor.serviceAreas
                            .map((a) => a.cityLabel || a.stateLabel || a.stateKey)
                            .filter(Boolean)
                            .join(', ')
                        : vendor.nationwideDelivery
                          ? 'Nationwide'
                          : '—'
                    }
                  />
                </div>
              </Section>

              <Section title="What they sell">
                {(vendor.offerings || []).length === 0 && (
                  <p className="text-sm text-gray-500">No offerings recorded yet.</p>
                )}
                <div className="space-y-3">
                  {(vendor.offerings || []).map((o, idx) => (
                    <div key={idx} className="rounded-lg border p-3">
                      <p className="font-medium text-sm">
                        {o.customCategoryLabel || o.familyKey || 'Category'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Brands: {(o.brands || []).join(', ') || '—'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {[
                          o.sellsRetail ? 'Retail' : null,
                          o.sellsWholesale ? 'Wholesale' : null,
                          o.deliveryAvailable ? 'Delivery' : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Private verification documents">
                {(vendor.documents || []).length === 0 && (
                  <p className="text-sm text-gray-500">No documents uploaded.</p>
                )}
                <ul className="space-y-2">
                  {(vendor.documents || []).map((doc) => (
                    <li key={doc.id} className="text-sm border rounded-lg px-3 py-2">
                      <span className="font-medium">{doc.documentType}</span>
                      <span className="text-gray-500"> · {doc.reviewStatus}</span>
                      <div className="text-xs text-gray-400 break-all mt-1">{doc.fileRef}</div>
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title="Quote requests">
                {(vendor.quoteRequests || []).length === 0 && (
                  <p className="text-sm text-gray-500">No quote requests yet.</p>
                )}
                <ul className="space-y-2">
                  {(vendor.quoteRequests || []).map((q) => (
                    <li key={q.id} className="text-sm border rounded-lg px-3 py-2">
                      <span className="font-medium">{q.product}</span> — {q.buyerName}
                      <span className="text-gray-500"> · {q.status}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            </div>

            <div className="space-y-4">
              <Section title="Contact (ops)">
                <div className="space-y-3">
                  <Row label="Phone" value={vendor.publicPhone} />
                  <Row label="WhatsApp" value={vendor.publicWhatsApp} />
                  <Row label="Email" value={vendor.publicEmail} />
                  <Row label="Quotation email" value={vendor.quotationEmail} />
                  <Row label="Sales contact" value={vendor.salesContactName} />
                  <Row
                    label="Representative"
                    value={vendor.representatives?.[0]?.name}
                  />
                  <div className="flex flex-wrap gap-2 pt-1">
                    {primaryPhone && (
                      <a
                        href={`tel:${primaryPhone}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm"
                      >
                        <Phone className="w-4 h-4" /> Call
                      </a>
                    )}
                    {whatsappHref && (
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm"
                      >
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                      </a>
                    )}
                    {(vendor.quotationEmail || vendor.publicEmail) && (
                      <a
                        href={`mailto:${vendor.quotationEmail || vendor.publicEmail}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm"
                      >
                        <Mail className="w-4 h-4" /> Email
                      </a>
                    )}
                  </div>
                </div>
              </Section>

              <Section title="Listing review">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg border text-sm"
                    disabled={actions.underReview.isPending}
                    onClick={() => run('Moved to under review', () => actions.underReview.mutateAsync())}
                  >
                    Under review
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm"
                    disabled={actions.approveListing.isPending}
                    onClick={() =>
                      run('Listing approved (not verified)', () =>
                        actions.approveListing.mutateAsync({}),
                      )
                    }
                  >
                    Approve listing
                  </button>
                  {vendor.listingStatus === 'suspended' ? (
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg border text-sm"
                      disabled={actions.restore.isPending}
                      onClick={() => run('Vendor restored', () => actions.restore.mutateAsync({}))}
                    >
                      Restore
                    </button>
                  ) : null}
                </div>

                <div className="space-y-2 pt-2">
                  <textarea
                    value={clarification}
                    onChange={(e) => setClarification(e.target.value)}
                    placeholder="Clarification message to vendor…"
                    className="w-full border rounded-lg px-3 py-2 text-sm min-h-[70px]"
                  />
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg border text-sm"
                    disabled={actions.requestClarification.isPending || clarification.trim().length < 3}
                    onClick={() =>
                      run('Clarification requested', () =>
                        actions.requestClarification.mutateAsync({
                          clarificationMessage: clarification.trim(),
                        }),
                      )
                    }
                  >
                    Request clarification
                  </button>
                </div>

                <div className="space-y-2 pt-2">
                  <input
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Rejection reason"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm"
                    disabled={actions.reject.isPending || rejectReason.trim().length < 3}
                    onClick={() =>
                      run('Application rejected', () =>
                        actions.reject.mutateAsync({ reason: rejectReason.trim() }),
                      )
                    }
                  >
                    Reject
                  </button>
                </div>

                <div className="space-y-2 pt-2">
                  <input
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Suspension reason"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-red-700 text-white text-sm"
                    disabled={actions.suspend.isPending || suspendReason.trim().length < 3}
                    onClick={() =>
                      run('Vendor suspended', () =>
                        actions.suspend.mutateAsync({ reason: suspendReason.trim() }),
                      )
                    }
                  >
                    Suspend
                  </button>
                </div>
              </Section>

              <Section title="BuildMyHouse verification">
                <p className="text-xs text-gray-500">
                  Verification is separate from public listing. Only mark verified after checks are
                  completed.
                </p>
                <div className="space-y-2">
                  {VERIFICATION_CHECK_OPTIONS.map((opt) => (
                    <label key={opt.key} className="flex items-center justify-between gap-3 text-sm">
                      <span>{opt.label}</span>
                      <select
                        value={checkState[opt.key] || 'not_started'}
                        onChange={(e) =>
                          setCheckState((prev) => ({ ...prev, [opt.key]: e.target.value }))
                        }
                        className="border rounded-lg px-2 py-1 bg-white"
                      >
                        <option value="not_started">Not started</option>
                        <option value="pending">Pending</option>
                        <option value="passed">Passed</option>
                        <option value="failed">Failed</option>
                        <option value="not_applicable">N/A</option>
                        <option value="expired">Expired</option>
                      </select>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm"
                  disabled={actions.upsertChecks.isPending}
                  onClick={() =>
                    run('Verification checks saved', () =>
                      actions.upsertChecks.mutateAsync({
                        checks: VERIFICATION_CHECK_OPTIONS.map((opt) => ({
                          checkKey: opt.key,
                          status: checkState[opt.key] || 'not_started',
                        })),
                        markVerifiedIfReady: true,
                      }),
                    )
                  }
                >
                  <ShieldCheck className="w-4 h-4" />
                  Save checks / mark verified if ready
                </button>
              </Section>

              <Section title="Claim invite">
                <input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Vendor email"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg border text-sm"
                  disabled={actions.claimInvite.isPending || !inviteEmail.trim()}
                  onClick={async () => {
                    try {
                      const res = await actions.claimInvite.mutateAsync({
                        email: inviteEmail.trim(),
                      });
                      setInviteUrl(res.claimUrl);
                      setFeedback(`Invite sent to ${res.email}`);
                    } catch (e: any) {
                      setFeedback(e?.message || 'Invite failed');
                    }
                  }}
                >
                  Send claim invite
                </button>
                {inviteUrl && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-xs text-blue-700"
                    onClick={() => navigator.clipboard.writeText(inviteUrl)}
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy invite link
                  </button>
                )}
              </Section>

              <Section title="Procurement / relationship">
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                  value={vendor.procurementRelationship}
                  disabled={updateVendor.isPending}
                  onChange={(e) =>
                    run('Procurement status updated', () =>
                      updateVendor.mutateAsync({ procurementRelationship: e.target.value }),
                    )
                  }
                >
                  <option value="never_contacted">Never contacted</option>
                  <option value="contacted">Contacted</option>
                  <option value="quoted">Quoted</option>
                  <option value="purchased_from">Purchased from</option>
                  <option value="preferred">Preferred</option>
                  <option value="do_not_use">Do not use</option>
                </select>

                <div className="grid gap-2">
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="contacted">Contacted</option>
                    <option value="quotation_requested">Quotation requested</option>
                    <option value="quotation_received">Quotation received</option>
                    <option value="purchase_completed">Purchase completed</option>
                    <option value="verification_call">Verification call</option>
                    <option value="note">Note</option>
                    <option value="complaint">Complaint</option>
                  </select>
                  <textarea
                    value={activityNote}
                    onChange={(e) => setActivityNote(e.target.value)}
                    placeholder="Activity note…"
                    className="w-full border rounded-lg px-3 py-2 text-sm min-h-[70px]"
                  />
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg border text-sm"
                    disabled={actions.addActivity.isPending}
                    onClick={() =>
                      run('Activity logged', () =>
                        actions.addActivity.mutateAsync({
                          type: activityType,
                          note: activityNote.trim() || undefined,
                          summary: activityType.replace(/_/g, ' '),
                        }),
                      )
                    }
                  >
                    Log activity
                  </button>
                </div>
              </Section>

              <Section title="Private notes">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Internal note (never public)…"
                  className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px]"
                />
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg border text-sm"
                  disabled={actions.addNote.isPending || note.trim().length < 1}
                  onClick={() =>
                    run('Note saved', async () => {
                      await actions.addNote.mutateAsync({ body: note.trim() });
                      setNote('');
                    })
                  }
                >
                  Add note
                </button>
                <ul className="space-y-2 pt-2">
                  {(vendor.adminNotes || []).map((n) => (
                    <li key={n.id} className="text-sm border rounded-lg px-3 py-2 bg-gray-50">
                      <p>{n.body}</p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title="Activity history">
                <ul className="space-y-2">
                  {(vendor.activities || []).map((a) => (
                    <li key={a.id} className="text-sm border rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium">{a.summary || a.type}</span>
                      </div>
                      {a.note && <p className="text-gray-600 mt-1">{a.note}</p>}
                      <p className="text-[11px] text-gray-400 mt-1">
                        {new Date(a.createdAt).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              </Section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
