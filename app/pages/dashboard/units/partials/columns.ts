import type { ColumnDef } from '@tanstack/vue-table';
import { h } from 'vue';
import DataTableActions from '~/components/DataTableActions.vue';
import { Checkbox } from '~/components/ui/checkbox';

export interface Unit {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export const createColumns = (
  can: { update: boolean; delete: boolean },
  processingRowId: Ref<string | null>,
  handlers: { onUpdate: (row: Unit) => void; onDestroy: (row: Unit) => void },
): ColumnDef<Unit>[] => [
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
    cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.name),
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
    cell: ({ row }) => h('div', row.original.description || '-'),
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
