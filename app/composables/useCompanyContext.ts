export const useCompanyContext = () => {
  // Global state
  const selectedCompanyId = useState<string | null>(
    'selectedCompanyId',
    () => null,
  );
  const userCompanies = useState<any[]>('userCompanies', () => []);
  const isLoading = useState<boolean>('companyContextLoading', () => false);

  // Helper to find full company object
  const selectedCompany = computed(
    () =>
      userCompanies.value.find((c) => c.id === selectedCompanyId.value) || null,
  );

  // Fetch companies from API
  const fetchUserCompanies = async () => {
    isLoading.value = true;
    try {
      const { data } = await useFetch('/api/companies');
      if (data.value) {
        userCompanies.value = data.value;

        // Auto-select first company if none selected and companies exist
        if (!selectedCompanyId.value && userCompanies.value.length > 0) {
          // Try to recover from cookie first?
          // For now, auto-select first
          await switchCompany(userCompanies.value[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
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
    const companyCookie = useCookie('selectedCompanyId');
    if (companyCookie.value) {
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
};
