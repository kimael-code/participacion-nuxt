<script setup lang="ts">
import { Loader2, MoreHorizontal, Pencil, Trash2 } from 'lucide-vue-next';
import { ref } from 'vue';

interface Props {
  row: any;
  can?: {
    update?: boolean;
    delete?: boolean;
  };
  loading?: boolean;
}

defineProps<Props>();

defineEmits<{
  update: [row: any];
  destroy: [row: any];
}>();

const menuIsOpen = ref(false);
</script>

<template>
  <DropdownMenu v-model:open="menuIsOpen">
    <DropdownMenuTrigger as-child>
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8"
            :disabled="loading"
            @click="menuIsOpen = true"
          >
            <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
            <MoreHorizontal v-else class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Menú de acciones</p>
        </TooltipContent>
      </Tooltip>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Acciones</DropdownMenuLabel>

      <DropdownMenuGroup>
        <DropdownMenuItem v-if="can?.update" @click="$emit('update', row)">
          <Pencil class="mr-2 h-4 w-4" />
          <span>Editar</span>
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <DropdownMenuSeparator v-if="can?.delete" />

      <DropdownMenuGroup v-if="can?.delete">
        <DropdownMenuItem
          class="text-destructive focus:text-destructive"
          @click="$emit('destroy', row)"
        >
          <Trash2 class="mr-2 h-4 w-4" />
          <span>Eliminar</span>
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
