'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, CheckCheck, Loader2 } from 'lucide-react';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type NotificationItem,
} from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

function getNotificationLink(item: NotificationItem): string | null {
  const data = item.data;
  if (!data) return null;
  if (data.disputeId || (data.projectId && item.type?.includes('dispute')))
    return '/disputes';
  if (data.projectId) return '/projects';
  if (data.interestId || data.rentalListingId) return '/rentals';
  if (data.houseForSaleId || item.type === 'house_viewing_request') return '/houses';
  if (data.landForSaleId || item.type === 'land_viewing_request') return '/land';
  if (item.type === 'manual_payment_declared') return '/projects';
  return null;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = data?.unreadCount ?? 0;
  const items = data?.items ?? [];

  const handleItemClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markRead.mutate(item.id);
    }
    setOpen(false);
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        <span className="hidden sm:inline">Notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-xs font-medium bg-red-500 text-white rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[28rem] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markAllRead.isPending}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                {markAllRead.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCheck className="w-4 h-4" />
                )}
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm">
                No notifications yet
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map((item) => {
                  const href = getNotificationLink(item);
                  const content = (
                    <div className="flex gap-3 p-4 text-left">
                      <div
                        className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${
                          item.isRead ? 'bg-gray-200' : 'bg-blue-500'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-medium ${
                            item.isRead ? 'text-gray-600' : 'text-gray-900'
                          }`}
                        >
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {item.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(item.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {!item.isRead && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            markRead.mutate(item.id);
                          }}
                          className="shrink-0 p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-blue-600"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );

                  return (
                    <li
                      key={item.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        !item.isRead ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      {href ? (
                        <Link
                          href={href}
                          onClick={() => handleItemClick(item)}
                          className="block"
                        >
                          {content}
                        </Link>
                      ) : (
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => handleItemClick(item)}
                          onKeyDown={(e) =>
                            e.key === 'Enter' && handleItemClick(item)
                          }
                          className="block cursor-pointer"
                        >
                          {content}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
