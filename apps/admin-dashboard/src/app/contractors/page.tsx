'use client';

import { useMemo, useState } from 'react';
import { Banknote, Eye, MessageSquare, Search } from 'lucide-react';
import { useContractors } from '@/hooks/useContractors';
import { ContractorViewModal } from '@/components/ContractorViewModal';
import { BankDetailsModal } from '@/components/BankDetailsModal';

export default function ContractorsPage() {
  const [query, setQuery] = useState('');
  const [viewUserId, setViewUserId] = useState<string | null>(null);
  const [bankDetailsUserId, setBankDetailsUserId] = useState<string | null>(null);
  const [bankDetailsName, setBankDetailsName] = useState('');

  const { data: contractors = [], isLoading } = useContractors();

  const filtered = useMemo(() => {
    if (!query.trim()) return contractors;
    const q = query.toLowerCase();
    return contractors.filter((c) => {
      const email = c.user?.email ?? '';
      const name = c.name ?? c.user?.fullName ?? '';
      return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
    });
  }, [contractors, query]);

  const messageGC = (email: string) => {
    if (email) window.location.href = `mailto:${email}`;
  };

  const checkBankDetails = (userId: string, name: string) => {
    setBankDetailsUserId(userId);
    setBankDetailsName(name);
  };

  const viewContractor = (userId: string) => {
    setViewUserId(userId);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-poppins">Contractors</h1>
          <p className="text-gray-500 mt-1">Manage the relationship between GCs and BuildMyHouse</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search contractors by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contractor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading && (
              <tr>
                <td colSpan={2} className="px-6 py-10 text-center text-gray-500">
                  Loading contractors…
                </td>
              </tr>
            )}

            {!isLoading &&
              filtered.map((c) => {
                const userId = c.userId ?? c.user?.id;
                const email = c.user?.email ?? '';
                const displayName = c.name ?? c.user?.fullName ?? '—';

                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{displayName}</div>
                        <div className="text-sm text-gray-500">{email || '—'}</div>
                        <div className="text-xs text-gray-400">
                          {c.location || '—'}
                          {c.specialty ? ` • ${c.specialty}` : ''}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => userId && viewContractor(userId)}
                          disabled={!userId}
                          className="px-3 py-2 text-xs border rounded-lg flex items-center gap-1 disabled:opacity-50"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                        <button
                          disabled={!userId}
                          onClick={() => userId && checkBankDetails(userId, displayName)}
                          className="px-3 py-2 text-xs border rounded-lg flex items-center gap-1 disabled:opacity-50"
                        >
                          <Banknote className="w-3.5 h-3.5" />
                          Check bank details
                        </button>
                        <button
                          disabled={!email}
                          onClick={() => messageGC(email)}
                          className="px-3 py-2 text-xs bg-blue-600 text-white rounded-lg flex items-center gap-1 disabled:opacity-50"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Message GC
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={2} className="px-6 py-12 text-center text-gray-500">
                  No contractors found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ContractorViewModal userId={viewUserId} onClose={() => setViewUserId(null)} />
      <BankDetailsModal
        userId={bankDetailsUserId}
        gcName={bankDetailsName}
        onClose={() => {
          setBankDetailsUserId(null);
          setBankDetailsName('');
        }}
      />
    </div>
  );
}
