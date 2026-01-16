<script setup lang="ts">
import { useForm, Field } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { toast } from 'vue-sonner';
import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';

const props = defineProps<{
  open: boolean;
  unit?: { id: string; name: string; description?: string } | null;
}>();

const emit = defineEmits(['close', 'saved']);
const isEditing = computed(() => !!props.unit);

const validationSchema = toTypedSchema(
  z.object({
    name: z.string().min(2, 'Nombre muy corto'),
    description: z.string().optional(),
  }),
);

const { handleSubmit, isSubmitting, resetForm } = useForm({
  validationSchema,
  initialValues: {
    name: '',
    description: '',
  },
});

watch(
  () => props.unit,
  (newVal) => {
    if (newVal) {
      resetForm({
        values: {
          name: newVal.name,
          description: newVal.description || '',
        },
      });
    } else {
      resetForm({
        values: {
          name: '',
          description: '',
        },
      });
    }
  },
  { immediate: true },
);

const onSubmit = handleSubmit(async (values) => {
  try {
    const url = isEditing.value ? `/api/units/${props.unit?.id}` : '/api/units';

    const method = isEditing.value ? 'PATCH' : 'POST';

    await $fetch(url, {
      method,
      body: values,
    });

    toast.success(`Unidad ${isEditing.value ? 'actualizada' : 'creada'}`);
    emit('saved');
  } catch (error: any) {
    toast.error(error.statusMessage || 'Error al guardar unidad');
  }
});
</script>

<template>
  <Dialog :open="open" @update:open="(val) => !val && emit('close')">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{
          isEditing ? 'Editar Unidad' : 'Nueva Unidad'
        }}</DialogTitle>
        <DialogDescription>
          Defina la estructura organizativa.
        </DialogDescription>
      </DialogHeader>

      <form @submit="onSubmit" class="grid gap-4 py-4">
        <Field v-slot="{ componentField, errorMessage }" name="name">
          <div class="grid gap-2">
            <Label for="name">Nombre</Label>
            <Input
              id="name"
              v-bind="componentField"
              placeholder="Recursos Humanos"
            />
            <span v-if="errorMessage" class="text-xs text-destructive">
              {{ errorMessage }}
            </span>
          </div>
        </Field>

        <Field v-slot="{ componentField, errorMessage }" name="description">
          <div class="grid gap-2">
            <Label for="description">Descripción</Label>
            <Textarea
              id="description"
              v-bind="componentField"
              placeholder="Descripción opcional..."
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
