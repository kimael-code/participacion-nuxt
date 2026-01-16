<script setup lang="ts">
import { useForm, Field } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { toast } from 'vue-sonner';
import { Switch } from '~/components/ui/switch';
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
  event?: {
    id: string;
    name: string;
    date: string | Date;
    type?: string;
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
    type: z.enum(['voting', 'medical', 'training', 'other']),
    description: z.string().optional(),
    active: z.boolean(),
  }),
);

const { handleSubmit, isSubmitting, resetForm } = useForm({
  validationSchema,
  initialValues: {
    name: '',
    date: '',
    type: 'voting' as const,
    description: '',
    active: false,
  },
});

watch(
  () => props.event,
  (newVal) => {
    if (newVal) {
      // Resolve properties from both possible names
      const isActive =
        (newVal as any).active ?? (newVal as any).isActive ?? false;
      const rawDate = (newVal as any).date ?? (newVal as any).eventDate;
      const dateObj = new Date(rawDate);
      const dateStr = dateObj.toISOString().split('T')[0];

      resetForm({
        values: {
          name: newVal.name,
          date: dateStr,
          type: (newVal.type as any) || 'voting',
          description: newVal.description || '',
          active: !!isActive,
        },
      });
    } else {
      resetForm({
        values: {
          name: '',
          date: '',
          type: 'voting' as const,
          description: '',
          active: false,
        },
      });
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

      <form class="grid gap-4 py-4" @submit="onSubmit">
        <Field v-slot="{ componentField, errorMessage }" name="name">
          <div class="grid gap-2">
            <Label for="name">Nombre del Evento</Label>
            <Input
              id="name"
              v-bind="componentField"
              placeholder="Jornada Especial..."
            />
            <span v-if="errorMessage" class="text-xs text-destructive">
              {{ errorMessage }}
            </span>
          </div>
        </Field>

        <Field v-slot="{ componentField, errorMessage }" name="date">
          <div class="grid gap-2">
            <Label for="date">Fecha</Label>
            <Input id="date" type="date" v-bind="componentField" />
            <span v-if="errorMessage" class="text-xs text-destructive">
              {{ errorMessage }}
            </span>
          </div>
        </Field>

        <Field v-slot="{ componentField, errorMessage }" name="type">
          <div class="grid gap-2">
            <Label for="type">Tipo de Evento</Label>
            <Select v-bind="componentField">
              <SelectTrigger id="type">
                <SelectValue placeholder="Seleccione tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="voting">Votación</SelectItem>
                <SelectItem value="medical">Médico/Salud</SelectItem>
                <SelectItem value="training">Capacitación</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
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
              placeholder="Detalles adicionales..."
            />
            <span v-if="errorMessage" class="text-xs text-destructive">
              {{ errorMessage }}
            </span>
          </div>
        </Field>

        <Field v-slot="{ value, handleChange }" name="active">
          <div
            class="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"
          >
            <div class="space-y-0.5">
              <Label>Activo</Label>
              <div class="text-[0.8rem] text-muted-foreground">
                Marcar como evento activo actual.
              </div>
            </div>
            <Switch :model-value="!!value" @update:model-value="handleChange" />
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
