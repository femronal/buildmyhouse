'use client';

import { ShieldCheck, ShieldX, X } from 'lucide-react';
import { useUser } from '@/hooks/useUsers';
import { getBackendAssetUrl } from '@/lib/image';

type Props = {
  userId: string | null;
  onClose: () => void;
};

export function HomeownerViewModal({ userId, onClose }: Props) {
  const { data: user, isLoading, error } = useUser(userId ?? '');

  if (!userId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Personal Information</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isLoading && (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          )}
          {error && (
            <div className="text-center py-12 text-red-500">
              Failed to load user details.
            </div>
          )}
          {user && !isLoading && (
            <>
              {/* Profile photo & basic info */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  {user.pictureUrl ? (
                    <img
                      src={getBackendAssetUrl(user.pictureUrl) ?? ''}
                      alt={user.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-gray-500 bg-gray-200">
                      {user.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xl font-semibold">{user.fullName}</h4>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${
                        user.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {user.verified ? (
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
                  <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                </div>
              </div>

              {/* Fields - matching Personal Information page */}
              <div className="space-y-4">
                <h5 className="text-sm font-semibold text-gray-700">Basic Information</h5>
                <div className="grid gap-3">
                  <InfoRow label="Full name" value={user.fullName} />
                  <InfoRow label="Email" value={user.email} />
                  <InfoRow label="Phone number" value={user.phone} />
                  <InfoRow label="Role" value={user.role} />
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="text-sm font-semibold text-gray-700">Address</h5>
                <p className="text-xs text-gray-500 mb-2">From most recent project</p>
                <div className="grid gap-3">
                  <InfoRow label="Address" value={user.address} />
                  <InfoRow label="City" value={user.city} />
                  <InfoRow label="State" value={user.state} />
                  <InfoRow label="Country" value={user.country} />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h5 className="text-sm font-semibold text-gray-700">Activity</h5>
                <div className="grid gap-3">
                  <InfoRow label="Projects" value={String(user.projects ?? 0)} />
                  <InfoRow label="Last active" value={user.lastActive} />
                  <InfoRow label="Joined" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value || '—'}</p>
    </div>
  );
}
