<script setup lang="ts">
import { toast } from 'vue-sonner';
import { useCompanyStore } from '~/stores/company';
import DataTable from '~/components/DataTable.vue';
import { createColumns, type Company } from './partials/columns';

// Components
import CompanyDialog from '~/components/companies/CompanyDialog.vue';

definePageMeta({
  layout: 'dashboard',
});

const searchQuery = ref('');
const page = ref(1);
const perPage = ref(10);
const processingRowId = ref<string | null>(null);

const showDialog = ref(false);
const editingCompany = ref<Company | null>(null);
const showDeleteDialog = ref(false);
const companyToDelete = ref<Company | null>(null);

// Batch Actions
const showBatchDeleteDialog = ref(false);
const batchSelection = ref<string[]>([]);

// Data Fetching
const {
  data: companiesData,
  pending,
  refresh,
} = await useFetch<{
  data: Company[];
  total: number;
  page: number;
  limit: number;
}>('/api/companies', {
  query: {
    page,
    limit: perPage,
    q: searchQuery,
  },
  watch: [page, perPage, searchQuery],
});

const handleEdit = (company: Company) => {
  editingCompany.value = company;
  showDialog.value = true;
};

const confirmDelete = (company: Company) => {
  companyToDelete.value = company;
  showDeleteDialog.value = true;
};

const updateGlobalContext = () => {
  const store = useCompanyStore();
  const { fetchUserCompanies } = store;
  fetchUserCompanies();
};

const handleDelete = async () => {
  if (!companyToDelete.value) return;

  try {
    await $fetch(`/api/companies/${companyToDelete.value.id}`, {
      method: 'DELETE',
    });
    toast.success('Empresa eliminada correctamente');
    refresh();
    updateGlobalContext();
  } catch (error) {
    console.error(error);
    toast.error('Error al eliminar empresa');
  } finally {
    showDeleteDialog.value = false;
    companyToDelete.value = null;
  }
};

const handleSaved = () => {
  showDialog.value = false;
  editingCompany.value = null;
  refresh();
  updateGlobalContext();
};

const handleNew = () => {
  editingCompany.value = null;
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

const handleExport = (format: string) => {
  toast.info(`Exportar a ${format.toUpperCase()} próximamente disponible`);
};

const handleBatchDelete = (ids: string[]) => {
  batchSelection.value = ids;
  showBatchDeleteDialog.value = true;
};

const executeBatchDelete = async () => {
  try {
    await Promise.all(
      batchSelection.value.map((id) =>
        $fetch(`/api/companies/${id}`, { method: 'DELETE' }),
      ),
    );
    toast.success(`${batchSelection.value.length} empresas eliminadas`);
    refresh();
    updateGlobalContext();
  } catch (error) {
    console.error(error);
    toast.error('Error al eliminar empresas');
  } finally {
    showBatchDeleteDialog.value = false;
    batchSelection.value = [];
  }
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
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <div class="flex items-center justify-between">
      <div class="flex flex-col gap-1">
        <h1 class="text-3xl font-bold tracking-tight">Gestión de Empresas</h1>
        <p class="text-muted-foreground">
          Cree y administre las empresas registradas en la plataforma.
        </p>
      </div>
    </div>

    <DataTable
      :columns="columns"
      :data="companiesData"
      :loading="pending"
      :can="{
        create: true, // TODO
        delete: true, // TODO
        export: true,
      }"
      search-placeholder="Buscar por nombre o RIF..."
      @new="handleNew"
      @search="handleSearch"
      @page-change="handlePageChange"
      @per-page-change="handlePerPageChange"
      @export="handleExport"
      @batch-delete="handleBatchDelete"
    />

    <CompanyDialog
      v-if="showDialog"
      :open="showDialog"
      :company="editingCompany"
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
            <strong>{{ companyToDelete?.name }}</strong> y todos sus datos
            asociados (empleados, eventos, participaciones, etc.).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            @click="handleDelete"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
            Se eliminarán <strong>{{ batchSelection.length }}</strong> empresas
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
