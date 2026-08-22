'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { FAMILY_OPTIONS, useCreateVendor } from '@/hooks/useVendors';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
};

export function AddVendorModal({ open, onClose, onCreated }: Props) {
  const createVendor = useCreateVendor();
  const [tradingName, setTradingName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [stateLabel, setStateLabel] = useState('Lagos');
  const [cityLabel, setCityLabel] = useState('');
  const [familyKey, setFamilyKey] = useState('');
  const [brands, setBrands] = useState('');
  const [acquisitionSource, setAcquisitionSource] = useState('whatsapp');
  const [acquisitionNote, setAcquisitionNote] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [saveAsInternalOnly, setSaveAsInternalOnly] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<Array<{ id: string; tradingName: string }>>([]);

  if (!open) return null;

  const reset = () => {
    setTradingName('');
    setContactName('');
    setPhone('');
    setWhatsapp('');
    setEmail('');
    setStateLabel('Lagos');
    setCityLabel('');
    setFamilyKey('');
    setBrands('');
    setAcquisitionSource('whatsapp');
    setAcquisitionNote('');
    setInternalNote('');
    setSaveAsInternalOnly(true);
    setError(null);
    setDuplicates([]);
  };

  const submit = async () => {
    setError(null);
    if (tradingName.trim().length < 2) {
      setError('Company / trading name is required.');
      return;
    }
    try {
      const result = await createVendor.mutateAsync({
        tradingName: tradingName.trim(),
        publicPhone: phone.trim() || undefined,
        publicWhatsApp: whatsapp.trim() || phone.trim() || undefined,
        publicEmail: email.trim() || undefined,
        stateLabel: stateLabel.trim() || undefined,
        stateKey: stateLabel.trim().toLowerCase() === 'lagos' ? 'ng-lagos' : undefined,
        cityLabel: cityLabel.trim() || undefined,
        acquisitionSource,
        acquisitionNote: acquisitionNote.trim() || undefined,
        internalNote: internalNote.trim() || undefined,
        saveAsInternalOnly,
        representative: contactName.trim()
          ? { name: contactName.trim(), phone: phone.trim() || undefined, isPrimary: true }
          : undefined,
        offerings: familyKey
          ? [
              {
                familyKey,
                brands: brands
                  .split(',')
                  .map((b) => b.trim())
                  .filter(Boolean),
                sellsRetail: true,
                sellsWholesale: true,
              },
            ]
          : undefined,
      });
      setDuplicates(result.possibleDuplicates || []);
      onCreated(result.id);
      reset();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to create vendor');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-lg max-w-xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Add vendor</h3>
            <p className="text-sm text-gray-500">Fast capture from WhatsApp or site leads</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <label className="block text-sm">
            <span className="text-gray-600">Company / trading name *</span>
            <input
              value={tradingName}
              onChange={(e) => setTradingName(e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2"
              placeholder="e.g. Apex Steel & Cement"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-gray-600">Contact person</span>
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">Phone</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">WhatsApp</span>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2"
                placeholder="Defaults to phone"
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-gray-600">State</span>
              <input
                value={stateLabel}
                onChange={(e) => setStateLabel(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">City / area</span>
              <input
                value={cityLabel}
                onChange={(e) => setCityLabel(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-gray-600">What they sell (family)</span>
              <select
                value={familyKey}
                onChange={(e) => setFamilyKey(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 bg-white"
              >
                <option value="">Skip for now</option>
                {FAMILY_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">Brands (comma-separated)</span>
              <input
                value={brands}
                onChange={(e) => setBrands(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2"
                placeholder="Dangote, BUA"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-gray-600">Source</span>
              <select
                value={acquisitionSource}
                onChange={(e) => setAcquisitionSource(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 bg-white"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="admin_manual">Admin manual</option>
                <option value="project_supplier">Project supplier</option>
                <option value="contractor_referral">Contractor referral</option>
                <option value="customer_referral">Customer referral</option>
                <option value="field_team">Field team</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">Source note</span>
              <input
                value={acquisitionNote}
                onChange={(e) => setAcquisitionNote(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="text-gray-600">Internal note</span>
            <textarea
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 min-h-[80px]"
              placeholder="Responds quickly on WhatsApp…"
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={saveAsInternalOnly}
              onChange={(e) => setSaveAsInternalOnly(e.target.checked)}
            />
            Save as internal only (not public)
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {duplicates.length > 0 && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Possible duplicates flagged: {duplicates.map((d) => d.tradingName).join(', ')}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={createVendor.isPending}
              onClick={submit}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createVendor.isPending ? 'Saving…' : 'Save vendor'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
