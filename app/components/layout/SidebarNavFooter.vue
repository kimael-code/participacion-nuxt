<script setup lang="ts">
import { authClient } from '~/utils/auth-client';
import { useSidebar } from '~/components/ui/sidebar';

const session = authClient.useSession();
const user = computed(() => session.value?.data?.user);

const { isMobile, setOpenMobile } = useSidebar();

async function handleLogout() {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        setOpenMobile(false);
        navigateTo('/');
      },
    },
  });
}
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar class="h-8 w-8 rounded-lg">
              <AvatarImage
                v-if="user?.image"
                :src="user.image"
                :alt="user.name || 'Usuario'"
              />
              <AvatarFallback class="rounded-lg">
                {{
                  user?.name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('') || 'US'
                }}
              </AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold">{{ user?.name }}</span>
              <span class="truncate text-xs">{{ user?.email }}</span>
            </div>
            <Icon name="i-lucide-chevrons-up-down" class="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          :side="isMobile ? 'bottom' : 'right'"
          align="end"
          :side-offset="4"
        >
          <DropdownMenuLabel class="p-0 font-normal">
            <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar class="h-8 w-8 rounded-lg">
                <AvatarImage
                  v-if="user?.image"
                  :src="user.image"
                  :alt="user.name || 'Usuario'"
                />
                <AvatarFallback class="rounded-lg">
                  {{
                    user?.name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('') || 'US'
                  }}
                </AvatarFallback>
              </Avatar>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">{{ user?.name }}</span>
                <span class="truncate text-xs">{{ user?.email }}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Icon name="i-lucide-sparkles" class="mr-2" />
              Actualizar a Pro
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Icon name="i-lucide-badge-check" class="mr-2" />
              Cuenta
            </DropdownMenuItem>
            <DropdownMenuItem as-child>
              <NuxtLink to="/dashboard" @click="setOpenMobile(false)">
                <Icon name="i-lucide-settings" class="mr-2" />
                Configuración
              </NuxtLink>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Icon name="i-lucide-bell" class="mr-2" />
              Notificaciones
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="handleLogout">
            <Icon name="i-lucide-log-out" class="mr-2" />
            Cerrar Sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
