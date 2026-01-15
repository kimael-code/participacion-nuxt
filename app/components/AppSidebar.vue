<script setup lang="ts">
import type { NavGroup, NavLink, NavSectionTitle } from '~/types/nav';
import { navMenu, navMenuBottom } from '~/constants/menus';
import { authClient } from '~/utils/auth-client';
import { usePermissions } from '~/composables/usePermissions';

function resolveNavItemComponent(
  item: NavLink | NavGroup | NavSectionTitle,
): any {
  if ('children' in item) return resolveComponent('LayoutSidebarNavGroup');

  return resolveComponent('LayoutSidebarNavLink');
}

const teams = [
  {
    name: 'Empresa Demo C.A.',
    logo: 'i-lucide-building-2',
    plan: 'Enterprise',
  },
];

const session = authClient.useSession();
const user = computed(() => {
  const u = session.value?.data?.user;
  return {
    name: u?.name || 'Usuario',
    email: u?.email || '',
    avatar: u?.image || '',
  };
});

const { hasPermission } = usePermissions();

const filteredNavMenu = computed(() => {
  return navMenu
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasPermission(item.permission)),
    }))
    .filter((group) => group.items.length > 0);
});
</script>

<template>
  <Sidebar collapsible="icon" variant="inset">
    <SidebarHeader>
      <LayoutSidebarNavHeader :teams="teams" />
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup
        v-for="(nav, indexGroup) in filteredNavMenu"
        :key="indexGroup"
      >
        <SidebarGroupLabel v-if="nav.heading">
          {{ nav.heading }}
        </SidebarGroupLabel>
        <component
          :is="resolveNavItemComponent(item)"
          v-for="(item, index) in nav.items"
          :key="index"
          :item="item"
        />
      </SidebarGroup>
      <SidebarGroup class="mt-auto">
        <component
          :is="resolveNavItemComponent(item)"
          v-for="(item, index) in navMenuBottom"
          :key="index"
          :item="item"
          size="sm"
        />
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>
      <LayoutSidebarNavFooter :user="user" />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
