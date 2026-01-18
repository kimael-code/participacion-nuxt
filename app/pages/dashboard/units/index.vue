<script setup lang="ts">
import { ref, computed } from 'vue';
import { toast } from 'vue-sonner';
import { useCompanyStore } from '~/stores/company';
import { usePermissions } from '~/composables/usePermissions';
import { createColumns, type Unit } from './partials/columns';

definePageMeta({
  layout: 'dashboard',
});

const store = useCompanyStore();
const { selectedCompany } = storeToRefs(store);
const { hasPermission } = usePermissions();

// State
const page = ref(1);
const perPage = ref(10);
const searchQuery = ref('');
const showUnitDialog = ref(false);
const editingUnit = ref<Unit | null>(null);
const showDeleteDialog = ref(false);
const unitToDelete = ref<Unit | null>(null);
const showBatchDeleteDialog = ref(false);
const batchDeleteCount = ref(0);
const batchDeleteIds = ref<string[]>([]);
const processingRowId = ref<string | null>(null);

// Fetch units with pagination
const {
  data: unitsData,
  pending,
  refresh,
} = await useFetch<{
  data: Unit[];
  total: number;
  page: number;
  limit: number;
}>('/api/units', {
  query: {
    page,
    limit: perPage,
    q: searchQuery,
  },
  watch: [page, perPage, searchQuery, () => selectedCompany.value?.id],
});

// Permissions
const can = computed(() => ({
  update: hasPermission('units:manage'),
  delete: hasPermission('units:manage'),
}));

// Create columns
const columns = computed(() =>
  createColumns(can.value, processingRowId, {
    onUpdate: handleEdit,
    onDestroy: confirmDelete,
  }),
);

// Handlers
const handleNew = () => {
  editingUnit.value = null;
  showUnitDialog.value = true;
};

const handleSearch = (query: string) => {
  searchQuery.value = query;
  page.value = 1; // Reset to first page
};

const handlePageChange = (newPage: number) => {
  page.value = newPage;
};

const handlePerPageChange = (newPerPage: number) => {
  perPage.value = newPerPage;
  page.value = 1; // Reset to first page
};

const handleEdit = (unit: Unit) => {
  editingUnit.value = unit;
  showUnitDialog.value = true;
};

const confirmDelete = (unit: Unit) => {
  unitToDelete.value = unit;
  showDeleteDialog.value = true;
};

const handleDelete = async () => {
  if (!unitToDelete.value) return;

  try {
    await $fetch<unknown>(`/api/units/${unitToDelete.value.id}`, {
      method: 'DELETE' as const,
    });
    toast.success('Unidad eliminada correctamente');
    refresh();
  } catch {
    toast.error('Error al eliminar unidad');
  } finally {
    showDeleteDialog.value = false;
    unitToDelete.value = null;
  }
};

const confirmBatchDelete = (selectedIds: string[]) => {
  if (selectedIds.length === 0) return;

  batchDeleteIds.value = selectedIds;
  batchDeleteCount.value = selectedIds.length;
  showBatchDeleteDialog.value = true;
};

const handleBatchDelete = async () => {
  if (batchDeleteIds.value.length === 0) return;

  try {
    await Promise.all(
      batchDeleteIds.value.map((id) =>
        $fetch<unknown>(`/api/units/${id}`, { method: 'DELETE' as const }),
      ),
    );
    toast.success(
      `${batchDeleteIds.value.length} unidades eliminadas correctamente`,
    );
    refresh();
  } catch {
    toast.error('Error al eliminar unidades');
  } finally {
    showBatchDeleteDialog.value = false;
    batchDeleteIds.value = [];
    batchDeleteCount.value = 0;
  }
};

const handleSaved = () => {
  showUnitDialog.value = false;
  editingUnit.value = null;
  refresh();
};
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <div class="flex items-center justify-between">
      <div class="flex flex-col gap-1">
        <h1 class="text-3xl font-bold tracking-tight">
          Unidades Administrativas
        </h1>
        <p class="text-muted-foreground">
          Gestionando unidades para:
          <span class="font-semibold text-foreground">{{
            selectedCompany?.name || 'Seleccione empresa'
          }}</span>
        </p>
      </div>
    </div>

    <!-- DataTable -->
    <DataTable
      :columns="columns"
      :data="unitsData"
      :loading="pending"
      :can="{
        create: hasPermission('units:manage'),
        delete: hasPermission('units:manage'),
        export: false,
      }"
      search-placeholder="Buscar unidad..."
      @new="handleNew"
      @search="handleSearch"
      @page-change="handlePageChange"
      @per-page-change="handlePerPageChange"
      @batch-delete="confirmBatchDelete"
      @update="handleEdit"
      @destroy="confirmDelete"
    />

    <!-- Unit Dialog -->
    <UnitsUnitDialog
      v-if="showUnitDialog"
      :open="showUnitDialog"
      :unit="editingUnit"
      @close="showUnitDialog = false"
      @saved="handleSaved"
    />

    <!-- Delete Confirmation Dialog -->
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente
            <strong>{{ unitToDelete?.name }}</strong
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

    <!-- Batch Delete Confirmation Dialog -->
    <AlertDialog v-model:open="showBatchDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminarán permanentemente
            <strong
              >{{ batchDeleteCount }} unidad{{
                batchDeleteCount > 1 ? 'es' : ''
              }}</strong
            >
            seleccionadas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="handleBatchDelete"
          >
            Eliminar {{ batchDeleteCount }} unidad{{
              batchDeleteCount > 1 ? 'es' : ''
            }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
