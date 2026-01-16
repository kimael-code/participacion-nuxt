<script setup lang="ts">
import { authClient } from '~/utils/auth-client';
import { Loader2 } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

definePageMeta({
  layout: 'auth',
});

const isLoading = ref(false);
const name = ref('');
const email = ref('');
const password = ref('');
const passwordConfirmation = ref('');

const handleRegister = async () => {
  if (password.value !== passwordConfirmation.value) {
    toast.error('Las contraseñas no coinciden');
    return;
  }

  isLoading.value = true;

  try {
    // 1. Registrar usuario
    const signUpResult = await authClient.signUp.email({
      email: email.value,
      name: name.value,
      password: password.value,
    });

    if (signUpResult.error) {
      toast.error(signUpResult.error.message || 'Error al crear la cuenta');
      isLoading.value = false;
      return;
    }

    toast.success('Cuenta creada exitosamente');

    // 2. Iniciar sesión automáticamente
    const signInResult = await authClient.signIn.email({
      email: email.value,
      password: password.value,
    });

    if (signInResult.error) {
      toast.error(
        'Cuenta creada, pero hubo un error al iniciar sesión. Por favor, inicia sesión manualmente.',
      );
      await navigateTo('/login');
      return;
    }

    // 3. Redirigir al dashboard
    toast.success('¡Bienvenido!');
    await navigateTo('/dashboard');
  } catch (error) {
    toast.error('Error inesperado al crear la cuenta');
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="flex flex-col gap-6">
    <Card class="overflow-hidden py-0">
      <CardContent class="grid p-0 md:grid-cols-2">
        <form class="p-6 md:p-8" @submit.prevent="handleRegister">
          <div class="flex flex-col items-center text-center">
            <h1 class="text-2xl font-bold">Crear cuenta</h1>
            <p class="text-balance text-muted-foreground">
              Ingrese los datos solicitados a continuación
            </p>
          </div>
          <div class="mt-6 grid gap-4">
            <div class="grid gap-2">
              <Label for="username"> Nombre </Label>
              <Input
                id="username"
                v-model="name"
                placeholder="por ejemplo: José Cañizales"
                type="text"
                auto-capitalize="none"
                auto-complete="name"
                auto-correct="off"
                required
                :disabled="isLoading"
              />
            </div>
            <div class="grid gap-2">
              <Label for="email"> Correo Electrónico </Label>
              <Input
                id="email"
                v-model="email"
                placeholder="jcanizales@ejemplo.com"
                type="email"
                auto-capitalize="none"
                auto-complete="email"
                auto-correct="off"
                required
                :disabled="isLoading"
              />
            </div>
            <div class="grid gap-2">
              <Label for="password"> Contraseña </Label>
              <PasswordInput
                id="password"
                v-model="password"
                required
                :disabled="isLoading"
              />
            </div>
            <div class="grid gap-2">
              <Label for="confirm-password"> Confirme Contraseña </Label>
              <PasswordInput
                id="confirm-password"
                v-model="passwordConfirmation"
                required
                :disabled="isLoading"
              />
            </div>
            <Button type="submit" :disabled="isLoading" class="w-full">
              <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
              Crear Cuenta
            </Button>
          </div>

          <p class="mt-6 text-center text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?
            <NuxtLink
              to="/login"
              class="font-medium underline underline-offset-4 hover:text-primary"
            >
              Login
            </NuxtLink>
          </p>
        </form>
        <div class="relative hidden bg-muted md:block">
          <img
            src="/placeholder.svg"
            alt="Image"
            class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          />
        </div>
      </CardContent>
    </Card>
    <p class="px-8 text-center text-sm text-muted-foreground">
      Al hacer clic en "Crear Cuenta", aceptas nuestros
      <a href="/terms" class="underline underline-offset-4 hover:text-primary">
        Términos del Servicio
      </a>
      y
      <a
        href="/privacy"
        class="underline underline-offset-4 hover:text-primary"
      >
        la Política de Privacidad
      </a>
      .
    </p>
  </div>
</template>

<style scoped></style>
