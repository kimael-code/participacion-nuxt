<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useDashboardStats } from '~/composables/useDashboardStats';
import { useEvents } from '~/composables/useEvents';
import { useFullscreen } from '@vueuse/core';

definePageMeta({
  layout: 'presentation',
});

const { activeEvent, allEvents } = useEvents();
const colorMode = useColorMode();
const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

// Selected event for the presentation
const selectedEventId = ref<string | null>(null);

// Automatically select the active event when loaded
watch(
  activeEvent,
  (newActive) => {
    if (newActive && !selectedEventId.value) {
      selectedEventId.value = newActive.id;
    }
  },
  { immediate: true },
);

// Connect to SSE for real-time stats
const { stats, error } = useDashboardStats(selectedEventId);

const currentEvent = computed(() => {
  return (
    allEvents.value?.find((e) => e.id === selectedEventId.value) ||
    activeEvent.value
  );
});

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
};

const formatPercentage = (value: number) => {
  if (!value) return '0.0%';
  return `${value.toFixed(1)}%`;
};
</script>

<template>
  <div class="flex h-full flex-col gap-6">
    <!-- Discrete Header/Controls -->
    <div
      class="flex items-center justify-between px-2 opacity-20 transition-opacity focus-within:opacity-100 hover:opacity-100"
    >
      <div class="flex items-center gap-4">
        <NuxtLink
          to="/dashboard"
          class="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
        >
          <Icon name="i-lucide-arrow-left" class="h-4 w-4" />
          <span>Volver al Dashboard</span>
        </NuxtLink>
        <div class="h-4 w-px bg-border" />
        <h1 class="text-lg font-bold">Sala Situacional</h1>
      </div>

      <div class="flex items-center gap-2">
        <!-- Event Selector -->
        <ClientOnly>
          <Select v-model="selectedEventId">
            <SelectTrigger
              class="h-8 w-[200px] border-none bg-transparent shadow-none focus:ring-0"
            >
              <SelectValue
                :placeholder="currentEvent?.name || 'Seleccionar evento...'"
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="evt in allEvents"
                :key="evt.id"
                :value="evt.id"
              >
                {{ evt.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </ClientOnly>

        <!-- Theme Toggle -->
        <ClientOnly>
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8"
            @click="toggleTheme"
          >
            <Icon
              :name="
                colorMode.value === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'
              "
              class="h-4 w-4"
            />
          </Button>
          <template #fallback>
            <Button variant="ghost" size="icon" class="h-8 w-8" disabled>
              <Icon name="i-lucide-sun" class="h-4 w-4" />
            </Button>
          </template>
        </ClientOnly>

        <!-- Fullscreen Toggle -->
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          @click="toggleFullscreen"
        >
          <Icon
            :name="isFullscreen ? 'i-lucide-minimize' : 'i-lucide-maximize'"
            class="h-4 w-4"
          />
        </Button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div v-if="stats" class="grid flex-1 gap-6 lg:grid-cols-2">
      <!-- Left Column: Summary & Main Chart -->
      <div class="flex flex-col gap-6">
        <!-- Title & Time -->
        <div class="text-center lg:text-left">
          <h2
            class="text-4xl font-black tracking-tight uppercase md:text-5xl lg:text-6xl"
          >
            {{ currentEvent?.name }}
          </h2>
          <p class="mt-2 text-xl text-muted-foreground">
            {{
              new Date(currentEvent?.eventDate || '').toLocaleDateString(
                'es-VE',
                {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                },
              )
            }}
          </p>
        </div>

        <!-- Big Stats Cards -->
        <div class="grid grid-cols-3 gap-4">
          <Card class="border-none bg-primary/5 shadow-none">
            <CardContent class="p-4 text-center">
              <p
                class="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                Participaron
              </p>
              <p class="text-3xl font-bold text-green-600 md:text-4xl">
                {{ stats.overall.participated }}
              </p>
              <p class="text-sm font-medium opacity-70">
                {{
                  formatPercentage(
                    (stats.overall.participated / stats.overall.total) * 100,
                  )
                }}
              </p>
            </CardContent>
          </Card>
          <Card class="border-none bg-primary/5 shadow-none">
            <CardContent class="p-4 text-center">
              <p
                class="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                Pendientes
              </p>
              <p class="text-3xl font-bold text-yellow-600 md:text-4xl">
                {{ stats.overall.pending }}
              </p>
              <p class="text-sm font-medium opacity-70">
                {{
                  formatPercentage(
                    (stats.overall.pending / stats.overall.total) * 100,
                  )
                }}
              </p>
            </CardContent>
          </Card>
          <Card class="border-none bg-primary/5 shadow-none">
            <CardContent class="p-4 text-center">
              <p
                class="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                Faltantes
              </p>
              <p class="text-3xl font-bold text-red-600 md:text-4xl">
                {{ stats.overall.notParticipated }}
              </p>
              <p class="text-sm font-medium opacity-70">
                {{
                  formatPercentage(
                    (stats.overall.notParticipated / stats.overall.total) * 100,
                  )
                }}
              </p>
            </CardContent>
          </Card>
        </div>

        <!-- Main Donut Chart -->
        <div
          class="flex-1 rounded-2xl bg-card/50 p-4 shadow-sm ring-1 ring-border/50"
        >
          <DashboardParticipationChart :stats="stats.overall" />
        </div>
      </div>

      <!-- Right Column: Detailed Charts -->
      <div class="flex flex-col gap-6">
        <div
          class="flex h-full flex-col rounded-2xl bg-card/50 p-4 shadow-sm ring-1 ring-border/50"
        >
          <h3
            class="mb-4 text-center text-lg font-bold tracking-widest text-muted-foreground uppercase"
          >
            Participación por Unidad
          </h3>
          <div class="flex-1">
            <DashboardUnitChart :units="[...stats.byUnit]" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error/Loading -->
    <div v-else-if="error" class="flex flex-1 items-center justify-center">
      <Card class="w-full max-w-md border-red-200 bg-red-50 dark:bg-red-900/10">
        <CardContent class="p-8 text-center">
          <Icon
            name="i-lucide-alert-circle"
            class="mx-auto h-12 w-12 text-red-500"
          />
          <h3 class="mt-4 text-xl font-bold">Error de Conexión</h3>
          <p class="mt-2 text-muted-foreground">{{ error.message }}</p>
          <Button class="mt-6" @click="() => $router.go(0)">Reintentar</Button>
        </CardContent>
      </Card>
    </div>

    <div v-else class="flex flex-1 items-center justify-center">
      <div class="text-center">
        <Icon
          name="i-lucide-loader-2"
          class="mx-auto h-12 w-12 animate-spin text-primary"
        />
        <p class="mt-4 text-xl font-medium">Cargando datos en tiempo real...</p>
      </div>
    </div>

    <!-- Footer Timestamp -->
    <div
      v-if="stats"
      class="text-center text-xs font-medium text-muted-foreground tabular-nums opacity-50"
    >
      Última actualización:
      {{ new Date(stats.timestamp).toLocaleTimeString('es-VE') }} | Sistema de
      Participación v1.0
    </div>
  </div>
</template>

<style scoped>
:deep(.echarts) {
  width: 100% !important;
  height: 100% !important;
}
</style>
