import { toast } from 'vue-sonner';

export interface RecentParticipation {
  id: string;
  participated: boolean;
  registeredAt: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    cedula: string;
  };
  event: {
    id: string;
    name: string;
  };
  reason?: {
    id: string;
    name: string;
  } | null;
  notes?: string | null;
}

export const useParticipationHistory = () => {
  const recentParticipations = ref<RecentParticipation[]>([]);
  const loadingHistory = ref(false);

  const fetchRecent = async (eventId: string) => {
    if (!eventId) return;
    loadingHistory.value = true;
    try {
      const data = await $fetch<RecentParticipation[]>(
        '/api/participations/recent',
        {
          query: { eventId, limit: 10 },
        },
      );
      recentParticipations.value = data;
    } catch {
      console.error('Error fetching history:');
    } finally {
      loadingHistory.value = false;
    }
  };

  const fetchRecentAll = async () => {
    loadingHistory.value = true;
    try {
      const data = await $fetch<RecentParticipation[]>(
        '/api/participations/recent-all',
        {
          query: { limit: 10 },
        },
      );
      recentParticipations.value = data;
    } catch {
      console.error('Error fetching history:');
    } finally {
      loadingHistory.value = false;
    }
  };

  const deleteParticipation = async (id: string, eventId: string) => {
    if (!confirm('¿Deshacer este registro?')) return;

    try {
      await $fetch(`/api/participations/${id}`, { method: 'DELETE' });
      toast.success('Registro eliminado');
      // Refresh list
      await fetchRecent(eventId);
    } catch (error) {
      console.error('Error deleting participation:', error);
      toast.error('Error al eliminar registro');
    }
  };

  return {
    recentParticipations,
    loadingHistory,
    fetchRecent,
    fetchRecentAll,
    deleteParticipation,
  };
};
