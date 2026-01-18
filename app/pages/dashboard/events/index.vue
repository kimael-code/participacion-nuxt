<script setup lang="ts">
import { toast } from 'vue-sonner';
import { useCompanyStore } from '~/stores/company';
import DataTable from '~/components/DataTable.vue';
import { createColumns, type Event } from './partials/columns';

// Components
import EventDialog from '~/components/events/EventDialog.vue';

definePageMeta({
  layout: 'dashboard',
});

const store = useCompanyStore();
const { selectedCompany } = storeToRefs(store);

const searchQuery = ref('');
const page = ref(1);
const perPage = ref(10);
const processingRowId = ref<string | null>(null);

const showDialog = ref(false);
const editingEvent = ref<Event | null>(null);
const showDeleteDialog = ref(false);
const eventToDelete = ref<Event | null>(null);

// Fetch events (dependent on selectedCompany)
const {
  data: eventsData,
  pending,
  refresh,
} = await useFetch<{
  data: Event[];
  total: number;
  page: number;
  limit: number;
}>('/api/events', {
  key: `events-${selectedCompany.value?.id}`,
  query: {
    page,
    limit: perPage,
    q: searchQuery,
  },
  watch: [() => selectedCompany.value?.id, page, perPage, searchQuery],
});

const handleEdit = (event: Event) => {
  editingEvent.value = event;
  showDialog.value = true;
};

const confirmDelete = (event: Event) => {
  eventToDelete.value = event;
  showDeleteDialog.value = true;
};

const handleDelete = async () => {
  if (!eventToDelete.value) return;

  try {
    await $fetch(`/api/events/${eventToDelete.value.id}`, { method: 'DELETE' });
    toast.success('Evento eliminado');
    refresh();
  } catch (error) {
    console.error(error);
    toast.error('Error al eliminar evento');
  } finally {
    showDeleteDialog.value = false;
    eventToDelete.value = null;
  }
};

const handleActivate = async (event: Event) => {
  processingRowId.value = event.id;
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
  } finally {
    processingRowId.value = null;
  }
};

const handleDeactivate = async (event: Event) => {
  processingRowId.value = event.id;
  try {
    await $fetch('/api/events/deactivate', {
      method: 'POST',
      body: { eventId: event.id },
    });
    toast.success(`Evento ${event.name} desactivado`);
    refresh();
  } catch (error: any) {
    console.error(error);
    toast.error('Error al desactivar evento');
  } finally {
    processingRowId.value = null;
  }
};

const handleSaved = () => {
  showDialog.value = false;
  editingEvent.value = null;
  refresh();
};

const handleNew = () => {
  editingEvent.value = null;
  showDialog.value = true;
};

const handleSearch = (query: string) => {
  searchQuery.value = query;
  page.value = 1;
};

const handlePageChange = (newPage: number) => {
  page.value = newPage;
};

const handlePerPageChange = (newPerPage: number) => {
  perPage.value = newPerPage;
  page.value = 1;
};

const can = ref({
  update: true, // TODO: permissions
  delete: true, // TODO: permissions
});

const columns = computed(() =>
  createColumns(can.value, processingRowId, {
    onUpdate: handleEdit,
    onDestroy: confirmDelete,
    onActivate: handleActivate,
    onDeactivate: handleDeactivate,
  }),
);
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
    </div>

    <div v-if="!selectedCompany" class="p-8 text-center text-muted-foreground">
      Seleccione una empresa para ver sus eventos.
    </div>

    <DataTable
      v-else
      :columns="columns"
      :data="eventsData"
      :loading="pending"
      :can="{
        create: true, // TODO
        delete: true, // TODO
        export: true,
      }"
      search-placeholder="Buscar evento..."
      @new="handleNew"
      @search="handleSearch"
      @page-change="handlePageChange"
      @per-page-change="handlePerPageChange"
    />

    <EventDialog
      v-if="showDialog"
      :open="showDialog"
      :event="editingEvent"
      @close="showDialog = false"
      @saved="handleSaved"
    />

    <!-- Delete Confirmation Dialog -->
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente
            <strong>{{ eventToDelete?.name }}</strong> y todas sus
            participaciones asociadas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="handleDelete"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
