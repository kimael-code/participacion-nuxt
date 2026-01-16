<script setup lang="ts">
import {
  Upload,
  FileUp,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-vue-next';

definePageMeta({
  layout: 'dashboard',
});

const { isLoading, preview, results, handleFileUpload, importData, csvData } =
  useBulkImport();
</script>

<template>
  <div class="flex-1 space-y-4 p-8 pt-6">
    <div class="justification-between flex items-center space-y-2">
      <h2 class="text-3xl font-bold tracking-tight">Carga Masiva</h2>
    </div>

    <div class="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Importar Datos Maestros</CardTitle>
          <CardDescription>
            Sube un archivo CSV con la lista maestra de empleados. El sistema
            procesará automáticamente:
          </CardDescription>
          <ul
            class="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground"
          >
            <li>Ubicaciones (Centros de Votación, etc.)</li>
            <li>Estructura Geográfica (Estado, Municipio, Parroquia)</li>
            <li>Unidades Administrativas</li>
            <li>Empleados</li>
          </ul>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <!-- File upload area -->
            <div class="grid w-full max-w-sm items-center gap-1.5">
              <Label for="csv-file">Archivo CSV</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                :disabled="isLoading"
                @change="handleFileUpload"
              />
            </div>

            <!-- Preview -->
            <div v-if="preview" class="rounded-md border bg-muted/50 p-4">
              <div class="mb-4 flex items-center justify-between">
                <p class="text-sm font-medium">
                  Vista previa ({{ preview.rows }} filas detectadas)
                </p>
                <Badge variant="outline">CSV Válido</Badge>
              </div>

              <div class="overflow-x-auto rounded-md border bg-background">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        v-for="col in preview.columns"
                        :key="col"
                        class="whitespace-nowrap"
                      >
                        {{ col }}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow
                      v-for="(row, i) in preview.data.slice(0, 5)"
                      :key="i"
                    >
                      <TableCell
                        v-for="col in preview.columns"
                        :key="col"
                        class="whitespace-nowrap"
                      >
                        {{ row[col] }}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <p class="mt-2 text-xs text-muted-foreground">
                Mostrando las primeras 5 filas.
              </p>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-4">
              <Button :disabled="!csvData || isLoading" @click="importData">
                <Upload v-if="!isLoading" class="mr-2 h-4 w-4" />
                <Loader2 v-else class="mr-2 h-4 w-4 animate-spin" />
                {{ isLoading ? 'Procesando...' : 'Iniciar Importación' }}
              </Button>
              <Button variant="outline" as-child>
                <a href="/templates/bulk-import-template.csv" download>
                  <FileUp class="mr-2 h-4 w-4" />
                  Descargar Plantilla
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Results -->
      <div v-if="results" class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card class="col-span-4">
          <CardHeader>
            <CardTitle>Resumen de Importación</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid gap-6">
              <!-- Created Stats -->
              <div>
                <h4
                  class="mb-2 text-sm font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  Registros Nuevos
                </h4>
                <div class="grid grid-cols-2 gap-4 md:grid-cols-3">
                  <div
                    class="flex flex-col rounded-lg border bg-green-50 p-3 dark:bg-green-900/20"
                  >
                    <span class="text-2xl font-bold text-green-600">{{
                      results.created.employees
                    }}</span>
                    <span class="text-xs text-muted-foreground">Empleados</span>
                  </div>
                  <div class="flex flex-col rounded-lg border p-3">
                    <span class="text-2xl font-bold">{{
                      results.created.locations
                    }}</span>
                    <span class="text-xs text-muted-foreground"
                      >Ubicaciones</span
                    >
                  </div>
                  <div class="flex flex-col rounded-lg border p-3">
                    <span class="text-2xl font-bold">{{
                      results.created.administrativeUnits
                    }}</span>
                    <span class="text-xs text-muted-foreground">Unidades</span>
                  </div>
                  <div class="flex flex-col rounded-lg border p-3">
                    <span class="text-2xl font-bold">{{
                      results.created.states
                    }}</span>
                    <span class="text-xs text-muted-foreground">Estados</span>
                  </div>
                  <div class="flex flex-col rounded-lg border p-3">
                    <span class="text-2xl font-bold">{{
                      results.created.municipalities
                    }}</span>
                    <span class="text-xs text-muted-foreground"
                      >Municipios</span
                    >
                  </div>
                  <div class="flex flex-col rounded-lg border p-3">
                    <span class="text-2xl font-bold">{{
                      results.created.parishes
                    }}</span>
                    <span class="text-xs text-muted-foreground"
                      >Parroquias</span
                    >
                  </div>
                </div>
              </div>

              <!-- Updated Stats -->
              <div>
                <h4
                  class="mb-2 text-sm font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  Registros Actualizados
                </h4>
                <div class="grid grid-cols-2 gap-4 md:grid-cols-3">
                  <div
                    class="flex flex-col rounded-lg border bg-blue-50 p-3 dark:bg-blue-900/20"
                  >
                    <span class="text-2xl font-bold text-blue-600">{{
                      results.updated.employees
                    }}</span>
                    <span class="text-xs text-muted-foreground">Empleados</span>
                  </div>
                  <div
                    class="flex flex-col rounded-lg border bg-blue-50 p-3 dark:bg-blue-900/20"
                  >
                    <span class="text-2xl font-bold text-blue-600">{{
                      results.updated.locations
                    }}</span>
                    <span class="text-xs text-muted-foreground"
                      >Ubicaciones</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Errors Panel -->
        <Card
          v-if="results.errors.length > 0"
          class="col-span-3 border-destructive/50"
        >
          <CardHeader>
            <CardTitle class="flex items-center text-destructive">
              <AlertCircle class="mr-2 h-5 w-5" />
              Errores Detectados ({{ results.errors.length }})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea class="h-[300px] w-full rounded-md border p-4">
              <ul class="space-y-2">
                <li
                  v-for="(error, i) in results.errors"
                  :key="i"
                  class="flex items-start text-sm text-destructive"
                >
                  <span class="mr-2">•</span>
                  {{ error }}
                </li>
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card
          v-else
          class="col-span-3 border-green-500/50 bg-green-50/50 dark:bg-green-900/10"
        >
          <CardHeader>
            <CardTitle class="flex items-center text-green-600">
              <CheckCircle class="mr-2 h-5 w-5" />
              Importación Exitosa
            </CardTitle>
            <CardDescription>
              Todos los registros fueron procesados correctamente sin errores.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  </div>
</template>
