<script setup lang="ts">
// Layout for the dashboard
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <LayoutHeader />
      <div class="flex flex-1 flex-col p-4 pt-0 lg:p-6 lg:pt-0">
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
