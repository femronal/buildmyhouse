'use client';

import { Inbox } from 'lucide-react';

type PiEmptyStateProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
};

export default function PiEmptyState({ title, description, icon }: PiEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 rounded-full bg-gray-100 p-3 text-gray-400">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <p className="text-sm font-medium text-gray-900">{title}</p>
      {description ? <p className="mt-1 max-w-md text-sm text-gray-500">{description}</p> : null}
    </div>
  );
}
