<script setup lang="ts">
import { ref } from 'vue';
import { useDashboardStats } from '~/composables/useDashboardStats';

definePageMeta({
  layout: 'dashboard',
  title: 'Dashboard',
});

const { activeEvent, allEvents, activateEvent } = useEvents();

// Selected event for the dashboard
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
    <!-- Event Selector - Prominent -->
    <Card class="border-primary/20 bg-linear-to-r from-primary/5 to-primary/10">
      <CardContent class="p-6">
        <div
          class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div class="flex items-center gap-4">
            <div
              class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5"
            >
              <Icon name="i-lucide-calendar" class="h-7 w-7 text-primary" />
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                Evento Activo
              </p>
              <h3 class="text-xl font-bold">
                {{ activeEvent?.name || 'Sin evento activo' }}
              </h3>
              <p v-if="activeEvent" class="text-sm text-muted-foreground">
                {{
                  new Date(activeEvent.eventDate).toLocaleDateString('es-VE', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                }}
              </p>
            </div>
          </div>

          <div class="flex flex-col gap-2 md:items-end">
            <ClientOnly>
              <Select
                :model-value="selectedEventId || undefined"
                @update:model-value="handleEventChange"
              >
                <SelectTrigger class="w-full md:w-[300px]">
                  <SelectValue placeholder="Seleccionar evento..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="evt in allEvents"
                    :key="evt.id"
                    :value="evt.id"
                  >
                    {{ evt.name }} ({{
                      new Date(evt.eventDate).toLocaleDateString()
                    }})
                  </SelectItem>
                </SelectContent>
              </Select>
            </ClientOnly>

            <div class="flex flex-col gap-2 md:flex-row md:items-center">
              <Button
                v-if="usePermissions().hasPermission('reports:read')"
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
                v-if="selectedEventId && selectedEventId !== activeEvent?.id"
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
