<script setup lang="ts">
import { computed } from 'vue';

interface ParticipationStats {
  total: number;
  participated: number;
  notParticipated: number;
  pending: number;
}

const props = defineProps<{
  stats: ParticipationStats | null | undefined;
}>();

const colorMode = useColorMode();

const chartOptions = computed(() => {
  if (!props.stats) return {};

  const isDark = colorMode.value === 'dark';
  const textColor = isDark ? '#e2e8f0' : '#475569';

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      textStyle: {
        color: textColor,
      },
    },
    legend: {
      bottom: '0%',
      left: 'center',
      textStyle: {
        color: textColor,
      },
    },
    series: [
      {
        name: 'Participación',
        type: 'pie',
        radius: ['50%', '80%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: isDark ? '#020617' : '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
            color: textColor,
          },
        },
        labelLine: {
          show: false,
        },
        data: [
          {
            value: props.stats.participated,
            name: 'Participaron',
            itemStyle: { color: '#22c55e' }, // Emerald 500
          },
          {
            value: props.stats.pending,
            name: 'Pendientes',
            itemStyle: { color: '#eab308' }, // Yellow 500
          },
          {
            value: props.stats.notParticipated,
            name: 'No Participaron',
            itemStyle: { color: '#ef4444' }, // Red 500
          },
        ],
      },
    ],
  };
});
</script>

<template>
  <div class="h-full w-full">
    <VChart
      v-if="props.stats"
      class="h-full w-full"
      :option="chartOptions"
      autoresize
    />
    <div
      v-else
      class="flex h-full items-center justify-center text-muted-foreground"
    >
      Esperando datos...
    </div>
  </div>
</template>
