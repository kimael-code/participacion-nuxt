<script setup lang="ts">
import { toast } from 'vue-sonner';
import DataTable from '~/components/DataTable.vue';
import { createColumns, type Location } from './partials/columns';

// Components
import LocationDialog from '~/components/locations/LocationDialog.vue';

definePageMeta({
  layout: 'dashboard',
});

const searchQuery = ref('');
const selectedType = ref('all');
const page = ref(1);
const perPage = ref(10);
const processingRowId = ref<string | null>(null);

const showDialog = ref(false);
const editingLocation = ref<Location | null>(null);
const showDeleteDialog = ref(false);
const locationToDelete = ref<Location | null>(null);

const {
  data: locationsData,
  pending,
  refresh,
} = await useFetch<{
  data: Location[];
  total: number;
  page: number;
  limit: number;
}>('/api/locations', {
  query: {
    page,
    limit: perPage,
    q: searchQuery,
    type: selectedType,
  },
  watch: [page, perPage, searchQuery, selectedType],
});

// Location types for filter
const locationTypes = [
  { value: 'voting_center', label: 'Centro de Votación' },
  { value: 'medical_facility', label: 'Centro Médico' },
  { value: 'conference_room', label: 'Sala de Conferencias' },
  { value: 'auditorium', label: 'Auditorio' },
  { value: 'training_center', label: 'Centro de Entrenamiento' },
  { value: 'office', label: 'Oficina' },
  { value: 'other', label: 'Otro' },
];

const handleEdit = (location: Location) => {
  editingLocation.value = location;
  showDialog.value = true;
};

const confirmDelete = (location: Location) => {
  locationToDelete.value = location;
  showDeleteDialog.value = true;
};

const handleDelete = async () => {
  if (!locationToDelete.value) return;

  try {
    await $fetch(`/api/locations/${locationToDelete.value.id}`, {
      method: 'DELETE',
    });
    toast.success('Ubicación eliminada');
    refresh();
  } catch (error) {
    console.error(error);
    toast.error('Error al eliminar ubicación');
  } finally {
    showDeleteDialog.value = false;
    locationToDelete.value = null;
  }
};

const handleSaved = () => {
  showDialog.value = false;
  editingLocation.value = null;
  refresh();
};

const handleNew = () => {
  editingLocation.value = null;
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

const handleClearAdvancedFilters = () => {
  selectedType.value = 'all';
};

// Batch Actions
const showBatchDeleteDialog = ref(false);
const batchSelection = ref<string[]>([]);

const handleBatchDelete = (ids: string[]) => {
  batchSelection.value = ids;
  showBatchDeleteDialog.value = true;
};

const executeBatchDelete = async () => {
  try {
    // Process deletes in parallel
    await Promise.all(
      batchSelection.value.map((id) =>
        $fetch(`/api/locations/${id}`, { method: 'DELETE' }),
      ),
    );
    toast.success(`${batchSelection.value.length} ubicaciones eliminadas`);
    refresh();
  } catch (error) {
    console.error(error);
    toast.error('Error al eliminar ubicaciones');
  } finally {
    showBatchDeleteDialog.value = false;
    batchSelection.value = [];
  }
};

const handleExport = (format: string) => {
  toast.info(`Exportar a ${format.toUpperCase()} próximamente disponible`);
};

const can = ref({
  update: true, // TODO: permissions
  delete: true, // TODO: permissions
});

const columns = computed(() =>
  createColumns(can.value, processingRowId, {
    onUpdate: handleEdit,
    onDestroy: confirmDelete,
  }),
);

const isAdvancedSearchActive = computed(() => {
  return selectedType.value !== 'all';
});
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <div class="flex items-center justify-between">
      <div class="flex flex-col gap-1">
        <h1 class="text-3xl font-bold tracking-tight">
          Gestión de Ubicaciones
        </h1>
        <p class="text-muted-foreground">
          Centros de votación y sedes operativas.
        </p>
      </div>
    </div>

    <DataTable
      :columns="columns"
      :data="locationsData"
      :loading="pending"
      :can="{
        create: true, // TODO
        delete: true, // TODO
        export: true,
      }"
      :has-advanced-search="true"
      :is-advanced-search-active="isAdvancedSearchActive"
      search-placeholder="Buscar por nombre, dirección..."
      @new="handleNew"
      @search="handleSearch"
      @page-change="handlePageChange"
      @per-page-change="handlePerPageChange"
      @clear-advanced-filters="handleClearAdvancedFilters"
      @export="handleExport"
      @batch-delete="handleBatchDelete"
    >
      <template #advanced-search>
        <div class="space-y-2">
          <Label>Tipo de Ubicación</Label>
          <Select v-model="selectedType">
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Tipos</SelectItem>
              <SelectItem
                v-for="t in locationTypes"
                :key="t.value"
                :value="t.value"
              >
                {{ t.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </template>
    </DataTable>

    <LocationDialog
      v-if="showDialog"
      :open="showDialog"
      :location="editingLocation"
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
            <strong>{{ locationToDelete?.name }}</strong
            >.
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

    <!-- Batch Delete Confirmation -->
    <AlertDialog v-model:open="showBatchDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminarán
            <strong>{{ batchSelection.length }}</strong> ubicaciones
            seleccionadas. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="executeBatchDelete"
          >
            Eliminar Selección
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
