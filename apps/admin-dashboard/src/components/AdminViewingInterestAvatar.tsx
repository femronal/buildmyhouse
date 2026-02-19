'use client';

import { useMemo, useState } from 'react';
import { User, Mail, Phone, Home } from 'lucide-react';
import { getBackendAssetUrl } from '@/lib/image';
import { useHouseViewingInterests } from '@/hooks/useHouseViewingInterests';

export default function AdminViewingInterestAvatar() {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, interests, markAllRead, isMarkingRead } =
    useHouseViewingInterests();

  const sortedInterests = useMemo(
    () => [...interests].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [interests],
  );

  const handleToggle = async () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen && unreadCount > 0 && !isMarkingRead) {
      await markAllRead();
    }
  };

  return (
    <div className="fixed top-5 right-6 z-50">
      <button
        type="button"
        onClick={handleToggle}
        className="relative w-12 h-12 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center"
        aria-label="Viewing interest notifications"
      >
        <User className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500" />
        )}
      </button>

      {isOpen && (
        <div className="mt-3 w-[360px] max-h-[75vh] overflow-auto rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="px-4 py-3 border-b">
            <p className="font-semibold text-gray-900">Homeowners interested in houses</p>
            <p className="text-xs text-gray-500">
              {sortedInterests.length} request{sortedInterests.length === 1 ? '' : 's'}
            </p>
          </div>
          {sortedInterests.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No viewing requests yet.</div>
          ) : (
            <div className="divide-y">
              {sortedInterests.map((interest) => {
                const avatarUrl = getBackendAssetUrl(interest.homeowner.pictureUrl);
                const houseImage = interest.houseForSale.images?.[0]?.url
                  ? getBackendAssetUrl(interest.houseForSale.images[0].url)
                  : null;

                return (
                  <div key={interest.id} className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {interest.homeowner.fullName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(interest.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm text-gray-700">
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{interest.homeowner.email}</span>
                      </p>
                      {interest.homeowner.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{interest.homeowner.phone}</span>
                        </p>
                      )}
                      <p className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-gray-400" />
                        <span className="truncate">
                          Interested in: {interest.houseForSale.name}
                        </span>
                      </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-2 flex items-center gap-2">
                      {houseImage && (
                        <img src={houseImage} alt="" className="w-14 h-14 rounded object-cover" />
                      )}
                      <div className="text-xs text-gray-600">
                        <p className="font-medium text-gray-800">{interest.houseForSale.location}</p>
                        <p>${interest.houseForSale.price.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
