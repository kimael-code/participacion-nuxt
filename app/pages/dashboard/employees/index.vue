<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Plus,
  FileUp,
  Search,
  Filter,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  MapPin,
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';

definePageMeta({
  layout: 'dashboard',
});

interface Employee {
  id: string;
  cedula: string;
  firstName: string;
  lastName: string;
  email?: string;
  administrativeUnit?: { name: string };
  votingCenter?: { name: string };
  administrativeUnitId?: string;
  votingCenterId?: string;
}

interface Catalogs {
  units: { id: string; name: string }[];
  centers: { id: string; name: string }[];
}

const searchQuery = ref('');
const selectedUnitId = ref('all');
const page = ref(1);

// Fetch catalogs for filtering and forms
const { data: catalogs } = useFetch<Catalogs>('/api/employees/catalogs');

// Fetch employees with debounced search and pagination
const {
  data: employeesData,
  pending,
  refresh,
} = useFetch<{ data: Employee[]; total?: number }>('/api/employees', {
  query: computed(() => ({
    q: searchQuery.value,
    unitId: selectedUnitId.value !== 'all' ? selectedUnitId.value : undefined,
    page: page.value,
  })),
  watch: [searchQuery, selectedUnitId, page],
});

const showEmployeeDialog = ref(false);
const showImportDialog = ref(false);
const editingEmployee = ref<Employee | null>(null);

const handleEdit = (employee: Employee) => {
  editingEmployee.value = employee;
  showEmployeeDialog.value = true;
};

const handleDelete = async (id: string) => {
  if (!confirm('¿Está seguro de que desea eliminar este empleado?')) return;

  try {
    await $fetch(`/api/employees/${id}`, { method: 'DELETE' });
    toast.success('Empleado eliminado correctamente');
    refresh();
  } catch (error) {
    toast.error('Error al eliminar empleado');
  }
};

const handleSaved = () => {
  showEmployeeDialog.value = false;
  editingEmployee.value = null;
  refresh();
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
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="showImportDialog = true">
          <FileUp class="mr-2 h-4 w-4" />
          Importar CSV
        </Button>
        <Button
          @click="
            editingEmployee = null;
            showEmployeeDialog = true;
          "
        >
          <Plus class="mr-2 h-4 w-4" />
          Nuevo Empleado
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <Card>
      <CardContent class="p-4">
        <div class="flex flex-wrap items-center gap-4">
          <div class="relative min-w-[300px] flex-1">
            <Search
              class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              v-model="searchQuery"
              placeholder="Buscar por cédula o nombre..."
              class="pl-10"
            />
          </div>
          <div class="flex items-center gap-2">
            <Filter class="h-4 w-4 text-muted-foreground" />
            <Select v-model="selectedUnitId">
              <SelectTrigger class="w-[200px]">
                <SelectValue placeholder="Unidad Administrativa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Unidades</SelectItem>
                <SelectItem
                  v-for="unit in catalogs?.units || []"
                  :key="unit.id"
                  :value="unit.id"
                >
                  {{ unit.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Table -->
    <Card>
      <div class="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empleado</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead>Unidad / Localización</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="pending && !employeesData">
              <TableCell colspan="4" class="h-24 text-center"
                >Cargando...</TableCell
              >
            </TableRow>
            <TableRow v-else-if="!employeesData?.data?.length">
              <TableCell
                colspan="4"
                class="h-24 text-center text-muted-foreground"
              >
                No se encontraron empleados.
              </TableCell>
            </TableRow>
            <TableRow
              v-for="employee in employeesData?.data || []"
              :key="employee.id"
            >
              <TableCell>
                <div class="flex flex-col">
                  <span class="font-medium text-foreground"
                    >{{ employee.firstName }} {{ employee.lastName }}</span
                  >
                  <span class="text-xs text-muted-foreground">{{
                    employee.email || 'Sin correo'
                  }}</span>
                </div>
              </TableCell>
              <TableCell>{{ employee.cedula }}</TableCell>
              <TableCell>
                <div class="flex flex-col gap-1">
                  <div class="flex items-center text-xs text-muted-foreground">
                    <Building2 class="mr-1 h-3 w-3" />
                    {{ employee.administrativeUnit?.name || 'N/A' }}
                  </div>
                  <div class="flex items-center text-xs text-muted-foreground">
                    <MapPin class="mr-1 h-3 w-3" />
                    {{ employee.votingCenter?.name || 'N/A' }}
                  </div>
                </div>
              </TableCell>
              <TableCell class="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" class="h-8 w-8 p-0">
                      <MoreHorizontal class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="handleEdit(employee)">
                      <Pencil class="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      class="text-destructive"
                      @click="handleDelete(employee.id)"
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

    <!-- Dialogs -->
    <EmployeesEmployeeDialog
      v-if="showEmployeeDialog"
      :open="showEmployeeDialog"
      :employee="editingEmployee"
      :catalogs="catalogs"
      @close="showEmployeeDialog = false"
      @saved="handleSaved"
    />

    <EmployeesImportEmployeesDialog
      v-if="showImportDialog"
      :open="showImportDialog"
      @close="showImportDialog = false"
      @imported="refresh"
    />
  </div>
</template>
