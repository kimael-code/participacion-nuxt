<script setup lang="ts">
import { ChevronsUpDown, Plus } from 'lucide-vue-next';

const { selectedCompany, userCompanies, switchCompany, isLoading, init } =
  useCompanyContext();

// Cargar empresas al montar
onMounted(async () => {
  await init();
});

const handleCompanySelect = async (companyId: string) => {
  await switchCompany(companyId);
};
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            :disabled="isLoading"
          >
            <ClientOnly>
              <div
                class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
              >
                <Icon
                  v-if="selectedCompany?.logo"
                  :name="selectedCompany.logo"
                  class="size-4"
                />
                <Icon v-else name="i-lucide-building-2" class="size-4" />
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">
                  {{ selectedCompany?.name || 'Seleccionar empresa' }}
                </span>
                <span v-if="selectedCompany?.rif" class="truncate text-xs">
                  {{ selectedCompany.rif }}
                </span>
              </div>
            </ClientOnly>
            <ChevronsUpDown class="ml-auto" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          align="start"
          side="bottom"
          :side-offset="4"
        >
          <DropdownMenuLabel class="text-xs text-muted-foreground">
            Empresas
          </DropdownMenuLabel>
          <DropdownMenuItem
            v-for="(company, index) in userCompanies"
            :key="company.id"
            class="gap-2 p-2"
            @click="handleCompanySelect(company.id)"
          >
            <div
              class="flex size-6 items-center justify-center rounded-sm border"
            >
              <Icon
                v-if="company.logo"
                :name="company.logo"
                class="size-4 shrink-0"
              />
              <Icon v-else name="i-lucide-building-2" class="size-4 shrink-0" />
            </div>
            {{ company.name }}
            <DropdownMenuShortcut>⌘{{ index + 1 }}</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="gap-2 p-2" as-child>
            <NuxtLink to="/dashboard/companies">
              <div
                class="flex size-6 items-center justify-center rounded-md border bg-background"
              >
                <Plus class="size-4" />
              </div>
              <div class="font-medium text-muted-foreground">
                Gestionar empresas
              </div>
            </NuxtLink>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
