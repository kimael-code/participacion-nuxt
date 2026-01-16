<script setup lang="ts">
import { useForm, Field } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { toast } from 'vue-sonner';
import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

const props = defineProps<{
  open: boolean;
  location?: any;
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
    municipalityId: z.string().min(1, 'Municipio requerido'),
    parishId: z.string().min(1, 'Parroquia requerida'),
    capacity: z.number().optional().nullable(),
  }),
);

const { handleSubmit, isSubmitting, resetForm, values, setFieldValue } =
  useForm({
    validationSchema,
    initialValues: {
      name: '',
      type: 'voting_center' as const,
      address: '',
      stateId: '',
      municipalityId: '',
      parishId: '',
      capacity: null,
    },
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
const handleStateChange = async (val: string) => {
  setFieldValue('municipalityId', '');
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
      const stateId = newVal.state?.id;
      const municipalityId = newVal.municipality?.id;
      const parishId = newVal.parish?.id;

      if (stateId) await loadMunicipalities(stateId);
      if (municipalityId) await loadParishes(municipalityId);

      resetForm({
        values: {
          name: newVal.name,
          type: newVal.type,
          address: newVal.address,
          stateId: stateId || '',
          municipalityId: municipalityId || '',
          parishId: parishId || '',
          capacity: newVal.capacity,
        },
      });
    } else {
      resetForm({
        values: {
          name: '',
          type: 'voting_center' as const,
          address: '',
          stateId: '',
          municipalityId: '',
          parishId: '',
          capacity: null,
        },
      });
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

      <form class="grid gap-4 py-4" @submit="onSubmit">
        <!-- Geographic Section (Row 1) -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field v-slot="{ componentField, errorMessage }" name="stateId">
            <div class="grid gap-2">
              <Label for="state">Estado</Label>
              <Select
                v-bind="componentField"
                @update:model-value="handleStateChange"
              >
                <SelectTrigger id="state">
                  <SelectValue placeholder="Seleccione Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="s in states" :key="s.id" :value="s.id">
                    {{ s.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <span v-if="errorMessage" class="text-xs text-destructive">
                {{ errorMessage }}
              </span>
            </div>
          </Field>

          <Field
            v-slot="{ componentField, errorMessage }"
            name="municipalityId"
          >
            <div class="grid gap-2">
              <Label for="municipality">Municipio</Label>
              <Select
                v-bind="componentField"
                :disabled="!values.stateId"
                @update:model-value="handleMunicipalityChange"
              >
                <SelectTrigger id="municipality">
                  <SelectValue placeholder="Seleccione Municipio" />
                </SelectTrigger>
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
              <span v-if="errorMessage" class="text-xs text-destructive">
                {{ errorMessage }}
              </span>
            </div>
          </Field>
        </div>

        <Field v-slot="{ componentField, errorMessage }" name="parishId">
          <div class="grid gap-2">
            <Label for="parish">Parroquia</Label>
            <Select v-bind="componentField" :disabled="!values.municipalityId">
              <SelectTrigger id="parish">
                <SelectValue placeholder="Seleccione Parroquia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="p in parishes" :key="p.id" :value="p.id">
                  {{ p.name }}
                </SelectItem>
              </SelectContent>
            </Select>
            <span v-if="errorMessage" class="text-xs text-destructive">
              {{ errorMessage }}
            </span>
          </div>
        </Field>

        <div class="my-2 border-t"></div>

        <Field v-slot="{ componentField, errorMessage }" name="name">
          <div class="grid gap-2">
            <Label for="name">Nombre del Centro</Label>
            <Input
              id="name"
              v-bind="componentField"
              placeholder="Escuela Bolivariana..."
            />
            <span v-if="errorMessage" class="text-xs text-destructive">
              {{ errorMessage }}
            </span>
          </div>
        </Field>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field v-slot="{ componentField, errorMessage }" name="type">
            <div class="grid gap-2">
              <Label for="type">Tipo de Instalación</Label>
              <Select v-bind="componentField">
                <SelectTrigger id="type">
                  <SelectValue placeholder="Seleccione Tipo" />
                </SelectTrigger>
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
              <span v-if="errorMessage" class="text-xs text-destructive">
                {{ errorMessage }}
              </span>
            </div>
          </Field>

          <Field v-slot="{ componentField, errorMessage }" name="capacity">
            <div class="grid gap-2">
              <Label for="capacity">Capacidad Estimada</Label>
              <Input
                id="capacity"
                type="number"
                v-bind="componentField"
                placeholder="0"
              />
              <span v-if="errorMessage" class="text-xs text-destructive">
                {{ errorMessage }}
              </span>
            </div>
          </Field>
        </div>

        <Field v-slot="{ componentField, errorMessage }" name="address">
          <div class="grid gap-2">
            <Label for="address">Dirección Detallada</Label>
            <Textarea
              id="address"
              v-bind="componentField"
              placeholder="Av. Principal..."
            />
            <span v-if="errorMessage" class="text-xs text-destructive">
              {{ errorMessage }}
            </span>
          </div>
        </Field>

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
