<script setup lang="ts">
import { ref, watch } from 'vue';
import { useEmployeeSearch } from '~/composables/useEmployeeSearch';
import { useParticipationRegistration } from '~/composables/useParticipationRegistration';
import { toast } from 'vue-sonner';

definePageMeta({
  layout: 'dashboard',
});

interface ActiveEvent {
  id: string;
  name: string;
  eventDate: string | Date;
}

interface Reason {
  id: string;
  name: string;
}

// fetch active events
const { data: events, pending: loadingEvents } =
  useFetch<ActiveEvent[]>('/api/events/active');
const selectedEventId = ref<string>('');

// watch for first event to select it automatically
watch(
  events,
  (newEvents) => {
    if (newEvents && newEvents.length > 0 && !selectedEventId.value) {
      selectedEventId.value = newEvents[0].id;
    }
  },
  { immediate: true },
);

// fetch non-participation reasons
const { data: reasons } = useFetch<Reason[]>('/api/participations/reasons');

const selectedReasonId = ref<string>('');
const registrationNotes = ref('');
const showReasonModal = ref(false);
const activeEmployeeId = ref<string | null>(null);

// employee search
const { searchQuery, isSearching, results } = useEmployeeSearch();

const { registerParticipation, isSubmitting } = useParticipationRegistration();

const handleRegister = async (employeeId: string, participated: boolean) => {
  if (!selectedEventId.value) {
    toast.error('Por favor, seleccione un evento');
    return;
  }

  if (!participated) {
    activeEmployeeId.value = employeeId;
    showReasonModal.value = true;
    return;
  }

  try {
    await registerParticipation({
      employeeId,
      eventId: selectedEventId.value,
      participated: true,
    });
  } catch (error) {
    // handled by composable
  }
};

const submitNoParticipation = async () => {
  if (
    !activeEmployeeId.value ||
    !selectedEventId.value ||
    !selectedReasonId.value
  ) {
    toast.error('Por favor, complete los campos requeridos');
    return;
  }

  try {
    await registerParticipation({
      employeeId: activeEmployeeId.value,
      eventId: selectedEventId.value,
      participated: false,
      nonParticipationReasonId: selectedReasonId.value,
      notes: registrationNotes.value,
    });
    showReasonModal.value = false;
    activeEmployeeId.value = null;
    selectedReasonId.value = '';
    registrationNotes.value = '';
  } catch (error) {
    // handled by composable
  }
};
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <div class="flex flex-col gap-2">
      <h1 class="text-3xl font-bold tracking-tight">
        Registro de Participación
      </h1>
      <p class="text-muted-foreground">
        Busque empleados y registre su participación en eventos activos.
      </p>
    </div>

    <!-- Configuration Section -->
    <Card>
      <CardHeader>
        <CardTitle>Configuración del Evento</CardTitle>
        <CardDescription
          >Seleccione el evento para el cual registrará
          participación.</CardDescription
        >
      </CardHeader>
      <CardContent>
        <div class="flex items-center gap-4">
          <div class="grid w-full max-w-sm items-center gap-1.5">
            <Label for="event">Evento Activo</Label>
            <Select v-model="selectedEventId" :disabled="loadingEvents">
              <SelectTrigger id="event">
                <SelectValue placeholder="Seleccione un evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="event in events || []"
                  :key="event.id"
                  :value="event.id"
                >
                  {{ event.name }} -
                  {{ new Date(event.eventDate).toLocaleDateString() }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Search Section -->
    <Card>
      <CardHeader>
        <CardTitle>Búsqueda de Empleados</CardTitle>
        <CardDescription
          >Use la cédula, nombre o correo para encontrar al
          empleado.</CardDescription
        >
      </CardHeader>
      <CardContent>
        <div class="relative w-full max-w-lg">
          <Input
            v-model="searchQuery"
            placeholder="Buscar por cédula, nombre..."
            class="pl-10"
          />
          <div
            class="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          >
            <Icon v-if="!isSearching" name="lucide:search" class="h-4 w-4" />
            <Icon v-else name="lucide:loader-2" class="h-4 w-4 animate-spin" />
          </div>
        </div>

        <!-- Results -->
        <div v-if="results.length > 0" class="mt-8 space-y-4">
          <div
            v-for="employee in results"
            :key="employee.id"
            class="flex items-center justify-between rounded-lg border p-4 transition-all hover:bg-accent/50"
          >
            <div class="flex flex-col">
              <span class="font-semibold"
                >{{ employee.firstName }} {{ employee.lastName }}</span
              >
              <span class="text-sm text-muted-foreground"
                >C.I: {{ employee.cedula }}</span
              >
              <span
                v-if="employee.administrativeUnit"
                class="text-xs text-muted-foreground italic"
              >
                {{ employee.administrativeUnit.name }}
              </span>
            </div>

            <div class="flex items-center gap-2">
              <Button
                :disabled="isSubmitting"
                variant="default"
                size="sm"
                class="bg-green-600 text-white hover:bg-green-700"
                @click="handleRegister(employee.id, true)"
              >
                <Icon name="lucide:check-circle" class="mr-2 h-4 w-4" />
                Participó
              </Button>
              <Button
                :disabled="isSubmitting"
                variant="destructive"
                size="sm"
                @click="handleRegister(employee.id, false)"
              >
                <Icon name="lucide:x-circle" class="mr-2 h-4 w-4" />
                No Participó
              </Button>
            </div>
          </div>
        </div>

        <div
          v-else-if="searchQuery.length >= 2 && !isSearching"
          class="mt-8 rounded-lg border border-dashed py-10 text-center text-muted-foreground"
        >
          No se encontraron empleados con "{{ searchQuery }}".
        </div>
      </CardContent>
    </Card>

    <!-- No Participation Modal -->
    <Dialog :open="showReasonModal" @update:open="showReasonModal = $event">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registro de No Participación</DialogTitle>
          <DialogDescription>Indique el motivo de la falta.</DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <Label for="reason">Motivo</Label>
            <Select v-model="selectedReasonId">
              <SelectTrigger id="reason">
                <SelectValue placeholder="Seleccione un motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="reason in reasons || []"
                  :key="reason.id"
                  :value="reason.id"
                >
                  {{ reason.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid gap-2">
            <Label for="notes">Notas (Opcional)</Label>
            <Textarea
              v-model="registrationNotes"
              id="notes"
              placeholder="Información adicional..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showReasonModal = false"
            >Cancelar</Button
          >
          <Button
            :disabled="isSubmitting"
            variant="destructive"
            @click="submitNoParticipation"
          >
            Registrar Falta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
