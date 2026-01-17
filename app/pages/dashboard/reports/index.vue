<script setup lang="ts">
import {
  FileDown,
  Filter,
  Search,
  Loader2,
  Calendar,
  Building,
  Users,
  RefreshCw,
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { usePDFGenerator } from '~/composables/usePDFGenerator';
import { useCompanyStore } from '~/stores/company';

definePageMeta({
  layout: 'dashboard',
});

// Interfaces
interface AdministrativeUnit {
  id: string;
  name: string;
}

interface Event {
  id: string;
  name: string;
  eventDate: string;
}

interface ReportItem {
  id: string;
  cedula: string;
  firstName: string;
  lastName: string;
  unitName: string | null;
  status: 'participated' | 'not_participated' | 'pending';
  reason: string | null;
  registeredAt: string | null;
}

// State
const store = useCompanyStore();
const { selectedCompany } = storeToRefs(store);
const { generateReport } = usePDFGenerator();

const selectedEventId = ref<string>('');
const selectedUnitId = ref<string>('all');
const selectedStatus = ref<
  'all' | 'participated' | 'not_participated' | 'pending'
>('all');
const searchQuery = ref('');

// 1. Fetch Events & Units
const { data: events } = await useFetch<Event[]>('/api/events', {
  watch: [() => selectedCompany.value?.id],
  query: { activeOnly: false }, // We might want reports for past events too
});

const { data: units } = await useFetch<AdministrativeUnit[]>('/api/units', {
  watch: [() => selectedCompany.value?.id],
});

// Auto-select latest event
watch(
  events,
  (newEvents) => {
    if (newEvents && newEvents.length > 0 && !selectedEventId.value) {
      selectedEventId.value = newEvents[0]!.id;
    }
  },
  { immediate: true },
);

// 2. Fetch Report Data
const {
  data: reportData,
  pending: loadingReport,
  refresh,
} = await useFetch<ReportItem[]>('/api/reports', {
  query: computed(() => ({
    eventId: selectedEventId.value,
    unitId: selectedUnitId.value === 'all' ? undefined : selectedUnitId.value,
    status: selectedStatus.value,
  })),
  watch: [selectedEventId, selectedUnitId, selectedStatus],
});

// Computed filtering for search (client-side text search over the fetched filtered dataset)
const filteredData = computed(() => {
  if (!reportData.value) return [];
  if (!searchQuery.value) return reportData.value;

  const q = searchQuery.value.toLowerCase();
  return reportData.value.filter(
    (item) =>
      item.firstName.toLowerCase().includes(q) ||
      item.lastName.toLowerCase().includes(q) ||
      item.cedula.includes(q),
  );
});

// Actions
const handleDownload = () => {
  if (!reportData.value || reportData.value.length === 0) {
    toast.error('No hay datos para generar el reporte');
    return;
  }

  const eventName =
    events.value?.find((e) => e.id === selectedEventId.value)?.name || 'Evento';
  const unitName =
    selectedUnitId.value !== 'all'
      ? units.value?.find((u) => u.id === selectedUnitId.value)?.name
      : undefined;

  try {
    generateReport(filteredData.value, eventName, {
      status: getStatusLabel(selectedStatus.value),
      unitName,
    });
    toast.success('PDF generado correctamente');
  } catch (e) {
    console.error(e);
    toast.error('Error al generar PDF');
  }
};

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    all: 'Todos',
    participated: 'Asistió',
    not_participated: 'No Asistió',
    pending: 'Pendiente',
  };
  return map[status] || status;
};
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <div class="flex flex-col gap-1">
      <h1 class="text-3xl font-bold tracking-tight">
        Reportes de Participación
      </h1>
      <p class="text-muted-foreground">
        Genere y descargue reportes detallados en PDF.
      </p>
    </div>

    <!-- Filters Card -->
    <Card>
      <CardContent class="space-y-6 p-6">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <!-- Event Selector -->
          <div class="space-y-2">
            <Label>Evento</Label>
            <div class="relative">
              <Select v-model="selectedEventId">
                <SelectTrigger>
                  <div class="flex items-center gap-2">
                    <Calendar class="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Seleccione Evento" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="e in events" :key="e.id" :value="e.id">
                    {{ e.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Unit Selector -->
          <div class="space-y-2">
            <Label>Unidad Administrativa</Label>
            <Select v-model="selectedUnitId">
              <SelectTrigger>
                <div class="flex items-center gap-2">
                  <Building class="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Todas las Unidades" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Unidades</SelectItem>
                <SelectItem v-for="u in units" :key="u.id" :value="u.id">
                  {{ u.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Status Selector -->
          <div class="space-y-2">
            <Label>Estatus</Label>
            <Select v-model="selectedStatus">
              <SelectTrigger>
                <div class="flex items-center gap-2">
                  <Filter class="h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="participated">Asistió</SelectItem>
                <SelectItem value="not_participated">No Asistió</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="flex items-center justify-between border-t pt-4">
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <Users class="h-4 w-4" />
            <span>{{ filteredData.length }} registros encontrados</span>
          </div>

          <div class="flex gap-2">
            <div class="relative w-64">
              <Search
                class="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground"
              />
              <Input
                v-model="searchQuery"
                type="search"
                placeholder="Filtrar vista previa..."
                class="pl-8"
              />
            </div>
            <Button
              :disabled="loadingReport"
              variant="outline"
              size="icon"
              @click="refresh()"
            >
              <RefreshCw
                class="h-4 w-4"
                :class="{ 'animate-spin': loadingReport }"
              />
            </Button>
            <Button
              :disabled="
                loadingReport || !selectedEventId || filteredData.length === 0
              "
              @click="handleDownload"
            >
              <FileDown class="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Preview Table -->
    <Card class="flex-1 overflow-hidden">
      <div class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cédula</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Estatus</TableHead>
              <TableHead>Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="!selectedEventId">
              <TableCell
                colspan="5"
                class="h-24 text-center text-muted-foreground"
              >
                Seleccione un evento para visualizar datos.
              </TableCell>
            </TableRow>
            <TableRow v-else-if="loadingReport">
              <TableCell colspan="5" class="h-24 text-center">
                <div class="flex items-center justify-center gap-2">
                  <Loader2 class="h-4 w-4 animate-spin" />
                  <span>Cargando datos...</span>
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-else-if="filteredData.length === 0">
              <TableCell
                colspan="5"
                class="h-24 text-center text-muted-foreground"
              >
                No se encontraron registros con los filtros actuales.
              </TableCell>
            </TableRow>
            <TableRow v-for="item in filteredData.slice(0, 50)" :key="item.id">
              <!-- Limit preview to 50 rows for performance -->
              <TableCell class="font-mono">{{ item.cedula }}</TableCell>
              <TableCell>{{ item.firstName }} {{ item.lastName }}</TableCell>
              <TableCell class="text-xs text-muted-foreground">{{
                item.unitName || '-'
              }}</TableCell>
              <TableCell>
                <Badge
                  v-if="item.status === 'participated'"
                  variant="secondary"
                  class="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  >Asistió</Badge
                >
                <Badge
                  v-else-if="item.status === 'not_participated'"
                  variant="destructive"
                  >No Asistió</Badge
                >
                <Badge v-else variant="outline">Pendiente</Badge>
              </TableCell>
              <TableCell class="text-xs text-muted-foreground">
                <div v-if="item.status === 'not_participated'">
                  {{ item.reason }}
                </div>
                <div v-else-if="item.status === 'participated'">
                  {{ new Date(item.registeredAt!).toLocaleTimeString() }}
                </div>
                <div v-else>-</div>
              </TableCell>
            </TableRow>
            <TableRow v-if="filteredData.length > 50">
              <TableCell
                colspan="5"
                class="py-2 text-center text-xs text-muted-foreground"
              >
                ... y {{ filteredData.length - 50 }} registros más (descargue el
                PDF para ver todos)
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Card>
  </div>
</template>
