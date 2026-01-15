<script setup lang="ts">
import { FileDown, Calendar } from 'lucide-vue-next';

definePageMeta({
  layout: 'dashboard',
});

interface ActiveEvent {
  id: string;
  name: string;
  description?: string;
  eventDate: string | Date;
}

// Fetch events to allow report selection
const { data: events, pending } = useFetch<ActiveEvent[]>('/api/events/active');

const downloadReport = (eventId: string) => {
  // Simple link download for CSV endpoint
  window.open(`/api/reports/export?eventId=${eventId}`, '_blank');
};
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <div class="flex flex-col gap-1">
      <h1 class="text-3xl font-bold tracking-tight">
        Reportes de Participación
      </h1>
      <p class="text-muted-foreground">
        Consulte y descargue reportes detallados en formato CSV por cada evento.
      </p>
    </div>

    <div v-if="pending" class="flex h-64 items-center justify-center">
      <Icon name="lucide:loader-2" class="h-8 w-8 animate-spin text-primary" />
    </div>

    <div
      v-else-if="!events?.length"
      class="flex h-64 flex-col items-center justify-center gap-4 rounded-lg border border-dashed"
    >
      <Calendar class="h-12 w-12 text-muted-foreground" />
      <p class="text-center text-muted-foreground">
        No hay eventos activos registrados para generar reportes.
      </p>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card
        v-for="event in events"
        :key="event.id"
        class="flex flex-col transition-colors hover:border-primary/50"
      >
        <CardHeader>
          <div class="flex items-center justify-between">
            <Badge variant="outline" class="mb-2">Activo</Badge>
            <span class="text-xs text-muted-foreground">
              {{ new Date(event.eventDate).toLocaleDateString() }}
            </span>
          </div>
          <CardTitle class="line-clamp-1 text-foreground">{{
            event.name
          }}</CardTitle>
          <CardDescription class="line-clamp-2 min-h-[40px]">
            {{ event.description || 'Sin descripción' }}
          </CardDescription>
        </CardHeader>
        <CardContent class="flex-1" />
        <CardFooter class="flex gap-2 border-t p-4">
          <Button class="w-full" @click="downloadReport(event.id)">
            <FileDown class="mr-2 h-4 w-4" />
            Descargar Reporte CSV
          </Button>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>
