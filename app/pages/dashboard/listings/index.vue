<script setup lang="ts">
import { FileText, History, Users, UserX, Loader2 } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

definePageMeta({
  layout: 'dashboard',
});

// Interfaces
interface ListingHistory {
  id: string;
  sequenceNumber: number;
  listingType: 'participation' | 'non_participation';
  fileName: string;
  recordCount: number;
  generatedAt: string;
  generatedBy: {
    name: string;
    email: string;
  } | null;
}

interface ActiveEvent {
  id: string;
  name: string;
  eventDate: string;
  companyId: string;
}

// State
const selectedEventId = ref<string>('');
const isGenerating = ref(false);

// 1. Fetch Active Events
const { data: events, pending: loadingEvents } =
  useFetch<ActiveEvent[]>('/api/events/active');

// Auto-select first event
watch(
  events,
  (newEvents) => {
    if (newEvents && newEvents.length > 0 && !selectedEventId.value) {
      selectedEventId.value = newEvents[0].id;
    }
  },
  { immediate: true },
);

// 2. Fetch History
const {
  data: history,
  pending: loadingHistory,
  refresh: refreshHistory,
} = useFetch<ListingHistory[]>('/api/listings/history', {
  query: computed(() => ({ eventId: selectedEventId.value })),
  watch: [selectedEventId],
  // enabled property removed as it is not supported
});

// 3. Generate Report Action
const generateReport = async (type: 'participation' | 'non_participation') => {
  if (!selectedEventId.value) return;

  isGenerating.value = true;
  try {
    const response = await $fetch<Blob>('/api/listings/generate', {
      method: 'POST',
      body: {
        eventId: selectedEventId.value,
        type,
      },
      responseType: 'blob',
    });

    // Trigger Download
    const url = window.URL.createObjectURL(response);
    const a = document.createElement('a');
    a.href = url;

    a.download = `reporte_generado.csv`; // Fallback name

    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success(
      `Reporte de ${type === 'participation' ? 'Asistencia' : 'Inasistencia'} generado`,
    );
    refreshHistory();
  } catch (error) {
    toast.error('Error al generar el reporte');
    console.error(error);
  } finally {
    isGenerating.value = false;
  }
};

const getTypeLabel = (type: string) =>
  type === 'participation' ? 'Asistencia' : 'Inasistencia';
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <div class="flex flex-col gap-1">
      <h1 class="text-3xl font-bold tracking-tight">Reportes CSV Externos</h1>
      <p class="text-muted-foreground">
        Generación de listados de cédulas para sistemas externos.
      </p>
    </div>

    <!-- Event Selector -->
    <Card>
      <CardContent class="flex items-center gap-4 p-4">
        <div class="flex items-center gap-2">
          <FileText class="h-5 w-5 text-muted-foreground" />
          <span class="font-medium">Evento:</span>
        </div>
        <Select v-model="selectedEventId" :disabled="loadingEvents">
          <SelectTrigger class="w-[300px]">
            <SelectValue placeholder="Seleccione Evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="e in events" :key="e.id" :value="e.id">
              {{ e.name }} ({{ new Date(e.eventDate).toLocaleDateString() }})
            </SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>

    <div class="grid gap-6 md:grid-cols-2">
      <!-- Generator Card -->
      <Card>
        <CardHeader>
          <CardTitle>Generar Nuevo Reporte</CardTitle>
          <CardDescription
            >Escoja el tipo de listado a descargar.</CardDescription
          >
        </CardHeader>
        <CardContent class="grid gap-4">
          <Button
            variant="outline"
            class="h-20 justify-start px-4"
            :disabled="isGenerating || !selectedEventId"
            @click="generateReport('participation')"
          >
            <Users class="mr-4 h-6 w-6 text-green-600" />
            <div class="flex flex-col items-start gap-1">
              <span class="font-semibold">Reporte de Asistencia</span>
              <span class="text-xs text-muted-foreground"
                >Listado de cédulas que SI participaron.</span
              >
            </div>
          </Button>

          <Button
            variant="outline"
            class="h-20 justify-start px-4"
            :disabled="isGenerating || !selectedEventId"
            @click="generateReport('non_participation')"
          >
            <UserX class="mr-4 h-6 w-6 text-red-600" />
            <div class="flex flex-col items-start gap-1">
              <span class="font-semibold">Reporte de Inasistencia</span>
              <span class="text-xs text-muted-foreground"
                >Listado de cédulas que NO participaron.</span
              >
            </div>
          </Button>
        </CardContent>
      </Card>

      <!-- History Card -->
      <Card class="flex flex-col">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <History class="h-5 w-5" />
            Historial de Reportes
          </CardTitle>
        </CardHeader>
        <CardContent class="flex-1 overflow-hidden">
          <div v-if="loadingHistory" class="flex justify-center p-4">
            <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
          <div
            v-else-if="!history || (history?.length || 0) === 0"
            class="p-4 text-center text-muted-foreground"
          >
            No hay reportes generados para este evento.
          </div>
          <div v-else class="max-h-[300px] overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="w-[50px]">#</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Regs</TableHead>
                  <TableHead class="text-right">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="item in history" :key="item.id">
                  <TableCell class="font-medium">{{
                    item.sequenceNumber
                  }}</TableCell>
                  <TableCell>
                    <Badge
                      :variant="
                        item.listingType === 'participation'
                          ? 'secondary'
                          : 'destructive'
                      "
                    >
                      {{ getTypeLabel(item.listingType) }}
                    </Badge>
                  </TableCell>
                  <TableCell>{{ item.recordCount }}</TableCell>
                  <TableCell class="text-right text-xs text-muted-foreground">
                    {{ new Date(item.generatedAt).toLocaleString() }}
                    <div v-if="item.generatedBy" class="text-[10px] opacity-70">
                      {{ item.generatedBy.name }}
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
