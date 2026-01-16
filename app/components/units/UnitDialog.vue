<script setup lang="ts">
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { toast } from 'vue-sonner';

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

const { handleSubmit, isSubmitting, setValues, resetForm } = useForm({
  validationSchema,
});

watch(
  () => props.unit,
  (newVal) => {
    if (newVal) {
      setValues({
        name: newVal.name,
        description: newVal.description || '',
      });
    } else {
      resetForm();
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
        <FormField v-slot="{ componentField }" name="name">
          <FormItem>
            <FormLabel>Nombre</FormLabel>
            <FormControl>
              <Input v-bind="componentField" placeholder="Recursos Humanos" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="description">
          <FormItem>
            <FormLabel>Descripción</FormLabel>
            <FormControl>
              <Textarea
                v-bind="componentField"
                placeholder="Descripción opcional..."
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
