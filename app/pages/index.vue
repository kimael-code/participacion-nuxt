<script setup lang="ts">
import { authClient } from '~/utils/auth-client';

definePageMeta({
  layout: false,
});

const session = authClient.useSession();
const isLogged = computed(() => !!session.value?.data);
</script>

<template>
  <div
    class="flex min-h-screen flex-col items-center bg-[#FDFDFC] p-6 text-[#1b1b18] lg:justify-center lg:p-8 dark:bg-[#0a0a0a]"
  >
    <header
      class="mb-6 w-full max-w-[335px] text-sm not-has-[nav]:hidden lg:max-w-4xl"
    >
      <nav class="flex items-center justify-end gap-4">
        <template v-if="isLogged">
          <NuxtLink
            to="/dashboard"
            class="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
          >
            Tablero
          </NuxtLink>
        </template>
        <template v-else>
          <NuxtLink
            to="/login"
            class="inline-block rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#19140035] dark:text-[#EDEDEC] dark:hover:border-[#3E3E3A]"
          >
            Acceder
          </NuxtLink>
          <NuxtLink
            to="/register"
            class="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
          >
            Registrarse
          </NuxtLink>
        </template>
      </nav>
    </header>
    <div
      class="flex w-full items-center justify-center opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0"
    >
      <main
        class="flex w-full max-w-[335px] flex-col-reverse overflow-hidden rounded-lg shadow-xl lg:max-w-4xl lg:flex-row"
      >
        <div
          class="flex-1 rounded-br-lg rounded-bl-lg bg-white p-6 pb-12 text-[13px] leading-5 shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] lg:rounded-tl-lg lg:rounded-br-none lg:p-20 dark:bg-[#161615] dark:text-[#EDEDEC] dark:shadow-[inset_0px_0px_0px_1px_#fffaed2d]"
        >
          <h1 class="mb-2 text-xl font-semibold tracking-tight">
            Participación Nuxt
          </h1>
          <p class="mb-2 text-[#706f6c] dark:text-[#A1A09A]">
            Una aplicación moderna para visualizar y analizar tus datos de
            manera eficiente. Transforma tus métricas en insights accionables
            con nuestros dashboards interactivos.
          </p>
        </div>
        <div
          class="relative -mb-px aspect-335/376 w-full shrink-0 overflow-hidden rounded-t-lg bg-[#fff2f2] lg:mb-0 lg:-ml-px lg:aspect-auto lg:w-[438px] lg:rounded-t-none lg:rounded-r-lg dark:bg-[#1D0002]"
        >
          <!-- Gráfico SVG como placeholder visual -->
          <svg
            class="h-full w-full rounded-lg bg-card shadow-lg"
            viewBox="0 0 400 200"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="50" y="100" width="40" height="50" class="fill-primary" />
            <rect x="110" y="80" width="40" height="70" class="fill-primary" />
            <rect x="170" y="50" width="40" height="100" class="fill-primary" />
            <rect x="230" y="110" width="40" height="40" class="fill-primary" />
            <rect x="290" y="20" width="40" height="130" class="fill-primary" />
            <line
              x1="30"
              y1="150"
              x2="370"
              y2="150"
              class="stroke-muted-foreground"
              stroke-width="2"
            />
          </svg>
          <div
            class="absolute inset-0 rounded-t-lg shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] lg:overflow-hidden lg:rounded-t-none lg:rounded-r-lg dark:shadow-[inset_0px_0px_0px_1px_#fffaed2d]"
          />
        </div>
      </main>
    </div>
    <div class="hidden h-14.5 lg:block" />
  </div>
</template>
