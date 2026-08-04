'use client';

import { useHrPermissionCatalog, useHrRoles } from '@/hooks/usePeopleHr';

export default function PermissionsPage() {
  const { data: roles = [], isLoading } = useHrRoles();
  const { data: permissions = [] } = useHrPermissionCatalog();

  const grouped = permissions.reduce<Record<string, typeof permissions>>((acc, perm) => {
    acc[perm.groupLabel] = acc[perm.groupLabel] || [];
    acc[perm.groupLabel].push(perm);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Permissions</h2>
        <p className="text-sm text-gray-500">
          System access roles are separate from departments and job titles. Existing full admins keep
          wildcard access until assigned a limited staff role.
        </p>
      </div>

      {isLoading && <p className="text-gray-500">Loading…</p>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow">
          <h3 className="font-semibold">Internal roles</h3>
          <div className="mt-3 space-y-3">
            {roles.map((role) => (
              <div key={role.id} className="rounded-lg border p-3">
                <p className="font-medium">{role.name}</p>
                <p className="text-xs text-gray-500">{role.description}</p>
                <p className="mt-2 text-xs text-gray-600">
                  {role.permissions.map((p) => p.permission.key).join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 shadow">
          <h3 className="font-semibold">Permission catalog</h3>
          <div className="mt-3 space-y-4">
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {group}
                </p>
                <ul className="mt-1 space-y-1 text-sm">
                  {items.map((item) => (
                    <li key={item.key}>
                      <code className="text-xs text-blue-700">{item.key}</code>
                      <span className="text-gray-500"> — {item.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
