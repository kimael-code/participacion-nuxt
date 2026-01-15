import { ref } from 'vue';

export interface Employee {
  id: string;
  cedula: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  administrativeUnit?: {
    id: string;
    name: string;
  };
  votingCenter?: {
    id: string;
    name: string;
    address: string;
    parish: {
      name: string;
      municipality: {
        name: string;
        state: {
          name: string;
        };
      };
    };
  };
}

/**
 * Composable for employee search functionality
 */
export function useEmployeeSearch() {
  const searchQuery = ref('');
  const isSearching = ref(false);
  const results = ref<Employee[]>([]);
  const error = ref<Error | null>(null);

  const search = useDebounceFn(async () => {
    if (!searchQuery.value || searchQuery.value.length < 2) {
      results.value = [];
      return;
    }

    isSearching.value = true;
    error.value = null;

    try {
      const data = await $fetch<Employee[]>('/api/employees/search', {
        query: {
          q: searchQuery.value,
        },
      });

      results.value = data;
    } catch (e) {
      console.error('Search error:', e);
      error.value = e as Error;
      results.value = [];
    } finally {
      isSearching.value = false;
    }
  }, 300);

  // Watch search query and trigger search
  watch(searchQuery, () => {
    search();
  });

  const clear = () => {
    searchQuery.value = '';
    results.value = [];
    error.value = null;
  };

  return {
    searchQuery,
    isSearching: readonly(isSearching),
    results: readonly(results),
    error: readonly(error),
    clear,
  };
}
