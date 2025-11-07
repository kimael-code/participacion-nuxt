<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next';

definePageMeta({
  layout: 'auth',
});

const isLoading = ref(false);
</script>

<template>
  <div class="flex flex-col gap-6">
    <Card class="overflow-hidden py-0">
      <CardContent class="grid p-0 md:grid-cols-2">
        <form class="p-6 md:p-8">
          <div class="flex flex-col items-center text-center">
            <h1 class="text-2xl font-bold">Crear cuenta</h1>
            <p class="text-balance text-muted-foreground">
              Ingrese los datos solicitados a continuación
            </p>
          </div>
          <div class="grid gap-4 mt-6">
            <div class="grid gap-2">
              <Label for="username"> Nombre de Usuario </Label>
              <Input
                id="username"
                placeholder="por ejemplo: jcañizales"
                type="text"
                auto-capitalize="none"
                auto-complete="username"
                auto-correct="off"
                :disabled="isLoading"
              />
            </div>
            <div class="grid gap-2">
              <Label for="email"> Correo Electrónico </Label>
              <Input
                id="email"
                placeholder="jcanizales@ejemplo.com"
                type="email"
                auto-capitalize="none"
                auto-complete="email"
                auto-correct="off"
                :disabled="isLoading"
              />
            </div>
            <div class="grid gap-2">
              <Label for="password"> Contraseña </Label>
              <PasswordInput id="password" />
            </div>
            <div class="grid gap-2">
              <Label for="confirm-password"> Confirme Contraseña </Label>
              <PasswordInput id="confirm-password" />
            </div>
            <Button :disabled="isLoading" class="w-full">
              <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
              Crear Cuenta
            </Button>
          </div>

          <p class="text-center text-sm text-muted-foreground mt-6">
            ¿Ya tienes una cuenta?
            <NuxtLink
              to="/login"
              class="underline underline-offset-4 hover:text-primary font-medium"
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
          >
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