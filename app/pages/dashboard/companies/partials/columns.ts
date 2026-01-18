import { Button } from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox/Checkbox.vue';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ColumnDef } from '@tanstack/vue-table';
import { Building2, MoreHorizontal, Pencil, Trash2 } from 'lucide-vue-next';
import { h, type Ref } from 'vue';

export interface Company {
  id: string;
  name: string;
  rif?: string;
  logo?: string;
  createdAt: string;
}

export const createColumns = (
  can: { update: boolean; delete: boolean },
  processingRowId: Ref<string | null>,
  handlers: {
    onUpdate: (row: Company) => void;
    onDestroy: (row: Company) => void;
  },
): ColumnDef<Company>[] => [
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
    header: 'Empresa',
    cell: ({ row }) => {
      const company = row.original;
      return h('div', { class: 'flex items-center gap-3' }, [
        h(
          'div',
          {
            class:
              'flex h-10 w-10 items-center justify-center rounded-lg bg-muted overflow-hidden flex-shrink-0',
          },
          company.logo
            ? h('img', {
                src: company.logo,
                alt: company.name,
                class: 'h-full w-full object-cover',
              })
            : h(Building2, { class: 'h-5 w-5 text-muted-foreground' }),
        ),
        h('span', { class: 'font-medium' }, company.name),
      ]);
    },
  },
  {
    accessorKey: 'rif',
    header: 'RIF',
    cell: ({ row }) => row.original.rif || 'N/A',
  },
  {
    accessorKey: 'createdAt',
    header: 'Fecha Creación',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const company = row.original;
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
                    { variant: 'ghost', class: 'h-8 w-8 p-0' },
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
                  can.update
                    ? h(
                        DropdownMenuItem,
                        { onClick: () => handlers.onUpdate(company) },
                        {
                          default: () => [
                            h(Pencil, { class: 'mr-2 h-4 w-4' }),
                            h('span', 'Editar'),
                          ],
                        },
                      )
                    : null,
                  can.delete
                    ? h(
                        DropdownMenuItem,
                        {
                          class: 'text-destructive focus:text-destructive',
                          onClick: () => handlers.onDestroy(company),
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
