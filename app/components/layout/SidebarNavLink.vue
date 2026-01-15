<script setup lang="ts">
import type { SidebarMenuButtonVariants } from '~/components/ui/sidebar';
import type { NavLink } from '~/types/nav';
import { useSidebar } from '~/components/ui/sidebar';

withDefaults(
  defineProps<{
    item: NavLink;
    size?: SidebarMenuButtonVariants['size'];
  }>(),
  {
    size: 'default',
  },
);

const { setOpenMobile } = useSidebar();
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton
        as-child
        :tooltip="item.title"
        :size="size"
        :data-active="item.link === $route.path"
      >
        <NuxtLink :to="item.link" @click="setOpenMobile(false)">
          <Icon v-if="item.icon" :name="item.icon" />
          <span>{{ item.title }}</span>
          <span
            v-if="item.new"
            class="flex items-center rounded-md bg-[#adfa1d] px-1.5 py-0.5 text-[10px] leading-none text-black no-underline group-hover:no-underline"
          >
            Nuevo
          </span>
        </NuxtLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
