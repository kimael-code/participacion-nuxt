import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox/Checkbox.vue';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ColumnDef } from '@tanstack/vue-table';
import {
  Calendar,
  CheckCircle2,
  MoreHorizontal,
  Pencil,
  Trash2,
  XCircle,
} from 'lucide-vue-next';
import { h, type Ref } from 'vue';

export interface Event {
  id: string;
  name: string;
  date: string;
  active: boolean;
  description?: string;
  companyId: string;
}

export const createColumns = (
  can: { update: boolean; delete: boolean },
  processingRowId: Ref<string | null>,
  handlers: {
    onUpdate: (row: Event) => void;
    onDestroy: (row: Event) => void;
    onActivate: (row: Event) => void;
    onDeactivate: (row: Event) => void;
  },
): ColumnDef<Event>[] => [
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
    accessorKey: 'name',
    header: 'Nombre',
    cell: ({ row }) => {
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-medium' }, row.original.name),
        h(
          'span',
          { class: 'text-xs text-muted-foreground truncate max-w-[300px]' },
          row.original.description || '-',
        ),
      ]);
    },
  },
  {
    accessorKey: 'date',
    header: 'Fecha',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        h(Calendar, { class: 'h-4 w-4 text-muted-foreground' }),
        h('span', new Date(row.original.date).toLocaleDateString()),
      ]);
    },
  },
  {
    accessorKey: 'active',
    header: 'Estado',
    cell: ({ row }) => {
      const isActive = row.original.active;
      return h(
        Badge,
        {
          variant: 'outline',
          class: isActive
            ? 'border-green-200 bg-green-100 text-green-800 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400'
            : '',
        },
        () => (isActive ? 'Activo' : 'Inactivo'),
      );
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const event = row.original;
      const loading = processingRowId.value === event.id;

      return h(
        DropdownMenu,
        {},
        {
          default: () => [
            h(
              DropdownMenuTrigger,
              { asChild: true },
              {
                default: () =>
                  h(
                    Button,
                    {
                      variant: 'ghost',
                      class: 'h-8 w-8 p-0',
                      disabled: loading,
                    },
                    {
                      default: () => [
                        h(MoreHorizontal, { class: 'h-4 w-4' }),
                        h('span', { class: 'sr-only' }, 'Abrir menú'),
                      ],
                    },
                  ),
              },
            ),
            h(
              DropdownMenuContent,
              { align: 'end' },
              {
                default: () => [
                  // Activate/Deactivate
                  !event.active
                    ? h(
                        DropdownMenuItem,
                        { onClick: () => handlers.onActivate(event) },
                        {
                          default: () => [
                            h(CheckCircle2, {
                              class: 'mr-2 h-4 w-4 text-green-600',
                            }),
                            h('span', 'Activar'),
                          ],
                        },
                      )
                    : h(
                        DropdownMenuItem,
                        { onClick: () => handlers.onDeactivate(event) },
                        {
                          default: () => [
                            h(XCircle, { class: 'mr-2 h-4 w-4 text-red-600' }),
                            h('span', 'Desactivar'),
                          ],
                        },
                      ),
                  h(DropdownMenuSeparator),
                  // Update
                  can.update
                    ? h(
                        DropdownMenuItem,
                        { onClick: () => handlers.onUpdate(event) },
                        {
                          default: () => [
                            h(Pencil, { class: 'mr-2 h-4 w-4' }),
                            h('span', 'Editar'),
                          ],
                        },
                      )
                    : null,
                  // Delete
                  can.delete
                    ? h(
                        DropdownMenuItem,
                        {
                          class: 'text-destructive focus:text-destructive',
                          onClick: () => handlers.onDestroy(event),
                        },
                        {
                          default: () => [
                            h(Trash2, { class: 'mr-2 h-4 w-4' }),
                            h('span', 'Eliminar'),
                          ],
                        },
                      )
                    : null,
                ],
              },
            ),
          ],
        },
      );
    },
  },
];
