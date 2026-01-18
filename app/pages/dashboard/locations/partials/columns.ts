import DataTableActions from '@/components/DataTableActions.vue';
import { Badge } from '@/components/ui/badge';
import Checkbox from '@/components/ui/checkbox/Checkbox.vue';
import type { ColumnDef } from '@tanstack/vue-table';
import { h, type Ref } from 'vue';

export interface Location {
  id: string;
  name: string;
  type: string;
  address: string;
  state: { name: string };
  municipality: { name: string };
  parish: { name: string };
}

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

export const createColumns = (
  can: { update: boolean; delete: boolean },
  processingRowId: Ref<string | null>,
  handlers: {
    onUpdate: (row: Location) => void;
    onDestroy: (row: Location) => void;
  },
): ColumnDef<Location>[] => [
  {
    id: 'select',
    header: ({ table }) =>
      h(
        'div',
        { class: 'flex items-center pl-2' },
        h(Checkbox, {
          modelValue:
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate'),
          'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
            table.toggleAllPageRowsSelected(!!value),
          ariaLabel: 'Seleccionar todo',
        }),
      ),
    cell: ({ row }) =>
      h(
        'div',
        { class: 'flex items-center pl-2' },
        h(Checkbox, {
          modelValue: row.getIsSelected(),
          'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
            row.toggleSelected(!!value),
          ariaLabel: 'Seleccionar fila',
        }),
      ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'serial',
    header: '#',
    cell: ({ row, table }) => {
      const meta = table.options.meta as {
        currentPage: number;
        pageSize: number;
      };
      const startingIndex = (meta.currentPage - 1) * meta.pageSize;
      return h('div', startingIndex + row.index + 1);
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: 'Nombre',
    cell: ({ row }) => {
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-medium' }, row.original.name),
        h(
          'span',
          { class: 'text-xs text-muted-foreground truncate max-w-[300px]' },
          row.original.address,
        ),
      ]);
    },
  },
  {
    accessorKey: 'type',
    header: 'Tipo',
    cell: ({ row }) =>
      h(Badge, { variant: 'secondary' }, () => getTypeLabel(row.original.type)),
  },
  {
    id: 'location',
    header: 'Ubicación Geográfica',
    cell: ({ row }) => {
      const loc = row.original;
      return h('div', { class: 'flex flex-col' }, [
        h(
          'span',
          { class: 'text-sm' },
          `${loc.state?.name || '-'} / ${loc.municipality?.name || '-'}`,
        ),
        h(
          'span',
          { class: 'text-xs text-muted-foreground' },
          loc.parish?.name || '-',
        ),
      ]);
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) =>
      h(DataTableActions, {
        row: row.original,
        can,
        loading: processingRowId.value === row.original.id,
        onUpdate: () => handlers.onUpdate(row.original),
        onDestroy: () => handlers.onDestroy(row.original),
      }),
  },
];
