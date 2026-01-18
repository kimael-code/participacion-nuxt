<script setup lang="ts" generic="TData">
import {
  FlexRender,
  getCoreRowModel,
  useVueTable,
  type ColumnDef,
  type Table as TanstackTable,
} from '@tanstack/vue-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  EllipsisIcon,
  Eraser,
  Filter,
  Loader2,
  Plus,
  Search as SearchIcon,
  Trash2,
  X,
} from 'lucide-vue-next';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { computed, ref, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';

interface PaginatedData<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

interface Props {
  columns: ColumnDef<TData, any>[];
  data?: PaginatedData<TData>;
  searchPlaceholder?: string;
  can?: {
    create?: boolean;
    delete?: boolean;
    export?: boolean;
  };
  loading?: boolean;
  hasAdvancedSearch?: boolean;
  isAdvancedSearchActive?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  searchPlaceholder: 'Buscar rápido...',
  loading: false,
  data: undefined,
  can: undefined,
  hasAdvancedSearch: false,
  isAdvancedSearchActive: false,
});

const emit = defineEmits<{
  new: [];
  search: [query: string];
  pageChange: [page: number];
  perPageChange: [perPage: number];
  sortChange: [sortBy: string, sortOrder: 'asc' | 'desc'];
  batchDelete: [selectedIds: string[], selectAll: boolean];
  export: [format: 'pdf' | 'excel' | 'json'];
  advancedSearch: [];
  clearAdvancedFilters: [];
  update: [row: any];
  destroy: [row: any];
}>();

const searchQuery = ref('');
const rowSelection = ref<Record<string, boolean>>({});
const menuIsOpen = ref(false);

// Debounced search
const debouncedSearch = useDebounceFn((query: string) => {
  emit('search', query);
}, 500);

watch(searchQuery, (newValue) => {
  debouncedSearch(newValue);
});

const clearSearch = () => {
  searchQuery.value = '';
};

// Table setup
const table = useVueTable({
  get data() {
    return props.data?.data || [];
  },
  get columns() {
    return props.columns;
  },
  getCoreRowModel: getCoreRowModel(),
  manualPagination: true,
  manualSorting: true,
  meta: {
    get currentPage() {
      return props.data?.page || 1;
    },
    get pageSize() {
      return props.data?.limit || 10;
    },
  },
  state: {
    get rowSelection() {
      return rowSelection.value;
    },
  },
  onRowSelectionChange: (updaterOrValue) => {
    rowSelection.value =
      typeof updaterOrValue === 'function'
        ? updaterOrValue(rowSelection.value)
        : updaterOrValue;
  },
  getRowId: (row: any) => row.id,
}) as TanstackTable<TData>;

// Pagination
const currentPage = computed(() => props.data?.page || 1);
const perPage = computed(() => props.data?.limit || 10);
const totalRecords = computed(() => props.data?.total || 0);
const totalPages = computed(() =>
  Math.ceil(totalRecords.value / perPage.value),
);

const handlePerPageChange = (value: any) => {
  if (value) {
    emit('perPageChange', parseInt(String(value)));
  }
};

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    emit('pageChange', page);
  }
};

// Batch actions
const selectedRowIds = computed(() => {
  return Object.keys(rowSelection.value).filter(
    (key) => rowSelection.value[key],
  );
});

const selectAllRecords = ref(false);
const showSelectAllBanner = computed(() => {
  const allPageRowsSelected = table.getIsAllPageRowsSelected();
  const hasRows = table.getRowModel().rows.length > 0;
  const totalRecordsExceedPage = totalRecords.value > perPage.value;
  return (
    allPageRowsSelected &&
    hasRows &&
    totalRecordsExceedPage &&
    !selectAllRecords.value
  );
});

const handleSelectAllRecords = () => {
  selectAllRecords.value = true;
};

const handleDeselectAll = () => {
  selectAllRecords.value = false;
  rowSelection.value = {};
};

const handleBatchDelete = () => {
  if (selectedRowIds.value.length > 0) {
    emit('batchDelete', selectedRowIds.value, selectAllRecords.value);
  }
};

// Page numbers for pagination
const pageNumbers = computed(() => {
  const pages: (number | 'ellipsis')[] = [];
  const current = currentPage.value;
  const total = totalPages.value;

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    if (current > 3) pages.push('ellipsis');

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) pages.push('ellipsis');
    pages.push(total);
  }

  return pages;
});
const isAdvancedSearchOpen = ref(false);

const toggleAdvancedSearch = () => {
  isAdvancedSearchOpen.value = !isAdvancedSearchOpen.value;
  emit('advancedSearch'); // Keep emitting just in case parent needs to know
};
</script>

<template>
  <div class="w-full space-y-4">
    <!-- Toolbar -->
    <div class="flex items-center justify-between">
      <div class="flex flex-1 items-center gap-2">
        <!-- Search -->
        <div class="relative w-full max-w-sm">
          <SearchIcon
            class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            v-model="searchQuery"
            :placeholder="searchPlaceholder"
            class="pr-9 pl-9"
          />
          <button
            v-if="searchQuery"
            class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            @click="clearSearch"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Reset filters button (if needed) -->
        <Tooltip v-if="searchQuery">
          <TooltipTrigger as-child>
            <Button variant="ghost" @click="clearSearch">
              <Eraser class="mr-2 h-4 w-4" />
              Reiniciar
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Remover todos los filtros</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <!-- Advanced Search Active Indicator -->
      <div
        v-if="isAdvancedSearchActive"
        class="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 dark:border-blue-800 dark:bg-blue-950"
      >
        <Filter class="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span class="text-sm font-medium text-blue-900 dark:text-blue-100">
          Filtros avanzados aplicados
        </span>
        <Button
          variant="ghost"
          size="sm"
          class="h-6 px-2 text-blue-900 hover:bg-blue-100 hover:text-blue-900 dark:text-blue-100 dark:hover:bg-blue-900"
          @click="$emit('clearAdvancedFilters')"
        >
          <X class="h-3 w-3" />
          Reiniciar
        </Button>
      </div>

      <div class="flex items-center gap-2">
        <!-- Actions menu -->
        <DropdownMenu
          v-if="can?.delete || can?.export || hasAdvancedSearch"
          v-model:open="menuIsOpen"
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <DropdownMenuTrigger as-child>
                  <Button variant="outline">
                    <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
                    <EllipsisIcon v-else class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Otras acciones</p>
              </TooltipContent>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Otras acciones</DropdownMenuLabel>

                <DropdownMenuGroup v-if="can?.export">
                  <DropdownMenuItem @click="$emit('export', 'pdf')">
                    Exportar a PDF
                  </DropdownMenuItem>
                  <!--
              <DropdownMenuItem @click="$emit('export', 'excel')">
                Exportar a Excel
              </DropdownMenuItem>
              -->
                </DropdownMenuGroup>

                <DropdownMenuSeparator
                  v-if="hasAdvancedSearch && (can?.export || can?.delete)"
                />

                <DropdownMenuGroup v-if="hasAdvancedSearch">
                  <DropdownMenuItem @click="toggleAdvancedSearch">
                    <Filter class="mr-2 h-4 w-4" />
                    {{
                      isAdvancedSearchOpen
                        ? 'Ocultar filtros'
                        : 'Buscar avanzado'
                    }}
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator v-if="can?.delete" />

                <DropdownMenuGroup v-if="can?.delete">
                  <DropdownMenuItem
                    class="text-destructive focus:text-destructive"
                    :disabled="selectedRowIds.length === 0"
                    @click="handleBatchDelete"
                  >
                    <Trash2 class="mr-2 h-4 w-4" />
                    Eliminar selección
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </Tooltip>
          </TooltipProvider>
        </DropdownMenu>

        <!-- New button -->
        <Tooltip v-if="can?.create">
          <TooltipTrigger as-child>
            <Button @click="$emit('new')">
              <Plus class="mr-2 h-4 w-4" />
              Nuevo
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Crear nuevo registro</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>

    <!-- Advanced Search Sheet -->
    <Sheet v-model:open="isAdvancedSearchOpen">
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filtros Avanzados</SheetTitle>
          <SheetDescription>
            Ajusta los criterios de búsqueda para filtrar los resultados.
          </SheetDescription>
        </SheetHeader>
        <div class="mt-6 flex flex-col gap-4">
          <slot name="advanced-search" />

          <div class="mt-4 flex flex-col gap-2">
            <Button variant="outline" @click="$emit('clearAdvancedFilters')">
              <Eraser class="mr-2 h-4 w-4" />
              Limpiar Filtros
            </Button>
            <Button @click="isAdvancedSearchOpen = false">
              Ver Resultados
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>

    <!-- Select All Banner -->
    <div
      v-if="showSelectAllBanner"
      class="flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950"
    >
      <p class="text-sm text-blue-900 dark:text-blue-100">
        Se han seleccionado {{ selectedRowIds.length }} registros de esta
        página.
        <button
          class="font-medium underline hover:no-underline"
          @click="handleSelectAllRecords"
        >
          Seleccionar los {{ totalRecords }} registros
        </button>
      </p>
      <button
        class="text-sm font-medium text-blue-900 hover:underline dark:text-blue-100"
        @click="handleDeselectAll"
      >
        Deseleccionar todo
      </button>
    </div>

    <!-- Select All Active Banner -->
    <div
      v-if="selectAllRecords"
      class="flex items-center justify-between rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950"
    >
      <p class="text-sm font-medium text-green-900 dark:text-green-100">
        Se han seleccionado los {{ totalRecords }} registros.
      </p>
      <button
        class="text-sm font-medium text-green-900 hover:underline dark:text-green-100"
        @click="handleDeselectAll"
      >
        Deseleccionar todo
      </button>
    </div>

    <!-- Table -->
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
          >
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              :class="(header.column.columnDef.meta as any)?.class"
            >
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :data-state="row.getIsSelected() && 'selected'"
            >
              <TableCell
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                :class="(cell.column.columnDef.meta as any)?.class"
              >
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </TableCell>
            </TableRow>
          </template>

          <TableRow v-else>
            <TableCell :colspan="columns.length" class="h-24 text-center">
              <span v-if="loading">Cargando...</span>
              <span v-else>No hay registros.</span>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Footer with pagination -->
    <div class="flex items-center justify-between">
      <!-- Selection counter -->
      <div class="text-sm text-muted-foreground">
        <template v-if="selectedRowIds.length > 0">
          {{ selectedRowIds.length }} de {{ totalRecords }}
          {{
            selectedRowIds.length > 1
              ? 'registros seleccionados'
              : 'registro seleccionado'
          }}
        </template>
        <template v-else>
          {{ (currentPage - 1) * perPage + 1 }} a
          {{ Math.min(currentPage * perPage, totalRecords) }} de
          {{ totalRecords }}
          {{ totalRecords !== 1 ? 'registros' : 'registro' }}
        </template>
      </div>

      <div class="flex items-center gap-6">
        <!-- Per page selector -->
        <div class="flex items-center gap-2">
          <p class="text-xs font-medium">Registros por página</p>
          <Select
            :model-value="String(perPage)"
            @update:model-value="handlePerPageChange"
          >
            <SelectTrigger class="h-8 w-[70px]">
              <SelectValue :placeholder="String(perPage)" />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectItem
                v-for="size in [10, 20, 30, 40, 50]"
                :key="size"
                :value="String(size)"
              >
                {{ size }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Pagination -->
        <div class="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="outline"
                size="icon"
                class="h-8 w-8"
                :disabled="currentPage === 1"
                @click="goToPage(1)"
              >
                <ChevronsLeft class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Primera página</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="outline"
                size="icon"
                class="h-8 w-8"
                :disabled="currentPage === 1"
                @click="goToPage(currentPage - 1)"
              >
                <ChevronLeft class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Página anterior</TooltipContent>
          </Tooltip>

          <template v-for="(page, index) in pageNumbers" :key="index">
            <Button
              v-if="page !== 'ellipsis'"
              :variant="page === currentPage ? 'default' : 'outline'"
              size="icon"
              class="h-8 w-8"
              @click="goToPage(page as number)"
            >
              {{ page }}
            </Button>
            <span v-else class="px-1 text-muted-foreground">...</span>
          </template>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="outline"
                size="icon"
                class="h-8 w-8"
                :disabled="currentPage === totalPages"
                @click="goToPage(currentPage + 1)"
              >
                <ChevronRight class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Página siguiente</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="outline"
                size="icon"
                class="h-8 w-8"
                :disabled="currentPage === totalPages"
                @click="goToPage(totalPages)"
              >
                <ChevronsRight class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Última página</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  </div>
</template>
