<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { toast } from 'vue-sonner';

interface Props {
  open: boolean;
  employee?: any;
  catalogs?: any;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  employee: null,
  catalogs: () => ({ units: [], centers: [] }),
});

const emit = defineEmits(['close', 'saved']);

const form = ref({
  cedula: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  administrativeUnitId: '',
  votingCenterId: '',
});

const isSubmitting = ref(false);

onMounted(() => {
  if (props.employee) {
    form.value = {
      cedula: props.employee.cedula,
      firstName: props.employee.firstName,
      lastName: props.employee.lastName,
      email: props.employee.email || '',
      phone: props.employee.phone || '',
      administrativeUnitId: props.employee.administrativeUnitId || '',
      votingCenterId: props.employee.votingCenterId || '',
    };
  }
});

const handleSubmit = async () => {
  if (!form.value.cedula || !form.value.firstName || !form.value.lastName) {
    toast.error('Por favor complete los campos obligatorios');
    return;
  }

  isSubmitting.value = true;
  try {
    const url = props.employee
      ? `/api/employees/${props.employee.id}`
      : '/api/employees';

    const method = props.employee ? 'PATCH' : 'POST';

    await $fetch(url, {
      method,
      body: form.value,
    });

    toast.success(props.employee ? 'Empleado actualizado' : 'Empleado creado');
    emit('saved');
  } catch (error) {
    toast.error('Error al guardar empleado');
    console.error(error);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <Dialog :open="open" @update:open="$emit('close')">
    <DialogContent class="sm:max-w-[525px]">
      <DialogHeader>
        <DialogTitle>{{
          employee ? 'Editar Empleado' : 'Nuevo Empleado'
        }}</DialogTitle>
        <DialogDescription>
          Complete los datos del empleado. Los campos con * son obligatorios.
        </DialogDescription>
      </DialogHeader>

      <form class="grid gap-4 py-4" @submit.prevent="handleSubmit">
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="firstName">Nombre *</Label>
            <Input id="firstName" v-model="form.firstName" required />
          </div>
          <div class="grid gap-2">
            <Label for="lastName">Apellido *</Label>
            <Input id="lastName" v-model="form.lastName" required />
          </div>
        </div>

        <div class="grid gap-2">
          <Label for="cedula">Cédula *</Label>
          <Input
            id="cedula"
            v-model="form.cedula"
            required
            placeholder="V-12345678"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div class="grid gap-2">
            <Label for="phone">Teléfono</Label>
            <Input id="phone" v-model="form.phone" placeholder="0412-1234567" />
          </div>
        </div>

        <div class="grid gap-2">
          <Label for="unit">Unidad Administrativa</Label>
          <Select v-model="form.administrativeUnitId">
            <SelectTrigger id="unit">
              <SelectValue placeholder="Seleccione unidad" />
            </SelectTrigger>
            <SelectContent>
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

        <div class="grid gap-2">
          <Label for="center">Centro de Votación</Label>
          <Select v-model="form.votingCenterId">
            <SelectTrigger id="center">
              <SelectValue placeholder="Seleccione centro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="center in catalogs?.centers || []"
                :key="center.id"
                :value="center.id"
              >
                {{ center.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter class="mt-4">
          <Button type="button" variant="outline" @click="$emit('close')"
            >Cancelar</Button
          >
          <Button type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Guardando...' : 'Guardar Empleado' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
