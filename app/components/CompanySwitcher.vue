<script setup lang="ts">
import { Building2, ChevronsUpDown } from 'lucide-vue-next';
import { useCompanyStore } from '~/stores/company';

const store = useCompanyStore();
const { selectedCompany, userCompanies, isLoading } = storeToRefs(store);
const { switchCompany, init } = store;

const isOpen = ref(false);

const handleSelect = async (companyId: string) => {
  await switchCompany(companyId);
  isOpen.value = false;
};

onMounted(async () => {
  console.log('CompanySwitcher mounted with Pinia. Calling init...');
  await init();
  console.log('Init completed. Companies:', userCompanies.value);
});
</script>

<template>
  <DropdownMenu v-model:open="isOpen">
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        class="h-auto w-full justify-between px-2 py-2"
        :disabled="isLoading"
      >
        <div class="flex min-w-0 items-center gap-2">
          <div
            v-if="selectedCompany?.logo"
            class="h-8 w-8 shrink-0 overflow-hidden rounded-md"
          >
            <img
              :src="selectedCompany.logo"
              :alt="selectedCompany.name"
              class="h-full w-full object-cover"
            />
          </div>
          <div
            v-else
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted"
          >
            <Building2 class="h-4 w-4 text-muted-foreground" />
          </div>

          <div class="flex min-w-0 flex-col items-start">
            <span class="truncate text-sm font-medium">
              {{ selectedCompany?.name || 'Seleccionar empresa' }}
            </span>
            <span
              v-if="selectedCompany?.rif"
              class="text-xs text-muted-foreground"
            >
              {{ selectedCompany.rif }}
            </span>
          </div>
        </div>

        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="start" class="w-[280px]">
      <DropdownMenuLabel>Empresas</DropdownMenuLabel>
      <DropdownMenuSeparator />

      <DropdownMenuRadioGroup :model-value="selectedCompany?.id">
        <DropdownMenuRadioItem
          v-for="company in userCompanies"
          :key="company.id"
          :value="company.id"
          @click="handleSelect(company.id)"
        >
          <div class="flex items-center gap-2">
            <div
              v-if="company.logo"
              class="h-6 w-6 shrink-0 overflow-hidden rounded"
            >
              <img
                :src="company.logo"
                :alt="company.name"
                class="h-full w-full object-cover"
              />
            </div>
            <div
              v-else
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted"
            >
              <Building2 class="h-3 w-3 text-muted-foreground" />
            </div>

            <div class="flex flex-col">
              <span class="text-sm font-medium">{{ company.name }}</span>
              <span v-if="company.rif" class="text-xs text-muted-foreground">
                {{ company.rif }}
              </span>
            </div>
          </div>
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>

      <DropdownMenuSeparator />

      <DropdownMenuItem as-child>
        <NuxtLink to="/dashboard/companies" class="cursor-pointer">
          <Building2 class="mr-2 h-4 w-4" />
          <span>Gestionar empresas</span>
        </NuxtLink>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
