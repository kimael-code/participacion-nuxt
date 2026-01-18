import type { ColumnDef } from '@tanstack/vue-table';
import {
  Building2,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  MapPin,
} from 'lucide-vue-next';
import { h } from 'vue';
import DataTableActions from '~/components/DataTableActions.vue';
import Button from '~/components/ui/button/Button.vue';
import Checkbox from '~/components/ui/checkbox/Checkbox.vue';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

interface Employee {
  id: string;
  cedula: string;
  firstName: string;
  lastName: string;
  email?: string;
  administrativeUnit?: { name: string };
  location?: { name: string };
  administrativeUnitId?: string;
  locationId?: string;
}

export const createColumns = (
  can: { update?: boolean; delete?: boolean },
  processingRowId: { value: string | null },
  onSort: (column: string, order: 'asc' | 'desc' | null) => void,
  currentSort: { column: string; order: 'asc' | 'desc' },
  handlers: {
    onUpdate: (row: Employee) => void;
    onDestroy: (row: Employee) => void;
  },
): ColumnDef<Employee, any>[] => [
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
          'onUpdate:modelValue': (value: boolean) =>
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
          'onUpdate:modelValue': (value: boolean) =>
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
      const startingIndex =
        ((meta?.currentPage || 1) - 1) * (meta?.pageSize || 10);
      const trueIndex = startingIndex + row.index + 1;
      return h('div', { class: 'text-center' }, trueIndex);
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'firstName',
    id: 'name',
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
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
                      variant: isSorted ? 'default' : 'ghost',
                      size: 'sm',
                      class: '-ml-3 h-8 data-[state=open]:bg-accent',
                    },
                    {
                      default: () => [
                        h('span', 'Empleado'),
                        isSorted === 'desc'
                          ? h(ChevronDown, { class: 'ml-2 h-4 w-4' })
                          : isSorted === 'asc'
                            ? h(ChevronUp, { class: 'ml-2 h-4 w-4' })
                            : h(ChevronsUpDown, { class: 'ml-2 h-4 w-4' }),
                      ],
                    },
                  ),
              },
            ),
            h(
              DropdownMenuContent,
              { align: 'start' },
              {
                default: () => [
                  h(DropdownMenuLabel, {}, { default: () => 'Ordenar' }),
                  h(DropdownMenuSeparator),
                  h(
                    DropdownMenuRadioGroup,
                    {
                      modelValue:
                        currentSort.column === 'name'
                          ? currentSort.order
                          : 'none',
                    },
                    {
                      default: () => [
                        h(
                          DropdownMenuRadioItem,
                          {
                            value: 'asc',
                            onSelect: () => onSort('name', 'asc'),
                          },
                          { default: () => 'ASC' },
                        ),
                        h(
                          DropdownMenuRadioItem,
                          {
                            value: 'desc',
                            onSelect: () => onSort('name', 'desc'),
                          },
                          { default: () => 'DESC' },
                        ),
                        h(
                          DropdownMenuRadioItem,
                          {
                            value: 'none',
                            onSelect: () => onSort('name', null),
                          },
                          { default: () => 'Restablecer' },
                        ),
                      ],
                    },
                  ),
                ],
              },
            ),
          ],
        },
      );
    },
    cell: ({ row }) => {
      const employee = row.original;
      return h('div', { class: 'flex flex-col' }, [
        h(
          'span',
          { class: 'font-medium text-foreground' },
          `${employee.firstName} ${employee.lastName}`,
        ),
        h(
          'span',
          { class: 'text-xs text-muted-foreground' },
          employee.email || 'Sin correo',
        ),
      ]);
    },
  },
  {
    accessorKey: 'cedula',
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
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
                      variant: isSorted ? 'default' : 'ghost',
                      size: 'sm',
                      class: '-ml-3 h-8 data-[state=open]:bg-accent',
                    },
                    {
                      default: () => [
                        h('span', 'Cédula'),
                        isSorted === 'desc'
                          ? h(ChevronDown, { class: 'ml-2 h-4 w-4' })
                          : isSorted === 'asc'
                            ? h(ChevronUp, { class: 'ml-2 h-4 w-4' })
                            : h(ChevronsUpDown, { class: 'ml-2 h-4 w-4' }),
                      ],
                    },
                  ),
              },
            ),
            h(
              DropdownMenuContent,
              { align: 'start' },
              {
                default: () => [
                  h(DropdownMenuLabel, {}, { default: () => 'Ordenar' }),
                  h(DropdownMenuSeparator),
                  h(
                    DropdownMenuRadioGroup,
                    {
                      modelValue:
                        currentSort.column === 'cedula'
                          ? currentSort.order
                          : 'none',
                    },
                    {
                      default: () => [
                        h(
                          DropdownMenuRadioItem,
                          {
                            value: 'asc',
                            onSelect: () => onSort('cedula', 'asc'),
                          },
                          { default: () => 'ASC' },
                        ),
                        h(
                          DropdownMenuRadioItem,
                          {
                            value: 'desc',
                            onSelect: () => onSort('cedula', 'desc'),
                          },
                          { default: () => 'DESC' },
                        ),
                        h(
                          DropdownMenuRadioItem,
                          {
                            value: 'none',
                            onSelect: () => onSort('cedula', null),
                          },
                          { default: () => 'Restablecer' },
                        ),
                      ],
                    },
                  ),
                ],
              },
            ),
          ],
        },
      );
    },
    cell: (info) => h('div', {}, info.getValue()),
  },
  {
    id: 'unit_location',
    header: 'Unidad / Localización',
    cell: ({ row }) => {
      const employee = row.original;
      return h('div', { class: 'flex flex-col gap-1' }, [
        h('div', { class: 'flex items-center text-xs text-muted-foreground' }, [
          h(Building2, { class: 'mr-1 h-3 w-3' }),
          employee.administrativeUnit?.name || 'N/A',
        ]),
        h('div', { class: 'flex items-center text-xs text-muted-foreground' }, [
          h(MapPin, { class: 'mr-1 h-3 w-3' }),
          employee.location?.name || 'N/A',
        ]),
      ]);
    },
    enableSorting: false,
  },
  {
    id: 'actions',
    header: () => h('div', { class: 'text-right' }, 'Acciones'),
    enableHiding: false,
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'flex justify-end' },
        h(DataTableActions, {
          row: row.original,
          can,
          loading: processingRowId.value === row.original.id,
          onUpdate: () => handlers.onUpdate(row.original),
          onDestroy: () => handlers.onDestroy(row.original),
        }),
      );
    },
  },
];
