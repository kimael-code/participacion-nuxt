import { ref } from 'vue';
import { toast } from 'vue-sonner';

export interface ParticipationData {
  employeeId: string;
  eventId: string;
  participated: boolean;
  nonParticipationReasonId?: string;
  notes?: string;
}

/**
 * Composable for registering employee participation
 */
export function useParticipationRegistration() {
  const isSubmitting = ref(false);
  const error = ref<Error | null>(null);

  const registerParticipation = async (data: ParticipationData) => {
    isSubmitting.value = true;
    error.value = null;

    try {
      const result = await $fetch('/api/participations', {
        method: 'POST',
        body: data,
      });

      toast.success(
        data.participated
          ? 'Participación registrada exitosamente'
          : 'No participación registrada',
      );

      return result;
    } catch (e) {
      console.error('Error registering participation:', e);
      error.value = e as Error;
      toast.error('Error al registrar participación');
      throw e;
    } finally {
      isSubmitting.value = false;
    }
  };

  return {
    registerParticipation,
    isSubmitting: readonly(isSubmitting),
    error: readonly(error),
  };
}
