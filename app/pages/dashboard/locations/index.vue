<script setup lang="ts">
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  MapPin,
  Filter,
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';

// Components
import LocationDialog from '~/components/locations/LocationDialog.vue';

definePageMeta({
  layout: 'dashboard',
});

interface Location {
  id: string;
  name: string;
  type: string;
  address: string;
  state: { name: string };
  municipality: { name: string };
  parish: { name: string };
}

const searchQuery = ref('');
const selectedType = ref('all');
const showDialog = ref(false);
const editingLocation = ref<Location | null>(null);

// Fetch locations (global catalog)
const {
  data: locations,
  pending,
  refresh,
} = await useFetch<Location[]>('/api/locations');

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

const getTypeLabel = (type: string) => {
  return locationTypes.find((t) => t.value === type)?.label || type;
};

// Computed filters
const filteredLocations = computed(() => {
  if (!locations.value) return [];
  let res = locations.value;

  if (selectedType.value !== 'all') {
    res = res.filter((l) => l.type === selectedType.value);
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    res = res.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q) ||
        l.state?.name.toLowerCase().includes(q),
    );
  }

  return res;
});

const handleEdit = (location: Location) => {
  editingLocation.value = location;
  showDialog.value = true;
};

const handleDelete = async (id: string) => {
  if (!confirm('¿Eliminar ubicación?')) return;

  try {
    await $fetch(`/api/locations/${id}`, { method: 'DELETE' });
    toast.success('Ubicación eliminada');
    refresh();
  } catch (error) {
    console.error(error);
    toast.error('Error al eliminar ubicación');
  }
};

const handleSaved = () => {
  showDialog.value = false;
  editingLocation.value = null;
  refresh();
};
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
      <Button
        @click="
          editingLocation = null;
          showDialog = true;
        "
      >
        <Plus class="mr-2 h-4 w-4" />
        Nueva Ubicación
      </Button>
    </div>

    <Card>
      <CardContent class="p-4">
        <div class="flex flex-wrap items-center gap-4">
          <div class="relative min-w-[300px] flex-1">
            <Search
              class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              v-model="searchQuery"
              placeholder="Buscar por nombre, dirección o estado..."
              class="pl-10"
            />
          </div>
          <div class="flex items-center gap-2">
            <Filter class="h-4 w-4 text-muted-foreground" />
            <Select v-model="selectedType">
              <SelectTrigger class="w-[200px]">
                <SelectValue placeholder="Tipo de Ubicación" />
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
        </div>
      </CardContent>
    </Card>

    <Card>
      <div class="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Ubicación Geográfica</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="pending && !locations">
              <TableCell colspan="4" class="h-24 text-center"
                >Cargando...</TableCell
              >
            </TableRow>
            <TableRow v-else-if="!filteredLocations.length">
              <TableCell
                colspan="4"
                class="h-24 text-center text-muted-foreground"
              >
                No hay ubicaciones registradas.
              </TableCell>
            </TableRow>
            <TableRow v-for="loc in filteredLocations" :key="loc.id">
              <TableCell>
                <div class="flex flex-col">
                  <span class="flex items-center gap-2 font-medium">
                    <MapPin class="h-4 w-4 text-muted-foreground" />
                    {{ loc.name }}
                  </span>
                  <span
                    class="ml-6 max-w-[300px] truncate text-xs text-muted-foreground"
                    >{{ loc.address }}</span
                  >
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{{ getTypeLabel(loc.type) }}</Badge>
              </TableCell>
              <TableCell>
                <div class="text-sm">
                  {{ loc.state?.name }} / {{ loc.municipality?.name }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ loc.parish?.name }}
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
                    <DropdownMenuItem @click="handleEdit(loc)">
                      <Pencil class="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      class="text-destructive"
                      @click="handleDelete(loc.id)"
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

    <LocationDialog
      v-if="showDialog"
      :open="showDialog"
      :location="editingLocation"
      @close="showDialog = false"
      @saved="handleSaved"
    />
  </div>
</template>
