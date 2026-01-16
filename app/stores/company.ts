export const useCompanyStore = defineStore('company', () => {
  // Global state
  const selectedCompanyId = ref<string | null>(null);
  const userCompanies = ref<any[]>([]);
  const isLoading = ref(false);

  // Initialize from cookie immediately
  if (import.meta.client || import.meta.server) {
    const cookie = useCookie('selectedCompanyId');
    if (cookie.value) {
      selectedCompanyId.value = cookie.value;
    }
  }

  // Helper to find full company object
  const selectedCompany = computed(
    () =>
      userCompanies.value.find((c) => c.id === selectedCompanyId.value) || null,
  );

  // Fetch companies from API
  const fetchUserCompanies = async () => {
    isLoading.value = true;
    try {
      // Use $fetch to avoid "Component already mounted" warning
      const data = await $fetch('/api/companies', {
        headers: useRequestHeaders(['cookie']),
      });

      if (data) {
        userCompanies.value = data;

        // Auto-select first company if none selected and companies exist
        if (!selectedCompanyId.value && userCompanies.value.length > 0) {
          await switchCompany(userCompanies.value[0].id);
        }
      }
    } catch (e) {
      console.error('Unexpected error fetching companies:', e);
    } finally {
      isLoading.value = false;
    }
  };

  // Switch company action
  const switchCompany = async (id: string) => {
    if (!id) return;

    // verify it exists in userCompanies
    const company = userCompanies.value.find((c) => c.id === id);
    if (!company) return;

    selectedCompanyId.value = id;

    // Store in cookie for persistence
    const companyCookie = useCookie('selectedCompanyId');
    companyCookie.value = id;
  };

  // Initialize from cookie on client side if needed
  const init = async () => {
    // Sync cookie just in case
    const companyCookie = useCookie('selectedCompanyId');
    if (companyCookie.value && !selectedCompanyId.value) {
      selectedCompanyId.value = companyCookie.value;
    }

    if (userCompanies.value.length === 0) {
      await fetchUserCompanies();
    }
  };

  return {
    selectedCompany,
    selectedCompanyId,
    userCompanies,
    isLoading,
    fetchUserCompanies,
    switchCompany,
    init,
  };
});
