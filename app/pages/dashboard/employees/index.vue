<script setup lang="ts">
import { ref, computed } from 'vue';
import { toast } from 'vue-sonner';
import { usePermissions } from '~/composables/usePermissions';
import { useEvents } from '~/composables/useEvents';
import { createColumns } from './partials/columns';
import EmployeesAdvancedFilters from './partials/EmployeesAdvancedFilters.vue';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

definePageMeta({
  layout: 'dashboard',
});

const { activeEvent } = useEvents();

interface Employee {
  id: string;
  cedula: string;
  firstName: string;
  lastName: string;
  email?: string;
  administrativeUnit?: { name: string };
  location?: { name: string };
  administrativeUnitId?: string;
  locationId?: string;
}

interface Catalogs {
  units: { id: string; name: string }[];
  centers: { id: string; name: string }[];
}

const searchQuery = ref('');
const selectedUnitId = ref('all');
const page = ref(1);
const perPage = ref(10);
const sortBy = ref('');
const sortOrder = ref<'asc' | 'desc'>('asc');

// Fetch catalogs for filtering and forms
const { data: catalogs } = useFetch<Catalogs>('/api/employees/catalogs');

// Fetch employees with debounced search and pagination
const {
  data: employeesData,
  pending,
  refresh,
} = useFetch<{ data: Employee[]; total: number; page: number; limit: number }>(
  '/api/employees',
  {
    query: computed(() => ({
      q: searchQuery.value,
      unitId: selectedUnitId.value !== 'all' ? selectedUnitId.value : undefined,
      page: page.value,
      limit: perPage.value,
      sortBy: sortBy.value || undefined,
      sortOrder: sortOrder.value,
    })),
    watch: [searchQuery, selectedUnitId, page, perPage, sortBy, sortOrder],
  },
);

const showEmployeeDialog = ref(false);
const editingEmployee = ref<Employee | null>(null);
const showDeleteDialog = ref(false);
const employeeToDelete = ref<Employee | null>(null);
const showBatchDeleteDialog = ref(false);
const batchDeleteCount = ref(0);
const batchDeleteSelectAll = ref(false);
const batchDeleteIds = ref<string[]>([]);
const processingRowId = ref<string | null>(null);
const showAdvancedFilters = ref(false);

const { hasPermission } = usePermissions();

// Permissions for columns
const can = computed(() => ({
  update: hasPermission('employees:manage'),
  delete: hasPermission('employees:manage'),
  export: true, // Allow export for all who can view
}));

// Create columns (reactive to sort changes)
const columns = computed(() =>
  createColumns(
    can.value,
    processingRowId,
    (column, order) => {
      if (order === null) {
        sortBy.value = '';
        sortOrder.value = 'asc';
      } else {
        handleSortChange(column, order);
      }
    },
    {
      column: sortBy.value,
      order: sortOrder.value,
    },
    {
      onUpdate: handleEdit,
      onDestroy: confirmDelete,
    },
  ),
);

// Handlers
const handleNew = () => {
  editingEmployee.value = null;
  showEmployeeDialog.value = true;
};

const handleSearch = (query: string) => {
  searchQuery.value = query;
  page.value = 1; // Reset to first page on search
};

const handlePageChange = (newPage: number) => {
  page.value = newPage;
};

const handlePerPageChange = (newPerPage: number) => {
  perPage.value = newPerPage;
  page.value = 1; // Reset to first page when changing per page
};

const handleSortChange = (column: string, order: 'asc' | 'desc') => {
  sortBy.value = column;
  sortOrder.value = order;
};

const handleEdit = (employee: Employee) => {
  editingEmployee.value = employee;
  showEmployeeDialog.value = true;
  processingRowId.value = null;
};

const confirmDelete = (employee: Employee) => {
  employeeToDelete.value = employee;
  showDeleteDialog.value = true;
  processingRowId.value = null;
};

const handleDelete = async () => {
  if (!employeeToDelete.value) return;

  try {
    await $fetch<unknown>(`/api/employees/${employeeToDelete.value.id}`, {
      method: 'DELETE' as const,
    });
    toast.success('Empleado eliminado correctamente');
    refresh();
  } catch {
    toast.error('Error al eliminar empleado');
  } finally {
    showDeleteDialog.value = false;
    employeeToDelete.value = null;
  }
};

const confirmBatchDelete = (selectedIds: string[], selectAll: boolean) => {
  if (selectedIds.length === 0) return;

  batchDeleteIds.value = selectedIds;
  batchDeleteSelectAll.value = selectAll;

  if (selectAll) {
    batchDeleteCount.value = totalRecords.value;
  } else {
    batchDeleteCount.value = selectedIds.length;
  }

  showBatchDeleteDialog.value = true;
};

const handleBatchDelete = async () => {
  if (batchDeleteIds.value.length === 0) return;

  try {
    if (batchDeleteSelectAll.value) {
      // Delete all records matching current filters
      const { data: allEmployees } = await $fetch<{ data: Employee[] }>(
        '/api/employees',
        {
          query: {
            q: searchQuery.value,
            unitId:
              selectedUnitId.value !== 'all' ? selectedUnitId.value : undefined,
            limit: 1000, // Get all matching records
          },
        },
      );

      await Promise.all(
        (allEmployees || []).map((employee) =>
          $fetch<unknown>(`/api/employees/${employee.id}`, {
            method: 'DELETE' as const,
          }),
        ),
      );
      toast.success(
        `${allEmployees?.length || 0} empleados eliminados correctamente`,
      );
    } else {
      await Promise.all(
        batchDeleteIds.value.map((id) =>
          $fetch<unknown>(`/api/employees/${id}`, {
            method: 'DELETE' as const,
          }),
        ),
      );
      toast.success(
        `${batchDeleteIds.value.length} empleados eliminados correctamente`,
      );
    }
    refresh();
  } catch {
    toast.error('Error al eliminar empleados');
  } finally {
    showBatchDeleteDialog.value = false;
    batchDeleteIds.value = [];
    batchDeleteCount.value = 0;
    batchDeleteSelectAll.value = false;
  }
};

const handleApplyAdvancedFilters = (filters: { unitId?: string }) => {
  selectedUnitId.value = filters.unitId || 'all';
  showAdvancedFilters.value = false;
  page.value = 1; // Reset to first page
};

const handleClearAdvancedFilters = () => {
  selectedUnitId.value = 'all';
  showAdvancedFilters.value = false;
  page.value = 1;
};

const advancedFiltersActive = computed(() => selectedUnitId.value !== 'all');

const handleSaved = () => {
  showEmployeeDialog.value = false;
  editingEmployee.value = null;
  refresh();
};

const handleExport = async (format: 'pdf' | 'excel' | 'json') => {
  if (format === 'pdf') {
    toast.info('Generando PDF...');
    try {
      const doc = new jsPDF();

      const { data: exportData } = await $fetch<{ data: Employee[] }>(
        '/api/employees',
        {
          query: {
            q: searchQuery.value,
            unitId:
              selectedUnitId.value !== 'all' ? selectedUnitId.value : undefined,
            limit: 1000,
            sortBy: sortBy.value || undefined,
            sortOrder: sortOrder.value,
          },
        },
      );

      autoTable(doc, {
        head: [['#', 'Nombre', 'Apellido', 'Cédula', 'Email', 'Unidad']],
        body: (exportData || []).map((emp, index) => [
          index + 1,
          emp.firstName,
          emp.lastName,
          emp.cedula,
          emp.email || '',
          emp.administrativeUnit?.name || '',
        ]),
      });

      doc.save('empleados.pdf');
      toast.success('PDF exportado exitosamente');
    } catch (e) {
      console.error(e);
      toast.error('Error al generar PDF');
    }
  } else {
    toast.info(`Exportación a ${format.toUpperCase()} no implementada aún`);
  }
};
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <div class="flex items-center justify-between">
      <div class="flex flex-col gap-1">
        <h1 class="text-3xl font-bold tracking-tight">Gestión de Empleados</h1>
        <p class="text-muted-foreground">
          Administre la nómina de su empresa y asigne centros de votación.
        </p>
      </div>
    </div>

    <!-- DataTable -->
    <DataTable
      :columns="columns"
      :data="employeesData"
      :loading="pending"
      :can="{
        create: hasPermission('employees:manage'),
        delete: hasPermission('employees:manage'),
        export: hasPermission('employees:manage'),
      }"
      :has-advanced-search="true"
      :is-advanced-search-active="advancedFiltersActive"
      search-placeholder="Buscar por cédula o nombre..."
      @new="handleNew"
      @search="handleSearch"
      @page-change="handlePageChange"
      @per-page-change="handlePerPageChange"
      @sort-change="handleSortChange"
      @batch-delete="confirmBatchDelete"
      @export="handleExport"
      @advanced-search="showAdvancedFilters = true"
      @clear-advanced-filters="handleClearAdvancedFilters"
      @update="handleEdit"
      @destroy="confirmDelete"
    />

    <!-- Dialogs -->
    <EmployeesEmployeeDialog
      v-if="showEmployeeDialog"
      :open="showEmployeeDialog"
      :employee="editingEmployee"
      :catalogs="catalogs"
      :active-event-type="activeEvent?.type || 'voting'"
      @close="showEmployeeDialog = false"
      @saved="handleSaved"
    />

    <!-- Delete Confirmation Dialog -->
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente
            <strong
              >{{ employeeToDelete?.firstName }}
              {{ employeeToDelete?.lastName }}</strong
            >
            (C.I. {{ employeeToDelete?.cedula }}).
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
              >{{ batchDeleteCount }} empleado{{
                batchDeleteCount > 1 ? 's' : ''
              }}</strong
            >
            {{
              batchDeleteSelectAll
                ? 'que coinciden con los filtros actuales'
                : 'seleccionados'
            }}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="handleBatchDelete"
          >
            Eliminar {{ batchDeleteCount }} empleado{{
              batchDeleteCount > 1 ? 's' : ''
            }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Advanced Filters Sheet -->
    <EmployeesAdvancedFilters
      :open="showAdvancedFilters"
      :units="catalogs?.units || []"
      :initial-unit-id="selectedUnitId !== 'all' ? selectedUnitId : undefined"
      @close="showAdvancedFilters = false"
      @apply="handleApplyAdvancedFilters"
      @clear="handleClearAdvancedFilters"
    />
  </div>
</template>
