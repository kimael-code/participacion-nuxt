import { onUnmounted, ref } from 'vue';

export interface DashboardStats {
  timestamp: string;
  overall: {
    total: number;
    participated: number;
    notParticipated: number;
    pending: number;
    participationRate: number;
  };
  byUnit: Array<{
    unitId: string;
    unitName: string;
    total: number;
    participated: number;
    notParticipated: number;
    pending: number;
  }>;
}

/**
 * Composable to consume real-time dashboard stats via SSE
 */
export function useDashboardStats(eventId: Ref<string | null>) {
  const stats = ref<DashboardStats | null>(null);
  const error = ref<Error | null>(null);
  const isConnected = ref(false);

  let eventSource: EventSource | null = null;

  const connect = () => {
    if (!eventId.value) {
      return;
    }

    // Close existing connection
    disconnect();

    try {
      const url = `/api/dashboard/stats?eventId=${eventId.value}`;
      eventSource = new EventSource(url, { withCredentials: true });

      eventSource.onopen = () => {
        isConnected.value = true;
        error.value = null;
      };

      eventSource.onmessage = (event) => {
        try {
          stats.value = JSON.parse(event.data);
        } catch (e) {
          console.error('Error parsing SSE data:', e);
          error.value = e as Error;
        }
      };

      eventSource.onerror = (e) => {
        console.error('SSE error:', e);
        isConnected.value = false;
        error.value = new Error('Connection error');

        // Reconnect after 5 seconds
        setTimeout(() => {
          if (eventId.value) {
            connect();
          }
        }, 5000);
      };
    } catch (e) {
      error.value = e as Error;
    }
  };

  const disconnect = () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
      isConnected.value = false;
    }
  };

  // Watch eventId changes
  watch(
    eventId,
    (newEventId) => {
      if (newEventId) {
        connect();
      } else {
        disconnect();
      }
    },
    { immediate: true },
  );

  // Cleanup on unmount
  onUnmounted(() => {
    disconnect();
  });

  return {
    stats: readonly(stats),
    error: readonly(error),
    isConnected: readonly(isConnected),
    reconnect: connect,
  };
}
