<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';

interface Unit {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  units: Unit[];
  initialUnitId?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  apply: [filters: { unitId?: string }];
  clear: [];
}>();

const selectedUnit = ref<string>('all');

// Initialize with initial value
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      selectedUnit.value = props.initialUnitId || 'all';
    }
  },
  { immediate: true },
);

const hasFilters = computed(() => selectedUnit.value !== 'all');

function handleApply() {
  const filters = {
    unitId: selectedUnit.value !== 'all' ? selectedUnit.value : undefined,
  };
  emit('apply', filters);
}

function handleClear() {
  selectedUnit.value = 'all';
  emit('clear');
}
</script>

<template>
  <Sheet :open="open" @update:open="$emit('close')">
    <SheetContent side="right" class="w-[400px] sm:w-[540px]">
      <SheetHeader>
        <SheetTitle>Filtros de Búsqueda Avanzados</SheetTitle>
        <SheetDescription>
          Parametrice la consulta de empleados usando los siguientes controles.
        </SheetDescription>
      </SheetHeader>

      <div class="space-y-4 py-6">
        <div class="space-y-2">
          <Label for="unit-filter">Unidad Administrativa</Label>
          <Select v-model="selectedUnit">
            <SelectTrigger id="unit-filter">
              <SelectValue placeholder="Seleccione una unidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Unidades</SelectItem>
              <SelectItem v-for="unit in units" :key="unit.id" :value="unit.id">
                {{ unit.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <SheetFooter>
        <Button :disabled="!hasFilters" @click="handleApply">
          Aplicar Filtros
        </Button>
        <SheetClose as-child>
          <Button variant="outline" @click="handleClear">
            Limpiar Filtros
          </Button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
