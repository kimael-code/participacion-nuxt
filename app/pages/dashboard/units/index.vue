<script setup lang="ts">
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building,
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';

// Components
import UnitDialog from '~/components/units/UnitDialog.vue';

definePageMeta({
  layout: 'dashboard',
});

interface AdministrativeUnit {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

const { selectedCompany } = useCompanyContext();
const searchQuery = ref('');
const showDialog = ref(false);
const editingUnit = ref<AdministrativeUnit | null>(null);

// Fetch units (dependent on selectedCompany)
// We need to watch selectedCompany because if it changes, units list must update
const {
  data: units,
  pending,
  refresh,
} = await useFetch<AdministrativeUnit[]>('/api/units', {
  watch: [() => selectedCompany.value?.id],
});

// Computed filters
const filteredUnits = computed(() => {
  if (!units.value) return [];
  if (!searchQuery.value) return units.value;

  const q = searchQuery.value.toLowerCase();
  return units.value.filter((u) => u.name.toLowerCase().includes(q));
});

const handleEdit = (unit: AdministrativeUnit) => {
  editingUnit.value = unit;
  showDialog.value = true;
};

const handleDelete = async (id: string) => {
  if (!confirm('¿Eliminar unidad administrativa?')) return;

  try {
    await $fetch(`/api/units/${id}`, { method: 'DELETE' });
    toast.success('Unidad eliminada');
    refresh();
  } catch (error) {
    toast.error('Error al eliminar unidad');
  }
};

const handleSaved = () => {
  showDialog.value = false;
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
      <Button
        :disabled="!selectedCompany"
        @click="
          editingUnit = null;
          showDialog = true;
        "
      >
        <Plus class="mr-2 h-4 w-4" />
        Nueva Unidad
      </Button>
    </div>

    <Card>
      <CardContent class="p-4">
        <div class="relative max-w-sm">
          <Search
            class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            v-model="searchQuery"
            placeholder="Buscar unidad..."
            class="pl-10"
          />
        </div>
      </CardContent>
    </Card>

    <Card>
      <div class="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="!selectedCompany">
              <TableCell
                colspan="3"
                class="h-24 text-center text-muted-foreground"
              >
                Seleccione una empresa para ver sus unidades.
              </TableCell>
            </TableRow>
            <TableRow v-else-if="pending && !units">
              <TableCell colspan="3" class="h-24 text-center"
                >Cargando...</TableCell
              >
            </TableRow>
            <TableRow v-else-if="!filteredUnits.length">
              <TableCell
                colspan="3"
                class="h-24 text-center text-muted-foreground"
              >
                No hay unidades registradas.
              </TableCell>
            </TableRow>
            <TableRow v-for="unit in filteredUnits" :key="unit.id">
              <TableCell>
                <div class="flex items-center gap-2">
                  <Building class="h-4 w-4 text-muted-foreground" />
                  <span class="font-medium">{{ unit.name }}</span>
                </div>
              </TableCell>
              <TableCell>{{ unit.description || '-' }}</TableCell>
              <TableCell class="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" class="h-8 w-8 p-0">
                      <MoreHorizontal class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="handleEdit(unit)">
                      <Pencil class="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      class="text-destructive"
                      @click="handleDelete(unit.id)"
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

    <UnitDialog
      v-if="showDialog"
      :open="showDialog"
      :unit="editingUnit"
      @close="showDialog = false"
      @saved="handleSaved"
    />
  </div>
</template>
