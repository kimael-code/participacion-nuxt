import Papa from 'papaparse';
import { toast } from 'vue-sonner';

export const useBulkImport = () => {
  const { selectedCompany } = useCompanyContext();
  const isLoading = ref(false);
  const csvData = ref<string | null>(null);
  const preview = ref<{
    columns: string[];
    rows: number;
    data: any[];
  } | null>(null);

  const results = ref<{
    created: {
      states: number;
      municipalities: number;
      parishes: number;
      locations: number;
      administrativeUnits: number;
      employees: number;
    };
    updated: {
      locations: number;
      employees: number;
    };
    errors: string[];
  } | null>(null);

  const handleFileUpload = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Reset states
    results.value = null;
    csvData.value = null;
    preview.value = null;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Por favor, sube un archivo CSV válido');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      csvData.value = content;

      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        preview: 5, // Solo parsear primeras 5 filas para preview
        complete: (parsed) => {
          preview.value = {
            columns: parsed.meta.fields || [],
            rows: 0, // No sabemos el total sin parsear todo, pero podemos estimar o dejarlo pendiente
            data: parsed.data,
          };

          // Para contar filas totales sin parsear todo (opcional, o parsear todo si es pequeño)
          // Por simplicidad, parseamos todo el string sin data para contar líneas
          const allRows =
            content.split('\n').filter((line) => line.trim().length > 0)
              .length - 1; // -1 header
          if (preview.value) {
            preview.value.rows = Math.max(0, allRows);
          }
        },
        error: (err: any) => {
          toast.error(`Error al leer CSV: ${err.message}`);
        },
      });
    };
    reader.readAsText(file);
  };

  const importData = async () => {
    if (!csvData.value || !selectedCompany.value) return;

    isLoading.value = true;
    results.value = null;

    try {
      const data = await $fetch('/api/bulk-import', {
        method: 'POST',
        body: {
          companyId: selectedCompany.value.id,
          csvData: csvData.value,
        },
      });

      results.value = data;
      toast.success('Importación completada');

      // Limpiar preview y data después de éxito
      csvData.value = null;
      preview.value = null;

      // Limpiar input file si es posible (necesitaríamos referencia al elemento)
    } catch (error: any) {
      console.error(error);
      toast.error(error.statusMessage || 'Error en la importación');
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    preview,
    results,
    handleFileUpload,
    importData,
    csvData, // expuesto por si se necesita validar disable
  };
};
