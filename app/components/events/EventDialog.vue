<script setup lang="ts">
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { toast } from 'vue-sonner';

const props = defineProps<{
  open: boolean;
  event?: {
    id: string;
    name: string;
    date: string | Date;
    description?: string;
    active: boolean;
  } | null;
}>();

const emit = defineEmits(['close', 'saved']);
const isEditing = computed(() => !!props.event);

const validationSchema = toTypedSchema(
  z.object({
    name: z.string().min(3, 'Nombre requerido'),
    date: z.string().min(1, 'Fecha requerida'),
    description: z.string().optional(),
    active: z.boolean().default(false),
  }),
);

const { handleSubmit, isSubmitting, setValues, resetForm } = useForm({
  validationSchema,
});

watch(
  () => props.event,
  (newVal) => {
    if (newVal) {
      // Format date for input type="date"
      const dateObj = new Date(newVal.date);
      const dateStr = dateObj.toISOString().split('T')[0];

      setValues({
        name: newVal.name,
        date: dateStr,
        description: newVal.description || '',
        active: newVal.active,
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
      ? `/api/events/${props.event?.id}`
      : '/api/events';

    const method = isEditing.value ? 'PATCH' : 'POST';

    await $fetch(url, {
      method,
      body: values,
    });

    toast.success(`Evento ${isEditing.value ? 'actualizado' : 'creado'}`);
    emit('saved');
  } catch (error: any) {
    toast.error(error.statusMessage || 'Error al guardar evento');
  }
});
</script>

<template>
  <Dialog :open="open" @update:open="(val) => !val && emit('close')">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{
          isEditing ? 'Editar Evento' : 'Nuevo Evento'
        }}</DialogTitle>
        <DialogDescription> Registre una jornada o evento. </DialogDescription>
      </DialogHeader>

      <form @submit="onSubmit" class="grid gap-4 py-4">
        <FormField v-slot="{ componentField }" name="name">
          <FormItem>
            <FormLabel>Nombre del Evento</FormLabel>
            <FormControl>
              <Input
                v-bind="componentField"
                placeholder="Jornada Especial..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="date">
          <FormItem>
            <FormLabel>Fecha</FormLabel>
            <FormControl>
              <Input type="date" v-bind="componentField" />
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
                placeholder="Detalles adicionales..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="active">
          <FormItem
            class="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"
          >
            <div class="space-y-0.5">
              <FormLabel>Activo</FormLabel>
              <FormDescription>
                Marcar como evento activo actual.
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                :checked="componentField.modelValue"
                @update:checked="componentField['onUpdate:modelValue']"
              />
            </FormControl>
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
