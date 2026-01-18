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
  const { data: activeEvent, refresh: refreshActive } =
    useAsyncData<Event | null>('active-event', () =>
      $fetch('/api/events/active'),
    );

  // List all events for the company (to be implemented in API if not exists)
  const { data: allEvents, refresh: refreshAll } = useAsyncData<Event[]>(
    'all-events',
    () => $fetch('/api/events'),
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
    activeEvent,
    allEvents,
    refreshActive,
    refreshAll,
    activateEvent,
  };
};
