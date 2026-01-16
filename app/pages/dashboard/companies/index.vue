<script setup lang="ts">
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';

definePageMeta({
  layout: 'dashboard',
});

// Components
import CompanyDialog from '~/components/companies/CompanyDialog.vue';

interface Company {
  id: string;
  name: string;
  rif?: string;
  logo?: string;
  createdAt: string;
}

const searchQuery = ref('');
const showDialog = ref(false);
const editingCompany = ref<Company | null>(null);

// Fetch companies (reusing the same API as for the switcher context)
// But here we want to manage them.
const {
  data: companies,
  pending,
  refresh,
} = await useFetch<Company[]>('/api/companies');

// Computed filters
const filteredCompanies = computed(() => {
  if (!companies.value) return [];
  if (!searchQuery.value) return companies.value;

  const q = searchQuery.value.toLowerCase();
  return companies.value.filter(
    (c) => c.name.toLowerCase().includes(q) || c.rif?.toLowerCase().includes(q),
  );
});

const handleEdit = (company: Company) => {
  editingCompany.value = company;
  showDialog.value = true;
};

const handleDelete = async (id: string) => {
  if (
    !confirm(
      '¿Está seguro de que desea eliminar esta empresa? Esta acción no se puede deshacer y borrará todos los datos asociados.',
    )
  )
    return;

  try {
    await $fetch(`/api/companies/${id}`, { method: 'DELETE' });
    toast.success('Empresa eliminada correctamente');
    refresh();
    // Also refresh context if needed ideally
  } catch (error) {
    toast.error('Error al eliminar empresa');
  }
};

const handleSaved = () => {
  showDialog.value = false;
  editingCompany.value = null;
  refresh();
  // Also update global context
  const { fetchUserCompanies } = useCompanyContext();
  fetchUserCompanies();
};
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
      <Button
        @click="
          editingCompany = null;
          showDialog = true;
        "
      >
        <Plus class="mr-2 h-4 w-4" />
        Nueva Empresa
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
            placeholder="Buscar por nombre o RIF..."
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
              <TableHead>Empresa</TableHead>
              <TableHead>RIF</TableHead>
              <TableHead>Fecha Creación</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="pending && !companies">
              <TableCell colspan="4" class="h-24 text-center"
                >Cargando...</TableCell
              >
            </TableRow>
            <TableRow v-else-if="!filteredCompanies.length">
              <TableCell
                colspan="4"
                class="h-24 text-center text-muted-foreground"
              >
                No se encontraron empresas.
              </TableCell>
            </TableRow>
            <TableRow v-for="company in filteredCompanies" :key="company.id">
              <TableCell>
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"
                  >
                    <img
                      v-if="company.logo"
                      :src="company.logo"
                      :alt="company.name"
                      class="h-full w-full rounded-lg object-cover"
                    />
                    <Building2 v-else class="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span class="font-medium">{{ company.name }}</span>
                </div>
              </TableCell>
              <TableCell>{{ company.rif || 'N/A' }}</TableCell>
              <TableCell>
                {{ new Date(company.createdAt).toLocaleDateString() }}
              </TableCell>
              <TableCell class="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" class="h-8 w-8 p-0">
                      <MoreHorizontal class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="handleEdit(company)">
                      <Pencil class="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      class="text-destructive"
                      @click="handleDelete(company.id)"
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

    <CompanyDialog
      v-if="showDialog"
      :open="showDialog"
      :company="editingCompany"
      @close="showDialog = false"
      @saved="handleSaved"
    />
  </div>
</template>
