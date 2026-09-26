'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useCreateVendor } from '@/hooks/useVendors';
import { VendorEditor, emptyVendorEditorValue, vendorEditorPayload, type VendorEditorValue } from './VendorEditor';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
};

export function AddVendorModal({ open, onClose, onCreated }: Props) {
  const createVendor = useCreateVendor();
  const [value, setValue] = useState<VendorEditorValue>(emptyVendorEditorValue());
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-50 rounded-xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Add vendor</h3>
            <p className="text-sm text-gray-500">Enter the public profile here. Keep private notes private.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <VendorEditor
            mode="create"
            value={value}
            onChange={setValue}
            submitting={createVendor.isPending}
            error={error}
            onSubmit={async () => {
              setError(null);
              if (value.tradingName.trim().length < 2) {
                setError('Company / trading name is required.');
                return;
              }
              try {
                const result = await createVendor.mutateAsync(vendorEditorPayload(value, 'create'));
                onCreated(result.id);
                setValue(emptyVendorEditorValue());
                onClose();
              } catch (err) {
                setError((err as Error).message || 'Failed to create vendor');
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
