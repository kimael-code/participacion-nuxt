<script setup lang="ts">
// Minimalist layout for presentation view
</script>

<template>
  <div
    class="min-h-screen bg-background text-foreground transition-colors duration-300"
  >
    <main class="h-full w-full p-4 md:p-8">
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
