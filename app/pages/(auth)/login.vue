<script setup lang="ts">
definePageMeta({
  layout: 'auth',
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <Card class="overflow-hidden py-0">
      <CardContent class="grid p-0 md:grid-cols-2">
        <form class="p-6 md:p-8">
          <div class="flex flex-col gap-6">
            <div class="flex flex-col items-center text-center">
              <h1 class="text-2xl font-bold">Bienvenido de nuevo</h1>
              <p class="text-balance text-muted-foreground">
                Inicia sesión en tu cuenta de Acme Inc
              </p>
            </div>
            <div class="grid gap-2">
              <Label for="username">Usuario</Label>
              <Input
                id="username"
                type="username"
                placeholder="josé.cañizales"
                required
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
              <Input id="password" type="password" required />
            </div>
            <Button type="submit" class="w-full"> Ingresar </Button>
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
          >
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
