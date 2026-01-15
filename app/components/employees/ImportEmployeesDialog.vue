<script setup lang="ts">
import { ref } from 'vue';
import Papa from 'papaparse';
import { toast } from 'vue-sonner';
import { Upload, X, Check, AlertCircle, FileText } from 'lucide-vue-next';

interface Props {
  open: boolean;
}

defineProps<Props>();

const emit = defineEmits(['close', 'imported']);

const file = ref<File | null>(null);
const parsedData = ref<any[]>([]);
const isParsing = ref(false);
const isUploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    file.value = target.files[0];
    parseFile();
  }
};

const parseFile = () => {
  if (!file.value) return;

  isParsing.value = true;
  Papa.parse(file.value, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      parsedData.value = results.data
        .map((row: any) => ({
          cedula: row.cedula?.toString() || row.Cédula?.toString() || '',
          firstName: row.firstName || row.Nombre || '',
          lastName: row.lastName || row.Apellido || '',
          email: row.email || row.Correo || '',
          phone: row.phone || row.Teléfono || '',
        }))
        .filter((p) => p.cedula && p.firstName);

      isParsing.value = false;
    },
    error: () => {
      toast.error('Error al parsear el archivo CSV');
      isParsing.value = false;
    },
  });
};

const removeFile = () => {
  file.value = null;
  parsedData.value = [];
};

const handleImport = async () => {
  if (parsedData.value.length === 0) return;

  isUploading.value = true;
  try {
    await $fetch('/api/employees/batch', {
      method: 'POST',
      body: { items: parsedData.value },
    });

    toast.success(
      `${parsedData.value.length} empleados importados correctamente`,
    );
    emit('imported');
    emit('close');
  } catch (error) {
    toast.error('Error durante la importación masiva');
    console.error(error);
  } finally {
    isUploading.value = false;
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};
</script>

<template>
  <Dialog :open="open" @update:open="$emit('close')">
    <DialogContent class="flex max-h-[90vh] flex-col sm:max-w-[700px]">
      <DialogHeader>
        <DialogTitle>Importar Empleados desde CSV</DialogTitle>
        <DialogDescription>
          Suba un archivo CSV con las columnas: cedula, firstName, lastName,
          email, phone.
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto py-4">
        <!-- Dropzone -->
        <div
          v-if="!file"
          class="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-10 transition-colors hover:bg-accent/50"
          @click="triggerFileInput"
        >
          <div class="rounded-full bg-primary/10 p-4">
            <Upload class="h-8 w-8 text-primary" />
          </div>
          <div class="text-center">
            <p class="text-lg font-medium">
              Haga clic para subir o arrastre el archivo
            </p>
            <p class="text-sm text-muted-foreground">
              Solo archivos .csv (máximo 5MB)
            </p>
          </div>
          <input
            ref="fileInput"
            type="file"
            accept=".csv"
            class="hidden"
            @change="handleFileSelect"
          />
        </div>

        <!-- Preview -->
        <div v-else class="space-y-4">
          <div
            class="flex items-center justify-between rounded-lg bg-accent/50 p-3"
          >
            <div class="flex items-center gap-3">
              <FileText class="h-5 w-5 text-primary" />
              <div>
                <p class="text-sm font-medium">{{ file.name }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ (file.size / 1024).toFixed(1) }} KB
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" @click="removeFile">
              <X class="h-4 w-4" />
            </Button>
          </div>

          <div v-if="isParsing" class="flex flex-col items-center gap-3 py-10">
            <Icon
              name="lucide:loader-2"
              class="h-8 w-8 animate-spin text-primary"
            />
            <p class="text-sm text-muted-foreground">Procesando archivo...</p>
          </div>

          <div v-else-if="parsedData.length > 0">
            <div
              class="mb-2 flex items-center gap-2 text-sm font-medium text-green-600"
            >
              <Check class="h-4 w-4" />
              Se han detectado {{ parsedData.length }} registros válidos
            </div>

            <div
              class="max-h-[300px] overflow-hidden overflow-y-auto rounded-md border"
            >
              <Table>
                <TableHeader class="sticky top-0 bg-background shadow-sm">
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cédula</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow
                    v-for="(row, i) in parsedData.slice(0, 50)"
                    :key="i"
                  >
                    <TableCell
                      >{{ row.firstName }} {{ row.lastName }}</TableCell
                    >
                    <TableCell>{{ row.cedula }}</TableCell>
                    <TableCell class="text-xs">{{
                      row.email || '-'
                    }}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <div
                v-if="parsedData.length > 50"
                class="border-t bg-accent/30 p-2 text-center text-xs text-muted-foreground"
              >
                Mostrando los primeros 50 registros...
              </div>
            </div>
          </div>

          <div
            v-else
            class="flex flex-col items-center gap-3 py-10 text-destructive"
          >
            <AlertCircle class="h-8 w-8" />
            <p class="text-sm">No se encontraron datos válidos en el archivo</p>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="$emit('close')">Cancelar</Button>
        <Button
          :disabled="!parsedData.length || isUploading"
          @click="handleImport"
        >
          <Icon
            v-if="isUploading"
            name="lucide:loader-2"
            class="mr-2 h-4 w-4 animate-spin"
          />
          {{ isUploading ? 'Importando...' : 'Confirmar Importación' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
