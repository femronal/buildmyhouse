'use client';

import { Award, ShieldCheck, ShieldX, X } from 'lucide-react';
import { useGCProfile } from '@/hooks/useGCProfile';
import { getBackendAssetUrl } from '@/lib/image';

type Props = {
  userId: string | null;
  onClose: () => void;
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value || '—'}</p>
    </div>
  );
}

export function ContractorViewModal({ userId, onClose }: Props) {
  const { data: profile, isLoading, error } = useGCProfile(userId ?? null);

  if (!userId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">GC Profile</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isLoading && <div className="text-center py-12 text-gray-500">Loading...</div>}
          {error && <div className="text-center py-12 text-red-500">Failed to load profile.</div>}
          {profile && !isLoading && (
            <>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  {profile.pictureUrl ? (
                    <img
                      src={getBackendAssetUrl(profile.pictureUrl) ?? ''}
                      alt={profile.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-gray-500 bg-gray-200">
                      {profile.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xl font-semibold">{profile.fullName}</h4>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${
                        profile.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {profile.verified ? (
                        <>
                          <ShieldCheck className="w-3 h-3" />
                          Verified
                        </>
                      ) : (
                        <>
                          <ShieldX className="w-3 h-3" />
                          Not verified
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{profile.specialty}</p>
                  <p className="text-sm text-gray-500">{profile.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="text-sm font-semibold text-gray-700">Contact</h5>
                <div className="grid gap-3">
                  <InfoRow label="Email" value={profile.email} />
                  <InfoRow label="Phone" value={profile.phone} />
                  <InfoRow label="Location" value={profile.location} />
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="text-sm font-semibold text-gray-700">Professional</h5>
                <div className="grid gap-3">
                  <InfoRow label="Specialty" value={profile.specialty} />
                  <InfoRow label="Years of experience" value={profile.experience} />
                  <InfoRow label="Rating" value={profile.rating ? `⭐ ${profile.rating.toFixed(1)}` : '—'} />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h5 className="text-sm font-semibold text-gray-700">Activity</h5>
                <div className="grid gap-3">
                  <InfoRow label="Total projects" value={String(profile.totalProjects)} />
                  <InfoRow label="Active projects" value={String(profile.activeProjects)} />
                  <InfoRow label="Completed projects" value={String(profile.completedProjects)} />
                  <InfoRow label="Total earnings" value={profile.totalEarnings ? `$${profile.totalEarnings.toLocaleString()}` : '—'} />
                </div>
              </div>

              {profile.certifications && profile.certifications.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <h5 className="text-sm font-semibold text-gray-700">Certifications</h5>
                  <div className="space-y-2">
                    {profile.certifications.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 text-sm">
                        <Award className="w-4 h-4 text-blue-600" />
                        <span>{c.name}</span>
                        {c.expiryYear && (
                          <span className="text-gray-500 text-xs">(Expires: {c.expiryYear})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
