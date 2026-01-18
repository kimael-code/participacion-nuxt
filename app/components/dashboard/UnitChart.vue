<script setup lang="ts">
import { computed } from 'vue';

interface UnitStat {
  unitId: string;
  unitName: string;
  total: number;
  participated: number;
  notParticipated: number;
  pending: number;
}

const props = defineProps<{
  units: UnitStat[] | undefined;
}>();

const isMounted = ref(false);
onMounted(() => {
  // Small delay to ensure layout is calculated
  setTimeout(() => {
    isMounted.value = true;
  }, 100);
});

const colorMode = useColorMode();

const chartOptions = computed(() => {
  if (!props.units || props.units.length === 0) return {};

  const isDark = colorMode.value === 'dark';
  const textColor = isDark ? '#e2e8f0' : '#475569';

  // Sort units by participation percentage or total? Let's go with participation volume
  const sortedUnits = [...props.units]
    .sort((a, b) => b.participated - a.participated)
    .slice(0, 10); // Show top 10

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      textStyle: {
        color: textColor,
      },
    },
    legend: {
      textStyle: {
        color: textColor,
      },
    },
    grid: {
      left: '25%', // Increased to accommodate labels manually since containLabel is causing warnings
      right: '4%',
      bottom: '3%',
    },
    xAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          color: isDark ? '#334155' : '#f1f5f9',
        },
      },
      axisLabel: {
        color: textColor,
      },
    },
    yAxis: {
      type: 'category',
      data: sortedUnits.map((u) => u.unitName),
      axisLabel: {
        color: textColor,
        width: 100,
        overflow: 'truncate',
      },
    },
    series: [
      {
        name: 'Participaron',
        type: 'bar',
        stack: 'total',
        label: { show: false },
        emphasis: { focus: 'series' },
        itemStyle: { color: '#22c55e' },
        data: sortedUnits.map((u) => u.participated),
      },
      {
        name: 'Pendientes',
        type: 'bar',
        stack: 'total',
        label: { show: false },
        emphasis: { focus: 'series' },
        itemStyle: { color: '#eab308' },
        data: sortedUnits.map((u) => u.pending),
      },
      {
        name: 'No Participaron',
        type: 'bar',
        stack: 'total',
        label: { show: false },
        emphasis: { focus: 'series' },
        itemStyle: { color: '#ef4444' },
        data: sortedUnits.map((u) => u.notParticipated),
      },
    ],
  };
});
</script>

<template>
  <div class="h-full w-full">
    <VChart
      v-if="isMounted && units && units.length > 0"
      class="h-full w-full"
      :option="chartOptions"
      autoresize
    />
    <div
      v-else-if="!units || units.length === 0"
      class="flex h-full items-center justify-center text-muted-foreground"
    >
      No hay datos de unidades...
    </div>
    <div v-else class="flex h-full items-center justify-center">
      <!-- Spacer while mounting/loading chart but data exists -->
    </div>
  </div>
</template>
