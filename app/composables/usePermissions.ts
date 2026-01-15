import { authClient } from '~/utils/auth-client';

export const usePermissions = () => {
  const sessionData = authClient.useSession();

  const { data: userPermissions, refresh } = useFetch<any>(
    '/api/auth/permissions',
    {
      immediate: !!sessionData.value?.data,
      watch: [() => sessionData.value?.data],
    },
  );

  const hasPermission = (permissionSlug?: string) => {
    if (!permissionSlug) return true;
    if (!userPermissions.value) return false;

    const userRole = userPermissions.value.role;
    const perms = userPermissions.value.permissions || [];

    if (userRole === 'admin') return true;
    return perms.includes(permissionSlug);
  };

  const role = computed(() => userPermissions.value?.role || 'user');

  return {
    hasPermission,
    role,
    userPermissions,
    refreshPermissions: refresh,
  };
};
