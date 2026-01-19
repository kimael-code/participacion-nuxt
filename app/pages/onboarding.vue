<script setup lang="ts">
import { authClient } from '~/utils/auth-client';
import { toast } from 'vue-sonner';

definePageMeta({
  layout: 'auth',
  auth: {
    unauthenticatedOnly: false, // Must be logged in
    navigateAuthenticatedTo: undefined, // Don't redirect away
  },
});

const session = authClient.useSession();
const isLoading = ref(false);

const startDemo = async () => {
  isLoading.value = true;
  try {
    // Use native fetch instead of $fetch
    const response = await fetch('/api/onboarding/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = await response.json();

    if (res.success) {
      toast.success('Entorno preparado con éxito');
      // Force a hard redirect to ensure middleware re-evaluates with fresh session
      window.location.href = '/dashboard';
    } else {
      toast.error(res.message || 'Error al configurar el entorno');
    }
  } catch (error) {
    toast.error('Error de conexión con el servidor');
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center p-4 text-center"
  >
    <div class="max-w-md space-y-6">
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tighter sm:text-4xl">
          Bienvenido, {{ session?.data?.user?.name }}
        </h1>
        <p class="text-muted-foreground">
          Estás por ingresar a una <strong>Demostración Interactiva</strong> del
          Sistema de Gestión de Participación.
        </p>
      </div>

      <div
        class="space-y-4 rounded-lg border bg-card p-6 text-left text-sm shadow-xs"
      >
        <p>Este entorno es un <strong>Sandbox Privado</strong> solo para ti.</p>
        <ul class="list-disc space-y-1 pl-4 text-muted-foreground">
          <li>Se generará una empresa ficticia para ti.</li>
          <li>Se crearán 50 empleados y datos de prueba.</li>
          <li>Tendrás permisos de Administrador completos.</li>
          <li>Tus datos son privados y nadie más los puede ver.</li>
          <li>El entorno se reinicia automáticamente cada 24 horas.</li>
        </ul>
      </div>

      <Button
        size="lg"
        class="w-full font-bold"
        :disabled="isLoading"
        @click="startDemo"
      >
        <Icon
          v-if="isLoading"
          name="i-lucide-loader-2"
          class="mr-2 h-4 w-4 animate-spin"
        />
        {{ isLoading ? 'Preparando tu entorno...' : 'Iniciar Demo Ahora' }}
      </Button>

      <p class="text-xs text-muted-foreground">
        Desarrollado por Maikel como parte de su Portafolio.
      </p>
    </div>
  </div>
</template>
