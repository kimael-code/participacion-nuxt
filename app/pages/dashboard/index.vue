<script setup lang="ts">
import { ref } from 'vue';
import { useDashboardStats } from '~/composables/useDashboardStats';

definePageMeta({
  layout: 'dashboard',
  title: 'Dashboard',
});

// TODO: Get from auth/company context
const selectedEventId = ref<string | null>(null);

// Connect to SSE for real-time stats
const { stats, error } = useDashboardStats(selectedEventId);

// Format percentage
const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`;
};
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Stats Cards -->

    <!-- Event Selector -->
    <Card>
      <CardHeader>
        <CardTitle>Seleccionar Evento</CardTitle>
      </CardHeader>
      <CardContent>
        <!-- TODO: Replace with actual event selector -->
        <p class="text-sm text-muted-foreground">
          Selector de eventos pendiente de implementar
        </p>
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
          <!-- TODO: Add ECharts donut chart -->
          <div
            class="flex h-[300px] items-center justify-center text-muted-foreground"
          >
            Gráfica de participación general (ECharts)
          </div>
        </CardContent>
      </Card>

      <!-- By Unit Chart -->
      <Card>
        <CardHeader>
          <CardTitle>Por Unidad Administrativa</CardTitle>
        </CardHeader>
        <CardContent>
          <!-- TODO: Add ECharts bar chart -->
          <div
            class="flex h-[300px] items-center justify-center text-muted-foreground"
          >
            Gráfica por unidad administrativa (ECharts)
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
