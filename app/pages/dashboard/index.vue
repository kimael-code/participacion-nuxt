<script setup lang="ts">
import { ref } from 'vue';
import { useDashboardStats } from '~/composables/useDashboardStats';

definePageMeta({
  layout: 'dashboard',
  title: 'Dashboard',
});

const { activeEvents, allEvents, activateEvent } = useEvents();
const { hasPermission } = usePermissions();

// Selected event for the dashboard
const selectedEventId = ref<string | null>(null);

// Automatically select the active event if there is exactly one
watch(
  activeEvents,
  (events) => {
    if (events && events.length === 1 && !selectedEventId.value) {
      selectedEventId.value = events[0].id;
    }
  },
  { immediate: true },
);

// Computed for single active event display
const singleActiveEvent = computed(() => {
  return activeEvents.value?.length === 1 ? activeEvents.value[0] : null;
});

// Connect to SSE for real-time stats
const { stats, error } = useDashboardStats(selectedEventId);

// Handle event selection change
const handleEventChange = async (value: any) => {
  const eventId = String(value);
  selectedEventId.value = eventId;
};

// Handle set active event
const handleSetActive = async (eventId: string) => {
  const { success } = await activateEvent(eventId);
  if (success) {
    // Optionally show a toast
  }
};

// Format percentage
const formatPercentage = (value: number) => {
  if (!value) return '0.0%';
  return `${value.toFixed(1)}%`;
};
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Event Selector / Active Event Display -->
    <Card
      class="border-primary/20 bg-linear-to-r from-primary/5 to-primary/10 transition-all duration-500"
    >
      <CardContent class="p-6">
        <div
          class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <!-- Left Side: Event Info -->
          <div class="flex items-center gap-4">
            <div
              class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5"
            >
              <Icon name="i-lucide-calendar" class="h-7 w-7 text-primary" />
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {{
                  singleActiveEvent
                    ? 'Evento Activo'
                    : activeEvents?.length && activeEvents.length > 1
                      ? 'Múltiples Eventos Activos'
                      : 'Sin evento activo'
                }}
              </p>

              <!-- If Single Active Event -->
              <div v-if="singleActiveEvent">
                <h3 class="text-xl font-bold">{{ singleActiveEvent.name }}</h3>
                <p class="text-sm text-muted-foreground">
                  {{
                    new Date(singleActiveEvent.eventDate).toLocaleDateString(
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

              <!-- Else (Multiple or None) -->
              <div v-else>
                <h3 class="text-xl font-bold">
                  {{
                    activeEvents?.length
                      ? 'Seleccione un evento'
                      : 'Histórico de eventos'
                  }}
                </h3>
              </div>
            </div>
          </div>

          <!-- Right Side: Selector and Actions -->
          <div class="flex flex-col gap-2 md:items-end">
            <!-- Selector: Show if NOT single active OR if user wants to change -->
            <ClientOnly>
              <div
                v-if="
                  !singleActiveEvent ||
                  (singleActiveEvent &&
                    selectedEventId !== singleActiveEvent.id) ||
                  true
                "
              >
                <!-- Keep selector always visible but maybe styled differently? 
                      The user asked: "why select if already active?".
                      So if singleActiveEvent, we might hide the selector unless requested.
                      For now I will show it if selected != active OR if multiple/none.
                      Wait, user said "take default... in case >1 show selector".
                      Let's hide selector if singleActiveEvent AND selectedId == singleActiveEvent.id
                  -->
              </div>

              <div
                v-if="
                  !singleActiveEvent ||
                  (activeEvents?.length === 1 &&
                    selectedEventId !== activeEvents[0].id)
                "
              >
                <!-- This condition means: Show selector if NO single active event, OR if there is one but we are looking at another one -->
              </div>

              <!-- Simplified Logic: Always show selector but pre-filled? 
                   User's complaint: "why select...". 
                   UI pattern: If single active, show just the info. Add a "Change" button to show selector?
                   Let's try: Show selector only if multiple active OR none active.
                   If single active, show info + "View another event" link/button?
                   Actually, let's just make the selector visible but secondary if single active.
                   But to strictly follow user request:
                   "tomar por defecto... en caso de haber más de un evento activo entonces sí mostrar el selector"
              -->

              <div
                v-if="
                  !singleActiveEvent ||
                  (singleActiveEvent &&
                    selectedEventId !== singleActiveEvent.id)
                "
                class="w-full md:w-[300px]"
              >
                <Select
                  :model-value="selectedEventId || undefined"
                  @update:model-value="handleEventChange"
                >
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="Seleccionar evento..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="evt in allEvents"
                      :key="evt.id"
                      :value="evt.id"
                    >
                      <span :class="{ 'font-bold': evt.isActive }">
                        {{ evt.name }}
                      </span>
                      <span class="ml-2 text-xs text-muted-foreground">
                        ({{ new Date(evt.eventDate).toLocaleDateString() }})
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p
                  v-if="activeEvents?.length && activeEvents.length > 1"
                  class="mt-1 text-xs text-amber-600"
                >
                  Hay {{ activeEvents.length }} eventos activos. Seleccione uno.
                </p>
              </div>

              <!-- If single active and selected, maybe show a "View another" button to reveal selector? -->
              <Button
                v-if="
                  singleActiveEvent && selectedEventId === singleActiveEvent.id
                "
                variant="ghost"
                size="sm"
                @click="selectedEventId = null"
              >
                Ver otro evento
              </Button>
            </ClientOnly>

            <div class="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
              <Button
                v-if="hasPermission('reports:read')"
                variant="outline"
                size="sm"
                class="w-full md:w-auto"
                as-child
              >
                <NuxtLink to="/dashboard/presentation">
                  <Icon name="i-lucide-presentation" class="mr-2 h-4 w-4" />
                  Modo Presentación
                </NuxtLink>
              </Button>

              <Button
                v-if="
                  selectedEventId &&
                  !activeEvents?.some((e) => e.id === selectedEventId)
                "
                variant="default"
                size="sm"
                class="w-full md:w-auto"
                @click="handleSetActive(selectedEventId)"
              >
                <Icon name="i-lucide-check-circle" class="mr-2 h-4 w-4" />
                Establecer como Activo
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Stats Cards -->
    <div v-if="stats" class="grid gap-4 md:grid-cols-3">
      <!-- Participated -->
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">Participaron</CardTitle>
          <Icon name="i-lucide-check-circle" class="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.overall.participated }}</div>
          <p class="text-xs text-muted-foreground">
            {{
              formatPercentage(
                (stats.overall.participated / stats.overall.total) * 100,
              )
            }}
            del total
          </p>
        </CardContent>
      </Card>

      <!-- Pending -->
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">Pendientes</CardTitle>
          <Icon name="i-lucide-clock" class="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.overall.pending }}</div>
          <p class="text-xs text-muted-foreground">
            {{
              formatPercentage(
                (stats.overall.pending / stats.overall.total) * 100,
              )
            }}
            del total
          </p>
        </CardContent>
      </Card>

      <!-- Not Participated -->
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">No Participaron</CardTitle>
          <Icon name="i-lucide-x-circle" class="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ stats.overall.notParticipated }}
          </div>
          <p class="text-xs text-muted-foreground">
            {{
              formatPercentage(
                (stats.overall.notParticipated / stats.overall.total) * 100,
              )
            }}
            del total
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Charts Section -->
    <div v-if="stats" class="grid gap-4 md:grid-cols-2">
      <!-- Overall Chart -->
      <Card>
        <CardHeader>
          <CardTitle>Participación General</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="h-[300px]">
            <DashboardParticipationChart :stats="stats?.overall" />
          </div>
        </CardContent>
      </Card>

      <!-- By Unit Chart -->
      <Card>
        <CardHeader>
          <CardTitle>Por Unidad Administrativa (Top 10)</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="h-[300px]">
            <DashboardUnitChart
              :units="stats?.byUnit ? [...stats.byUnit] : undefined"
            />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Units Table -->
    <Card v-if="stats">
      <CardHeader>
        <CardTitle>Detalle por Unidad Administrativa</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unidad</TableHead>
              <TableHead class="text-right">Total</TableHead>
              <TableHead class="text-right">Participaron</TableHead>
              <TableHead class="text-right">Pendientes</TableHead>
              <TableHead class="text-right">No Participaron</TableHead>
              <TableHead class="text-right">% Participación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="unit in stats.byUnit" :key="unit.unitId">
              <TableCell class="font-medium">{{ unit.unitName }}</TableCell>
              <TableCell class="text-right">{{ unit.total }}</TableCell>
              <TableCell class="text-right text-green-600">{{
                unit.participated
              }}</TableCell>
              <TableCell class="text-right text-yellow-600">{{
                unit.pending
              }}</TableCell>
              <TableCell class="text-right text-red-600">{{
                unit.notParticipated
              }}</TableCell>
              <TableCell class="text-right">
                {{ formatPercentage((unit.participated / unit.total) * 100) }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Empty State -->
    <Card v-if="!stats && !error">
      <CardContent class="flex h-[400px] items-center justify-center">
        <div class="text-center">
          <Icon
            name="i-lucide-bar-chart-3"
            class="mx-auto h-12 w-12 text-muted-foreground"
          />
          <h3 class="mt-4 text-lg font-semibold">Selecciona un evento</h3>
          <p class="mt-2 text-sm text-muted-foreground">
            Selecciona un evento para ver las estadísticas de participación
          </p>
        </div>
      </CardContent>
    </Card>

    <!-- Error State -->
    <Card v-if="error">
      <CardContent class="flex h-[400px] items-center justify-center">
        <div class="text-center">
          <Icon
            name="i-lucide-alert-circle"
            class="mx-auto h-12 w-12 text-red-500"
          />
          <h3 class="mt-4 text-lg font-semibold">Error de conexión</h3>
          <p class="mt-2 text-sm text-muted-foreground">
            {{ error.message }}
          </p>
        </div>
      </CardContent>
    </Card>

    <!-- Last Update -->
    <div v-if="stats" class="text-center text-xs text-muted-foreground">
      Última actualización:
      {{ new Date(stats.timestamp).toLocaleTimeString('es-VE') }}
    </div>
  </div>
</template>
