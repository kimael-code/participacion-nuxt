<script setup lang="ts">
import { authClient } from '~/utils/auth-client';
import { Loader2 } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

definePageMeta({
  layout: 'auth',
});

const isLoading = ref(false);
const email = ref('');
const password = ref('');

const handleLogin = async () => {
  isLoading.value = true;
  await authClient.signIn.email(
    {
      email: email.value,
      password: password.value,
      callbackURL: '/dashboard',
    },
    {
      onRequest: () => {
        isLoading.value = true;
      },
      onResponse: () => {
        isLoading.value = false;
      },
      onError: (ctx) => {
        toast.error(ctx.error.message || 'Error al iniciar sesión');
      },
      onSuccess: () => {
        toast.success('Sesión iniciada con éxito');
      },
    },
  );
};
</script>

<template>
  <div class="flex flex-col gap-6">
    <Card class="overflow-hidden py-0">
      <CardContent class="grid p-0 md:grid-cols-2">
        <form class="p-6 md:p-8" @submit.prevent="handleLogin">
          <div class="flex flex-col gap-6">
            <div class="flex flex-col items-center text-center">
              <h1 class="text-2xl font-bold">Bienvenido de nuevo</h1>
              <p class="text-balance text-muted-foreground">
                Inicia sesión en tu cuenta
              </p>
            </div>
            <div class="grid gap-2">
              <Label for="email">Correo Electrónico</Label>
              <Input
                id="email"
                v-model="email"
                type="email"
                placeholder="jose.canizales@ejemplo.com"
                required
                :disabled="isLoading"
              />
            </div>
            <div class="grid gap-2">
              <div class="flex items-center">
                <Label for="password">Contraseña</Label>
                <a
                  href="#"
                  class="ml-auto text-sm underline-offset-2 hover:underline"
                >
                  ¿Olvidó su contraseña?
                </a>
              </div>
              <Input
                id="password"
                v-model="password"
                type="password"
                required
                :disabled="isLoading"
              />
            </div>
            <Button type="submit" class="w-full" :disabled="isLoading">
              <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
              Ingresar
            </Button>
            <div class="text-center text-sm">
              ¿No tienes una cuenta?
              <NuxtLink to="/register" class="underline underline-offset-4">
                Registrarse
              </NuxtLink>
            </div>
          </div>
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
    <div
      class="text-center text-xs text-balance text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary"
    >
      By clicking continue, you agree to our
      <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
    </div>
  </div>
</template>
