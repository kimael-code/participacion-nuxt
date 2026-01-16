<script setup lang="ts">
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { toast } from 'vue-sonner';

const props = defineProps<{
  open: boolean;
  location?: any; // Using any for simplicity in mapping full object or id
}>();

const emit = defineEmits(['close', 'saved']);
const isEditing = computed(() => !!props.location);

// Geographic Catalogs State
const states = ref<{ id: string; name: string }[]>([]);
const municipalities = ref<{ id: string; name: string }[]>([]);
const parishes = ref<{ id: string; name: string }[]>([]);

// Location Types
const locationTypes = [
  { value: 'voting_center', label: 'Centro de Votación' },
  { value: 'medical_facility', label: 'Centro Médico' },
  { value: 'conference_room', label: 'Sala de Conferencias' },
  { value: 'auditorium', label: 'Auditorio' },
  { value: 'training_center', label: 'Centro de Entrenamiento' },
  { value: 'office', label: 'Oficina' },
  { value: 'other', label: 'Otro' },
];

const validationSchema = toTypedSchema(
  z.object({
    name: z.string().min(3, 'Nombre muy corto'),
    type: z.enum([
      'voting_center',
      'medical_facility',
      'conference_room',
      'auditorium',
      'training_center',
      'office',
      'other',
    ]),
    address: z.string().min(5, 'Dirección requerida'),
    stateId: z.string().min(1, 'Estado requerido'),
    municipalityId: z.string().min(1, 'Municipio requerido'), // Helper for UX, strictly only parishId is stored
    parishId: z.string().min(1, 'Parroquia requerida'),
    capacity: z.number().optional().nullable(),
  }),
);

const {
  handleSubmit,
  isSubmitting,
  setValues,
  resetForm,
  values,
  setFieldValue,
} = useForm({
  validationSchema,
});

// Fetch States on Mount
const fetchStates = async () => {
  const data = await $fetch('/api/geographic/states');
  states.value = data;
};

// Cascading Loaders
const loadMunicipalities = async (stateId: string) => {
  municipalities.value = [];
  parishes.value = [];
  if (!stateId) return;
  const data = await $fetch(
    `/api/geographic/municipalities?stateId=${stateId}`,
  );
  municipalities.value = data;
};

const loadParishes = async (municipalityId: string) => {
  parishes.value = [];
  if (!municipalityId) return;
  const data = await $fetch(
    `/api/geographic/parishes?municipalityId=${municipalityId}`,
  );
  parishes.value = data;
};

// Watchers for cascading dropdowns
// Note: We need careful handling to avoid infinite loops or clearing values during edit load
const handleStateChange = async (val: string) => {
  // Determine if this change is user-initiated or programmatic?
  // VeeValidate reactive values work well.
  setFieldValue('municipalityId', ''); // Reset child
  setFieldValue('parishId', '');
  await loadMunicipalities(val);
};

const handleMunicipalityChange = async (val: string) => {
  setFieldValue('parishId', '');
  await loadParishes(val);
};

onMounted(async () => {
  await fetchStates();
});

// Initialize Form
watch(
  () => props.location,
  async (newVal) => {
    if (newVal) {
      // For editing, we need to pre-load the cascading lists
      // Assuming newVal contains nested geographic objects: state: {id}, municipality: {id}
      // If the API returns flat structure or nested, update accordingly.
      // Our list API returns nested objects.

      const stateId = newVal.state?.id;
      const municipalityId = newVal.municipality?.id;
      const parishId = newVal.parish?.id;

      if (stateId) await loadMunicipalities(stateId);
      if (municipalityId) await loadParishes(municipalityId);

      setValues({
        name: newVal.name,
        type: newVal.type,
        address: newVal.address,
        stateId: stateId || '',
        municipalityId: municipalityId || '',
        parishId: parishId || '',
        capacity: newVal.capacity,
      });
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

const onSubmit = handleSubmit(async (values) => {
  try {
    const url = isEditing.value
      ? `/api/locations/${props.location?.id}`
      : '/api/locations';

    const method = isEditing.value ? 'PATCH' : 'POST';

    // We only need parishId for the API, but `values` contains all.
    // Zod schema validation passes.

    await $fetch(url, {
      method,
      body: values,
    });

    toast.success(`Ubicación ${isEditing.value ? 'actualizada' : 'creada'}`);
    emit('saved');
  } catch (error: any) {
    toast.error(error.statusMessage || 'Error al guardar ubicación');
  }
});
</script>

<template>
  <Dialog :open="open" @update:open="(val) => !val && emit('close')">
    <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>{{
          isEditing ? 'Editar Ubicación' : 'Nueva Ubicación'
        }}</DialogTitle>
        <DialogDescription>
          Registre centros de votación o sedes.
        </DialogDescription>
      </DialogHeader>

      <form @submit="onSubmit" class="grid gap-4 py-4">
        <!-- Geographic Section (Row 1) -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField v-slot="{ componentField }" name="stateId">
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <Select
                v-bind="componentField"
                @update:model-value="handleStateChange"
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione Estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem v-for="s in states" :key="s.id" :value="s.id">
                    {{ s.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="municipalityId">
            <FormItem>
              <FormLabel>Municipio</FormLabel>
              <Select
                v-bind="componentField"
                :disabled="!values.stateId"
                @update:model-value="handleMunicipalityChange"
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione Municipio" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem
                    v-for="m in municipalities"
                    :key="m.id"
                    :value="m.id"
                  >
                    {{ m.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>

        <FormField v-slot="{ componentField }" name="parishId">
          <FormItem>
            <FormLabel>Parroquia</FormLabel>
            <Select v-bind="componentField" :disabled="!values.municipalityId">
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione Parroquia" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem v-for="p in parishes" :key="p.id" :value="p.id">
                  {{ p.name }}
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        </FormField>

        <div class="my-2 border-t"></div>

        <FormField v-slot="{ componentField }" name="name">
          <FormItem>
            <FormLabel>Nombre del Centro</FormLabel>
            <FormControl>
              <Input
                v-bind="componentField"
                placeholder="Eruela Bolivariana..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField v-slot="{ componentField }" name="type">
            <FormItem>
              <FormLabel>Tipo de Instalación</FormLabel>
              <Select v-bind="componentField">
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione Tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem
                    v-for="t in locationTypes"
                    :key="t.value"
                    :value="t.value"
                  >
                    {{ t.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="capacity">
            <FormItem>
              <FormLabel>Capacidad Estimada</FormLabel>
              <FormControl>
                <Input type="number" v-bind="componentField" placeholder="0" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>

        <FormField v-slot="{ componentField }" name="address">
          <FormItem>
            <FormLabel>Dirección Detallada</FormLabel>
            <FormControl>
              <Textarea
                v-bind="componentField"
                placeholder="Av. Principal..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <DialogFooter>
          <Button type="button" variant="outline" @click="emit('close')">
            Cancelar
          </Button>
          <Button type="submit" :disabled="isSubmitting"> Guardar </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
