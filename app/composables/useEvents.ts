import { authClient } from '~/utils/auth-client';

export interface Event {
  id: string;
  name: string;
  description: string | null;
  type: 'voting' | 'medical' | 'training' | 'other';
  eventDate: string;
  companyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useEvents = () => {
  const sessionData = authClient.useSession();

  const { data: activeEvents, refresh: refreshActive } = useAsyncData<Event[]>(
    'active-events',
    () => $fetch('/api/events/active'),
    {
      watch: [() => sessionData.value?.data],
    },
  );

  // Computed helper for single active event (first one found)
  const activeEvent = computed(() => {
    if (activeEvents.value && activeEvents.value.length > 0) {
      return activeEvents.value[0];
    }
    return null;
  });

  // List all events for the company
  const { data: allEvents, refresh: refreshAll } = useAsyncData<Event[]>(
    'all-events',
    () => $fetch('/api/events'),
    {
      watch: [() => sessionData.value?.data],
    },
  );

  const activateEvent = async (eventId: string) => {
    try {
      await $fetch('/api/events/activate', {
        method: 'POST',
        body: { eventId },
      });
      await Promise.all([refreshActive(), refreshAll()]);
      return { success: true };
    } catch (error) {
      console.error('Error activating event:', error);
      return { success: false, error };
    }
  };

  return {
    activeEvents,
    activeEvent,
    allEvents,
    refreshActive,
    refreshAll,
    activateEvent,
  };
};
