<script setup lang="ts">
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
  CheckCircle2,
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';

// Components
import EventDialog from '~/components/events/EventDialog.vue';

definePageMeta({
  layout: 'dashboard',
});

interface Event {
  id: string;
  name: string;
  date: string;
  active: boolean;
  description?: string;
  companyId: string;
}

const { selectedCompany } = useCompanyContext();
const searchQuery = ref('');
const showDialog = ref(false);
const editingEvent = ref<Event | null>(null);

// Fetch events (dependent on selectedCompany)
const {
  data: events,
  pending,
  refresh,
} = await useFetch<Event[]>('/api/events', {
  watch: [() => selectedCompany.value?.id],
});

// Computed filters
const filteredEvents = computed(() => {
  if (!events.value) return [];
  if (!searchQuery.value) return events.value;

  const q = searchQuery.value.toLowerCase();
  return events.value.filter((e) => e.name.toLowerCase().includes(q));
});

const handleEdit = (event: Event) => {
  editingEvent.value = event;
  showDialog.value = true;
};

const handleDelete = async (id: string) => {
  if (!confirm('¿Eliminar evento?')) return;

  try {
    await $fetch(`/api/events/${id}`, { method: 'DELETE' });
    toast.success('Evento eliminado');
    refresh();
  } catch (error) {
    console.error(error);
    toast.error('Error al eliminar evento');
  }
};

const handleActivate = async (event: Event) => {
  try {
    await $fetch('/api/events/activate', {
      method: 'POST',
      body: { eventId: event.id },
    });
    toast.success(`Evento ${event.name} activado`);
    refresh();
  } catch (error: any) {
    console.error(error);
    toast.error('Error al activar evento');
  }
};

const handleSaved = () => {
  showDialog.value = false;
  editingEvent.value = null;
  refresh();
};
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <div class="flex items-center justify-between">
      <div class="flex flex-col gap-1">
        <h1 class="text-3xl font-bold tracking-tight">Gestión de Eventos</h1>
        <p class="text-muted-foreground">
          Planificación de jornadas para:
          <span class="font-semibold text-foreground">{{
            selectedCompany?.name || 'Seleccione empresa'
          }}</span>
        </p>
      </div>
      <Button
        :disabled="!selectedCompany"
        @click="
          editingEvent = null;
          showDialog = true;
        "
      >
        <Plus class="mr-2 h-4 w-4" />
        Nuevo Evento
      </Button>
    </div>

    <!-- Filters -->
    <Card>
      <CardContent class="p-4">
        <div class="relative max-w-sm">
          <Search
            class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            v-model="searchQuery"
            placeholder="Buscar evento..."
            class="pl-10"
          />
        </div>
      </CardContent>
    </Card>

    <!-- Table -->
    <Card>
      <div class="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="!selectedCompany">
              <TableCell
                colspan="4"
                class="h-24 text-center text-muted-foreground"
              >
                Seleccione una empresa para ver sus eventos.
              </TableCell>
            </TableRow>
            <TableRow v-else-if="pending && !events">
              <TableCell colspan="4" class="h-24 text-center"
                >Cargando...</TableCell
              >
            </TableRow>
            <TableRow v-else-if="!filteredEvents.length">
              <TableCell
                colspan="4"
                class="h-24 text-center text-muted-foreground"
              >
                No hay eventos registrados.
              </TableCell>
            </TableRow>
            <TableRow v-for="event in filteredEvents" :key="event.id">
              <TableCell>
                <div class="flex flex-col">
                  <span class="font-medium">{{ event.name }}</span>
                  <span class="text-xs text-muted-foreground">{{
                    event.description
                  }}</span>
                </div>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-2">
                  <Calendar class="h-4 w-4 text-muted-foreground" />
                  {{ new Date(event.date).toLocaleDateString() }}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  v-if="event.active"
                  variant="success"
                  class="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                >
                  Activo
                </Badge>
                <Badge v-else variant="outline"> Inactivo </Badge>
              </TableCell>
              <TableCell class="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" class="h-8 w-8 p-0">
                      <MoreHorizontal class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      v-if="!event.active"
                      @click="handleActivate(event)"
                    >
                      <CheckCircle2 class="mr-2 h-4 w-4 text-green-600" />
                      Activar
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="handleEdit(event)">
                      <Pencil class="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      class="text-destructive"
                      @click="handleDelete(event.id)"
                    >
                      <Trash2 class="mr-2 h-4 w-4" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Card>

    <EventDialog
      v-if="showDialog"
      :open="showDialog"
      :event="editingEvent"
      @close="showDialog = false"
      @saved="handleSaved"
    />
  </div>
</template>
