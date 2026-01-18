<script setup lang="ts">
// Minimalist layout for presentation view
</script>

<template>
  <div
    class="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground transition-colors duration-300"
  >
    <main class="flex-1 p-4 md:p-8">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.bg-background {
  background-color: hsl(var(--background));
}
.text-foreground {
  color: hsl(var(--foreground));
}
</style>
