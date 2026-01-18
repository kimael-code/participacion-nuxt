<script setup lang="ts">
import { useForm, Field, ErrorMessage } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { toast } from 'vue-sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const props = defineProps<{
  open: boolean;
  company?: { id: string; name: string; rif?: string; logo?: string } | null;
}>();

const emit = defineEmits(['close', 'saved']);

const isEditing = computed(() => !!props.company);

const validationSchema = toTypedSchema(
  z.object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    rif: z.string().optional(),
    logo: z.string().url('URL inválida').optional().or(z.literal('')),
  }),
);

const { handleSubmit, isSubmitting, setValues, resetForm } = useForm({
  validationSchema,
});

// Load initial values
watch(
  () => props.company,
  (newVal) => {
    if (newVal) {
      setValues({
        name: newVal.name,
        rif: newVal.rif || '',
        logo: newVal.logo || '',
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
      ? `/api/companies/${props.company?.id}`
      : '/api/companies';

    const method = isEditing.value ? 'PUT' : 'POST';

    await $fetch(url, {
      method,
      body: values,
    });

    toast.success(
      `Empresa ${isEditing.value ? 'actualizada' : 'creada'} correctamente`,
    );
    emit('saved');
  } catch (error: any) {
    console.error(error);
    toast.error(error.statusMessage || 'Error al guardar empresa');
  }
});
</script>

<template>
  <Dialog :open="open" @update:open="(val) => !val && emit('close')">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{
          isEditing ? 'Editar Empresa' : 'Nueva Empresa'
        }}</DialogTitle>
        <DialogDescription>
          {{
            isEditing
              ? 'Edite los detalles de la empresa.'
              : 'Complete el formulario para crear una nueva empresa.'
          }}
        </DialogDescription>
      </DialogHeader>

      <form @submit="onSubmit" class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label for="name">Nombre</Label>
          <Field name="name" v-slot="{ componentField }">
            <Input
              id="name"
              v-bind="componentField"
              placeholder="Mi Empresa C.A."
            />
          </Field>
          <ErrorMessage name="name" class="text-sm text-destructive" />
        </div>

        <div class="grid gap-2">
          <Label for="rif">RIF / NIT</Label>
          <Field name="rif" v-slot="{ componentField }">
            <Input
              id="rif"
              v-bind="componentField"
              placeholder="J-12345678-9"
            />
          </Field>
          <ErrorMessage name="rif" class="text-sm text-destructive" />
        </div>

        <div class="grid gap-2">
          <Label for="logo">Logo URL</Label>
          <Field name="logo" v-slot="{ componentField }">
            <Input
              id="logo"
              v-bind="componentField"
              placeholder="https://..."
            />
          </Field>
          <div class="text-xs text-muted-foreground">
            Enlace directo a la imagen del logo (opcional).
          </div>
          <ErrorMessage name="logo" class="text-sm text-destructive" />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="emit('close')">
            Cancelar
          </Button>
          <Button type="submit" :disabled="isSubmitting">
            {{ isEditing ? 'Guardar Cambios' : 'Crear Empresa' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
