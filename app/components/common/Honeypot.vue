<script setup lang="ts">
/**
 * Honeypot component to catch basic bots.
 * If this field is filled, it's likely a bot.
 */
const model = defineModel<string>();

// Use a common but "tempting" name for bots like "website" or "phone_alt"
const fieldName = 'website_url';
</script>

<template>
  <div class="hidden-field" aria-hidden="true">
    <label :for="fieldName">Si eres humano, deja este campo vacío</label>
    <input
      :id="fieldName"
      v-model="model"
      type="text"
      :name="fieldName"
      tabindex="-1"
      autocomplete="off"
    />
  </div>
</template>

<style scoped>
.hidden-field {
  display: none !important;
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
</style>
