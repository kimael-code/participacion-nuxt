import { authClient } from '~/utils/auth-client';

export const usePermissions = () => {
  const sessionData = authClient.useSession();

  const { data: userPermissions, refresh } = useFetch<any>(
    '/api/auth/permissions',
    {
      immediate: !!sessionData.data.value,
      watch: [sessionData.data],
    },
  );

  const hasPermission = (permissionSlug?: string) => {
    if (!permissionSlug) return true;
    if (!userPermissions.value) return false;
    if (userPermissions.value.role === 'admin') return true;
    return userPermissions.value.permissions.includes(permissionSlug);
  };

  const role = computed(() => userPermissions.value?.role || 'user');

  return {
    hasPermission,
    role,
    userPermissions,
    refreshPermissions: refresh,
  };
};
