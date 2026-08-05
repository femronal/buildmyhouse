import { useQuery } from '@tanstack/react-query';
import { getCurrentUser, type CurrentUser } from '@/lib/auth';

export function useMyPermissions() {
  const query = useQuery({
    queryKey: ['auth', 'me', 'permissions'],
    queryFn: getCurrentUser,
    staleTime: 30_000,
  });

  const user = query.data as CurrentUser | null;
  const isSuperAdmin = Boolean(user?.permissions?.isSuperAdmin);
  const permissions = user?.permissions?.permissions;
  const roleKeys = user?.permissions?.roleKeys ?? [];
  const accessAllowed = user?.permissions?.accessAllowed !== false;

  const hasPermission = (key: string | string[]) => {
    if (isSuperAdmin || permissions?.includes('*')) return true;
    if (!permissions) return true;
    const needed = Array.isArray(key) ? key : [key];
    return needed.every((k) => permissions.includes(k));
  };

  return {
    ...query,
    user,
    isSuperAdmin,
    permissions,
    roleKeys,
    accessAllowed,
    hasPermission,
  };
}
