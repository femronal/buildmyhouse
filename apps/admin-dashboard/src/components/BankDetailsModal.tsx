'use client';

import { Banknote, X } from 'lucide-react';
import { useBankAccounts } from '@/hooks/useBankAccounts';

type Props = {
  userId: string | null;
  gcName: string;
  onClose: () => void;
};

export function BankDetailsModal({ userId, gcName, onClose }: Props) {
  const { data: accounts, isLoading, error } = useBankAccounts(userId ?? null);

  if (!userId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Bank Details — {gcName}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {isLoading && <div className="text-center py-12 text-gray-500">Loading...</div>}
          {error && <div className="text-center py-12 text-red-500">Failed to load bank details.</div>}
          {accounts && !isLoading && (
            <>
              {accounts.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No bank accounts added yet.</p>
              ) : (
                <div className="space-y-4">
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Banknote className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-medium">{acc.bankName}</span>
                        {acc.isDefault && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Account number</p>
                          <p className="text-base font-mono font-semibold text-gray-900">
                            {acc.accountNumber || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Account holder</p>
                          <p className="text-gray-700">{acc.accountOwnerName}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
