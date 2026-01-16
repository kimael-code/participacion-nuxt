# Plan de Implementación: Selector de Empresa y Estrategia Multi-Evento

## Contexto

El sistema debe soportar:

1. **Multi-tenancy**: Múltiples empresas en una misma instancia
2. **Multi-evento**: Múltiples eventos por empresa (elecciones, jornadas médicas, charlas, etc.)
3. **Carga masiva CSV**: Importación de empleados, unidades administrativas, centros de votación, y geografía
4. **CRUD manual**: Edición individual de registros cuando sea necesario

---

## 🎯 Objetivos

### 1. Selector de Empresa en Sidebar

Permitir al usuario cambiar entre empresas a las que tiene acceso, actualizando todo el contexto de la aplicación.

### 2. Contexto Global de Empresa

Mantener la empresa seleccionada en el estado global y filtrar todos los datos por esta empresa.

### 3. Soporte Multi-Evento

Cada empresa puede crear y gestionar múltiples eventos, con un evento activo a la vez.

### 4. Estrategia de Carga de Datos

- **Carga masiva CSV**: Para alimentación inicial y actualizaciones bulk
- **CRUD manual**: Para correcciones y ajustes puntuales

---

## 📋 Componentes a Implementar

### 1. Composable: `useCompanyContext.ts`

**Ubicación**: `app/composables/useCompanyContext.ts`

**Responsabilidades**:

- Mantener empresa seleccionada en estado global
- Listar empresas del usuario autenticado
- Cambiar empresa activa
- Persistir selección en localStorage

**Implementación**:

```typescript
// app/composables/useCompanyContext.ts
import type { Company } from "~/server/database/schema";

export const useCompanyContext = () => {
  // Estado global de empresa seleccionada
  const selectedCompany = useState<Company | null>(
    "selectedCompany",
    () => null
  );

  // Lista de empresas del usuario
  const userCompanies = useState<Company[]>("userCompanies", () => []);

  // Loading state
  const isLoading = useState<boolean>("companiesLoading", () => false);

  /**
   * Cargar empresas del usuario autenticado
   */
  const fetchUserCompanies = async () => {
    isLoading.value = true;
    try {
      const { data } = await useFetch("/api/companies");
      if (data.value) {
        userCompanies.value = data.value;

        // Si no hay empresa seleccionada, seleccionar la primera
        if (!selectedCompany.value && userCompanies.value.length > 0) {
          await switchCompany(userCompanies.value[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Cambiar empresa activa
   */
  const switchCompany = async (companyId: string) => {
    const company = userCompanies.value.find((c) => c.id === companyId);
    if (!company) return;

    selectedCompany.value = company;

    // Persistir en localStorage
    if (process.client) {
      localStorage.setItem("selectedCompanyId", companyId);
    }

    // Recargar datos dependientes
    await refreshApp();
  };

  /**
   * Recargar datos de la aplicación
   */
  const refreshApp = async () => {
    // Recargar datos que dependen de la empresa
    await refreshNuxtData();
  };

  /**
   * Restaurar empresa desde localStorage
   */
  const restoreCompany = async () => {
    if (process.client) {
      const savedId = localStorage.getItem("selectedCompanyId");
      if (savedId && userCompanies.value.length > 0) {
        const company = userCompanies.value.find((c) => c.id === savedId);
        if (company) {
          selectedCompany.value = company;
        }
      }
    }
  };

  return {
    selectedCompany: readonly(selectedCompany),
    userCompanies: readonly(userCompanies),
    isLoading: readonly(isLoading),
    fetchUserCompanies,
    switchCompany,
    restoreCompany,
  };
};
```

---

### 2. Componente: `CompanySwitcher.vue`

**Ubicación**: `app/components/CompanySwitcher.vue`

**Diseño**: Dropdown en la parte superior del sidebar con logo y nombre de empresa

**Implementación**:

```vue
<script setup lang="ts">
import { Building2, ChevronsUpDown, Check } from "lucide-vue-next";

const { selectedCompany, userCompanies, switchCompany, isLoading } =
  useCompanyContext();

const isOpen = ref(false);

const handleSelect = async (companyId: string) => {
  await switchCompany(companyId);
  isOpen.value = false;
};
</script>

<template>
  <DropdownMenu v-model:open="isOpen">
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        class="w-full justify-between px-2 h-auto py-2"
        :disabled="isLoading"
      >
        <div class="flex items-center gap-2 min-w-0">
          <div
            v-if="selectedCompany?.logo"
            class="w-8 h-8 rounded-md overflow-hidden flex-shrink-0"
          >
            <img
              :src="selectedCompany.logo"
              :alt="selectedCompany.name"
              class="w-full h-full object-cover"
            />
          </div>
          <div
            v-else
            class="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0"
          >
            <Building2 class="w-4 h-4 text-muted-foreground" />
          </div>

          <div class="flex flex-col items-start min-w-0">
            <span class="text-sm font-medium truncate">
              {{ selectedCompany?.name || "Seleccionar empresa" }}
            </span>
            <span
              v-if="selectedCompany?.rif"
              class="text-xs text-muted-foreground"
            >
              {{ selectedCompany.rif }}
            </span>
          </div>
        </div>

        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="start" class="w-[280px]">
      <DropdownMenuLabel>Empresas</DropdownMenuLabel>
      <DropdownMenuSeparator />

      <DropdownMenuRadioGroup :model-value="selectedCompany?.id">
        <DropdownMenuRadioItem
          v-for="company in userCompanies"
          :key="company.id"
          :value="company.id"
          @click="handleSelect(company.id)"
        >
          <div class="flex items-center gap-2">
            <div
              v-if="company.logo"
              class="w-6 h-6 rounded overflow-hidden flex-shrink-0"
            >
              <img
                :src="company.logo"
                :alt="company.name"
                class="w-full h-full object-cover"
              />
            </div>
            <div
              v-else
              class="w-6 h-6 rounded bg-muted flex items-center justify-center flex-shrink-0"
            >
              <Building2 class="w-3 h-3 text-muted-foreground" />
            </div>

            <div class="flex flex-col">
              <span class="text-sm font-medium">{{ company.name }}</span>
              <span v-if="company.rif" class="text-xs text-muted-foreground">
                {{ company.rif }}
              </span>
            </div>
          </div>
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>

      <DropdownMenuSeparator />

      <DropdownMenuItem as-child>
        <NuxtLink to="/dashboard/companies" class="cursor-pointer">
          <Building2 class="mr-2 h-4 w-4" />
          <span>Gestionar empresas</span>
        </NuxtLink>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
```

---

### 3. Integración en Sidebar

**Archivo**: `app/components/layout/SidebarNavHeader.vue`

**Modificación**: Agregar `CompanySwitcher` en la parte superior

```vue
<template>
  <div class="flex flex-col gap-2 p-2">
    <!-- Company Switcher -->
    <CompanySwitcher />

    <!-- User info existente -->
    <div class="flex items-center gap-2 px-2 py-1">
      <!-- ... contenido existente ... -->
    </div>
  </div>
</template>
```

---

### 4. API Endpoint: Empresas del Usuario

**Archivo**: `server/api/companies/index.get.ts`

```typescript
import { db } from "~/server/utils/db";
import { companies, userCompanies } from "~/server/database/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  // Obtener empresas del usuario
  const userCompaniesData = await db
    .select({
      id: companies.id,
      name: companies.name,
      rif: companies.rif,
      logo: companies.logo,
      createdAt: companies.createdAt,
    })
    .from(companies)
    .innerJoin(userCompanies, eq(companies.id, userCompanies.companyId))
    .where(eq(userCompanies.userId, session.user.id));

  return userCompaniesData;
});
```

---

### 5. Middleware: Verificación de Acceso a Empresa

**Archivo**: `server/utils/company-access.ts`

```typescript
import { db } from "~/server/utils/db";
import { userCompanies } from "~/server/database/schema";
import { and, eq } from "drizzle-orm";
import { H3Event } from "h3";

/**
 * Verificar que el usuario tiene acceso a la empresa
 */
export async function verifyCompanyAccess(
  event: H3Event,
  companyId: string
): Promise<boolean> {
  const session = await requireUserSession(event);

  const access = await db
    .select()
    .from(userCompanies)
    .where(
      and(
        eq(userCompanies.userId, session.user.id),
        eq(userCompanies.companyId, companyId)
      )
    )
    .limit(1);

  return access.length > 0;
}

/**
 * Require company access (throw error if not authorized)
 */
export async function requireCompanyAccess(
  event: H3Event,
  companyId: string
): Promise<void> {
  const hasAccess = await verifyCompanyAccess(event, companyId);

  if (!hasAccess) {
    throw createError({
      statusCode: 403,
      message: "No tienes acceso a esta empresa",
    });
  }
}
```

---

## 📊 Estrategia de Carga Masiva CSV

### Estructura del CSV Maestro

El CSV debe contener TODOS los datos necesarios en un solo archivo:

```csv
cedula,firstName,lastName,email,phone,administrativeUnit,votingCenter,state,municipality,parish,centerAddress,centerLat,centerLng
V12345678,Juan,Pérez,juan@example.com,04121234567,Recursos Humanos,Centro Simón Bolívar,Miranda,Chacao,Chacao,Av. Principal,10.5,-66.9
V87654321,María,González,maria@example.com,04247654321,Finanzas,Escuela Nacional,Miranda,Baruta,El Cafetal,Calle 2,10.4,-66.8
```

### Endpoint de Importación Masiva

**Archivo**: `server/api/employees/batch.post.ts` (ya existe, mejorar)

**Lógica**:

1. Parsear CSV
2. Para cada fila:
   - Buscar o crear estado
   - Buscar o crear municipio
   - Buscar o crear parroquia
   - Buscar o crear centro de votación
   - Buscar o crear unidad administrativa
   - Crear o actualizar empleado

**Estrategia de Actualización**:

- **Upsert**: Si la cédula existe, actualizar; si no, crear
- **Idempotencia**: Ejecutar múltiples veces el mismo CSV no debe duplicar datos

### Mejoras al Endpoint Existente

```typescript
// server/api/employees/batch.post.ts
import { db } from "~/server/utils/db";
import {
  employees,
  administrativeUnits,
  votingCenters,
  states,
  municipalities,
  parishes,
} from "~/server/database/schema";
import { eq, and } from "drizzle-orm";
import Papa from "papaparse";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const body = await readBody(event);

  const { companyId, csvData } = body;

  // Verificar acceso a la empresa
  await requireCompanyAccess(event, companyId);

  // Parsear CSV
  const parsed = Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
  });

  const results = {
    created: 0,
    updated: 0,
    errors: [] as string[],
  };

  for (const row of parsed.data) {
    try {
      // 1. Buscar o crear estado
      let state = await db
        .select()
        .from(states)
        .where(eq(states.name, row.state))
        .limit(1);

      if (state.length === 0) {
        const [newState] = await db
          .insert(states)
          .values({
            id: crypto.randomUUID(),
            name: row.state,
          })
          .returning();
        state = [newState];
      }

      // 2. Buscar o crear municipio
      let municipality = await db
        .select()
        .from(municipalities)
        .where(
          and(
            eq(municipalities.name, row.municipality),
            eq(municipalities.stateId, state[0].id)
          )
        )
        .limit(1);

      if (municipality.length === 0) {
        const [newMunicipality] = await db
          .insert(municipalities)
          .values({
            id: crypto.randomUUID(),
            name: row.municipality,
            stateId: state[0].id,
          })
          .returning();
        municipality = [newMunicipality];
      }

      // 3. Buscar o crear parroquia
      let parish = await db
        .select()
        .from(parishes)
        .where(
          and(
            eq(parishes.name, row.parish),
            eq(parishes.municipalityId, municipality[0].id)
          )
        )
        .limit(1);

      if (parish.length === 0) {
        const [newParish] = await db
          .insert(parishes)
          .values({
            id: crypto.randomUUID(),
            name: row.parish,
            municipalityId: municipality[0].id,
          })
          .returning();
        parish = [newParish];
      }

      // 4. Buscar o crear centro de votación
      let votingCenter = await db
        .select()
        .from(votingCenters)
        .where(eq(votingCenters.name, row.votingCenter))
        .limit(1);

      if (votingCenter.length === 0) {
        const [newCenter] = await db
          .insert(votingCenters)
          .values({
            id: crypto.randomUUID(),
            name: row.votingCenter,
            address: row.centerAddress || "",
            parishId: parish[0].id,
            latitude: row.centerLat ? parseFloat(row.centerLat) : null,
            longitude: row.centerLng ? parseFloat(row.centerLng) : null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        votingCenter = [newCenter];
      }

      // 5. Buscar o crear unidad administrativa
      let adminUnit = await db
        .select()
        .from(administrativeUnits)
        .where(
          and(
            eq(administrativeUnits.name, row.administrativeUnit),
            eq(administrativeUnits.companyId, companyId)
          )
        )
        .limit(1);

      if (adminUnit.length === 0) {
        const [newUnit] = await db
          .insert(administrativeUnits)
          .values({
            id: crypto.randomUUID(),
            name: row.administrativeUnit,
            companyId,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        adminUnit = [newUnit];
      }

      // 6. Crear o actualizar empleado (UPSERT)
      const existingEmployee = await db
        .select()
        .from(employees)
        .where(eq(employees.cedula, row.cedula))
        .limit(1);

      if (existingEmployee.length > 0) {
        // Actualizar
        await db
          .update(employees)
          .set({
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email || null,
            phone: row.phone || null,
            administrativeUnitId: adminUnit[0].id,
            votingCenterId: votingCenter[0].id,
            updatedAt: new Date(),
          })
          .where(eq(employees.id, existingEmployee[0].id));

        results.updated++;
      } else {
        // Crear
        await db.insert(employees).values({
          id: crypto.randomUUID(),
          cedula: row.cedula,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email || null,
          phone: row.phone || null,
          companyId,
          administrativeUnitId: adminUnit[0].id,
          votingCenterId: votingCenter[0].id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        results.created++;
      }
    } catch (error) {
      results.errors.push(`Error en cédula ${row.cedula}: ${error.message}`);
    }
  }

  return results;
});
```

---

## 🎯 Soporte Multi-Evento

### Concepto

Cada empresa puede tener múltiples eventos:

- **Elecciones Municipales 2026**
- **Jornada Oftalmológica 2026**
- **Charla de Seguridad**

Solo un evento puede estar **activo** a la vez (`isActive = true`).

### Selector de Evento

Ya existe parcialmente en el dashboard. Mejorar:

```vue
<!-- app/pages/dashboard/index.vue -->
<script setup lang="ts">
const { selectedCompany } = useCompanyContext();
const { events, activeEvent, setActiveEvent } = useEvents();

// Cargar eventos de la empresa seleccionada
watchEffect(() => {
  if (selectedCompany.value) {
    events.value = await $fetch("/api/events", {
      query: { companyId: selectedCompany.value.id },
    });
  }
});
</script>

<template>
  <div class="space-y-4">
    <!-- Selector de Evento -->
    <Select v-model="activeEvent">
      <SelectTrigger>
        <SelectValue placeholder="Seleccionar evento" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="event in events" :key="event.id" :value="event.id">
          {{ event.name }} - {{ formatDate(event.eventDate) }}
        </SelectItem>
      </SelectContent>
    </Select>

    <!-- Dashboard stats filtrado por evento activo -->
    <DashboardStats :event-id="activeEvent" />
  </div>
</template>
```

---

## ✅ Checklist de Implementación

### Fase 1: Contexto de Empresa

- [ ] Crear `useCompanyContext.ts`
- [ ] Crear endpoint `GET /api/companies`
- [ ] Crear utilidad `requireCompanyAccess`
- [ ] Probar carga de empresas

### Fase 2: Selector de Empresa

- [ ] Crear `CompanySwitcher.vue`
- [ ] Integrar en `SidebarNavHeader.vue`
- [ ] Probar cambio de empresa
- [ ] Verificar persistencia en localStorage

### Fase 3: Filtrado por Empresa

- [ ] Actualizar todos los endpoints para filtrar por `companyId`
- [ ] Agregar middleware de verificación de acceso
- [ ] Probar aislamiento de datos entre empresas

### Fase 4: Carga Masiva CSV

- [ ] Mejorar endpoint `/api/employees/batch`
- [ ] Implementar lógica de upsert
- [ ] Crear/actualizar estados, municipios, parroquias
- [ ] Crear/actualizar centros de votación
- [ ] Crear/actualizar unidades administrativas
- [ ] Probar con CSV de ejemplo

### Fase 5: Gestión de Eventos

- [ ] Mejorar selector de eventos en dashboard
- [ ] Implementar CRUD completo de eventos
- [ ] Agregar toggle de evento activo
- [ ] Filtrar participaciones por evento

### Fase 6: Testing

- [ ] Probar multi-empresa
- [ ] Probar multi-evento
- [ ] Probar carga masiva CSV
- [ ] Probar CRUD manual

---

## 🚀 Próximos Pasos

1. **Implementar `useCompanyContext` y `CompanySwitcher`**
2. **Crear endpoint de empresas**
3. **Integrar en sidebar**
4. **Mejorar endpoint de carga masiva CSV**
5. **Completar gestión de eventos**
6. **Testing completo**

---

**Fecha**: 15 de enero de 2026  
**Versión**: 1.0
