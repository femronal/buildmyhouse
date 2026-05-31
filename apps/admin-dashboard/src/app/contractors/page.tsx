'use client';

import { useMemo, useState } from 'react';
import { Banknote, Eye, Layers3, MessageSquare, Search } from 'lucide-react';
import { useContractors } from '@/hooks/useContractors';
import { ContractorViewModal } from '@/components/ContractorViewModal';
import { BankDetailsModal } from '@/components/BankDetailsModal';
import { ProjectScopesModal } from '@/components/ProjectScopesModal';

export default function ContractorsPage() {
  const [query, setQuery] = useState('');
  const [viewUserId, setViewUserId] = useState<string | null>(null);
  const [bankDetailsUserId, setBankDetailsUserId] = useState<string | null>(null);
  const [bankDetailsName, setBankDetailsName] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [majorSpecialtyFilter, setMajorSpecialtyFilter] = useState<'all' | 'repairer' | 'upgrader' | 'renovator' | 'general_contractor'>('all');
  const [minorSpecialtyFilter, setMinorSpecialtyFilter] = useState<'all' | string>('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [activityFilter, setActivityFilter] = useState<'all' | 'high_quality' | 'high_volume' | 'newer'>('all');
  const [projectScopesGC, setProjectScopesGC] = useState<{
    userId: string;
    name: string;
    email?: string;
  } | null>(null);

  const { data: contractors = [], isLoading } = useContractors();

  const minorSpecialtyOptions = useMemo(() => {
    const tags = contractors.flatMap((contractor) => contractor.specialtyTags || []);
    const unique = Array.from(new Set(tags.map((tag) => String(tag || '').trim()).filter(Boolean)));
    return unique.sort((a, b) => a.localeCompare(b));
  }, [contractors]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const locationQuery = locationFilter.toLowerCase().trim();
    return contractors.filter((c) => {
      const email = c.user?.email ?? '';
      const name = c.name ?? c.user?.fullName ?? '';
      const specialty = c.specialty ?? '';
      const location = c.location ?? '';
      const minorTags = c.specialtyTags || [];

      const matchesSearch =
        !q ||
        name.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        specialty.toLowerCase().includes(q) ||
        minorTags.some((tag) => tag.toLowerCase().includes(q));
      if (!matchesSearch) return false;

      if (verificationFilter === 'verified' && !c.verified) return false;
      if (verificationFilter === 'unverified' && c.verified) return false;

      if (majorSpecialtyFilter !== 'all' && c.specialtyCategory !== majorSpecialtyFilter) return false;

      if (
        minorSpecialtyFilter !== 'all' &&
        !(c.specialtyTags || []).some((tag) => tag.toLowerCase() === minorSpecialtyFilter.toLowerCase())
      ) {
        return false;
      }

      if (locationQuery && !location.toLowerCase().includes(locationQuery)) return false;

      if (activityFilter === 'high_quality' && Number(c.rating || 0) < 4.5) return false;
      if (activityFilter === 'high_volume' && Number(c.projects || 0) < 20) return false;
      if (activityFilter === 'newer' && Number(c.experienceYears || 0) > 3) return false;

      return true;
    });
  }, [
    activityFilter,
    contractors,
    locationFilter,
    majorSpecialtyFilter,
    minorSpecialtyFilter,
    query,
    verificationFilter,
  ]);

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
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="relative md:col-span-2 xl:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, specialty..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value as typeof verificationFilter)}
            className="w-full px-3 py-2 border rounded-lg bg-white"
          >
            <option value="all">All verification</option>
            <option value="verified">Verified only</option>
            <option value="unverified">Unverified only</option>
          </select>

          <select
            value={majorSpecialtyFilter}
            onChange={(e) => setMajorSpecialtyFilter(e.target.value as typeof majorSpecialtyFilter)}
            className="w-full px-3 py-2 border rounded-lg bg-white"
          >
            <option value="all">All major specialties</option>
            <option value="general_contractor">General Contractor</option>
            <option value="renovator">Renovator</option>
            <option value="upgrader">Upgrader</option>
            <option value="repairer">Repairer</option>
          </select>

          <select
            value={minorSpecialtyFilter}
            onChange={(e) => setMinorSpecialtyFilter(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white"
          >
            <option value="all">All minor specialties</option>
            {minorSpecialtyOptions.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>

          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value as typeof activityFilter)}
            className="w-full px-3 py-2 border rounded-lg bg-white"
          >
            <option value="all">All activity levels</option>
            <option value="high_quality">High quality (4.5+ rating)</option>
            <option value="high_volume">High volume (20+ projects)</option>
            <option value="newer">Newer talent (0-3 years)</option>
          </select>
        </div>
        <div className="mt-3">
          <input
            type="text"
            placeholder="Optional location filter (e.g. Lagos, Ibadan, Surulere)"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                        <div className="text-xs text-gray-400 flex flex-wrap gap-1 items-center">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] ${c.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {c.verified ? 'Verified' : 'Unverified'}
                          </span>
                          {c.specialtyCategory ? (
                            <span className="inline-flex rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px]">
                              {c.specialtyCategory.replace('_', ' ')}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {c.location || '—'}
                          {c.specialty ? ` • ${c.specialty}` : ''}
                        </div>
                        {!!c.specialtyTags?.length && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {c.specialtyTags.slice(0, 4).map((tag) => (
                              <span key={`${c.id}-${tag}`} className="inline-flex rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 text-[10px]">
                                {tag}
                              </span>
                            ))}
                            {c.specialtyTags.length > 4 ? (
                              <span className="inline-flex rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 text-[10px]">
                                +{c.specialtyTags.length - 4}
                              </span>
                            ) : null}
                          </div>
                        )}
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
                        {c.verified && !!userId && (
                          <button
                            onClick={() =>
                              setProjectScopesGC({
                                userId,
                                name: displayName,
                                email,
                              })
                            }
                            className="px-3 py-2 text-xs bg-gray-900 text-white rounded-lg flex items-center gap-1"
                          >
                            <Layers3 className="w-3.5 h-3.5" />
                            Project Scopes
                          </button>
                        )}
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
      <ProjectScopesModal contractor={projectScopesGC} onClose={() => setProjectScopesGC(null)} />
    </div>
  );
}
