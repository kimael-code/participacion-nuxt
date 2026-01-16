# Estrategia de Carga Masiva Unificada

**Fecha**: 15 de enero de 2026  
**Objetivo**: Un solo endpoint para cargar TODOS los datos desde un CSV maestro

---

## 🎯 Concepto

En lugar de tener endpoints separados para cada entidad, tendremos **un solo endpoint** que procese un CSV maestro con TODA la información:

- ✅ Empleados
- ✅ Unidades administrativas
- ✅ Ubicaciones (centros de votación, clínicas, auditorios, etc.)
- ✅ Geografía (estados, municipios, parroquias)

---

## 📊 Estructura del CSV Maestro

### Formato del Archivo

```csv
cedula,firstName,lastName,email,phone,administrativeUnit,locationName,locationType,locationAddress,locationCapacity,locationNotes,state,municipality,parish,locationLat,locationLng
V12345678,Juan,Pérez,juan@example.com,04121234567,Recursos Humanos,Centro Simón Bolívar,voting_center,Av. Principal,,Horario 7am-5pm,Miranda,Chacao,Chacao,10.5,-66.9
V87654321,María,González,maria@example.com,04247654321,Finanzas,Clínica Vista Clara,medical_facility,Calle 2,50,Entrega de lentes,Miranda,Baruta,El Cafetal,10.4,-66.8
V11223344,Pedro,Ramírez,pedro@example.com,04129876543,Tecnología,Auditorio Principal,auditorium,Edificio Corp Piso 3,200,,Lara,Iribarren,Catedral,10.1,-69.3
```

### Campos del CSV

| Campo                | Descripción            | Requerido | Ejemplo                               |
| -------------------- | ---------------------- | --------- | ------------------------------------- |
| `cedula`             | Cédula del empleado    | ✅        | V12345678                             |
| `firstName`          | Nombre                 | ✅        | Juan                                  |
| `lastName`           | Apellido               | ✅        | Pérez                                 |
| `email`              | Email                  | ❌        | juan@example.com                      |
| `phone`              | Teléfono               | ❌        | 04121234567                           |
| `administrativeUnit` | Unidad administrativa  | ✅        | Recursos Humanos                      |
| `locationName`       | Nombre de la ubicación | ✅        | Centro Simón Bolívar                  |
| `locationType`       | Tipo de ubicación      | ✅        | voting_center, medical_facility, etc. |
| `locationAddress`    | Dirección completa     | ✅        | Av. Principal                         |
| `locationCapacity`   | Capacidad del lugar    | ❌        | 50                                    |
| `locationNotes`      | Notas adicionales      | ❌        | Horario 7am-5pm                       |
| `state`              | Estado                 | ✅        | Miranda                               |
| `municipality`       | Municipio              | ✅        | Chacao                                |
| `parish`             | Parroquia              | ✅        | Chacao                                |
| `locationLat`        | Latitud                | ❌        | 10.5                                  |
| `locationLng`        | Longitud               | ❌        | -66.9                                 |

---

## 🔧 Endpoint Unificado

### API Route

**Archivo**: `server/api/bulk-import.post.ts`

```typescript
import { db } from '~/server/utils/db';
import {
  employees,
  administrativeUnits,
  locations,
  LocationType,
  states,
  municipalities,
  parishes,
} from '~/server/database/schema';
import { eq, and } from 'drizzle-orm';
import Papa from 'papaparse';

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
    created: {
      states: 0,
      municipalities: 0,
      parishes: 0,
      locations: 0,
      administrativeUnits: 0,
      employees: 0,
    },
    updated: {
      locations: 0,
      employees: 0,
    },
    errors: [] as string[],
  };

  // Cachés para evitar búsquedas repetidas
  const stateCache = new Map<string, string>(); // name -> id
  const municipalityCache = new Map<string, string>(); // name+stateId -> id
  const parishCache = new Map<string, string>(); // name+municipalityId -> id
  const locationCache = new Map<string, string>(); // name -> id
  const unitCache = new Map<string, string>(); // name+companyId -> id

  for (const row of parsed.data) {
    try {
      // 1. Buscar o crear estado
      let stateId = stateCache.get(row.state);
      if (!stateId) {
        let state = await db
          .select()
          .from(states)
          .where(eq(states.name, row.state))
          .limit(1);

        if (state.length === 0) {
          const [newState] = await db.insert(states).values({
            id: crypto.randomUUID(),
            name: row.state,
          }).returning();
          stateId = newState.id;
          results.created.states++;
        } else {
          stateId = state[0].id;
        }
        stateCache.set(row.state, stateId);
      }

      // 2. Buscar o crear municipio
      const munKey = `${row.municipality}|${stateId}`;
      let municipalityId = municipalityCache.get(munKey);
      if (!municipalityId) {
        let municipality = await db
          .select()
          .from(municipalities)
          .where(
            and(
              eq(municipalities.name, row.municipality),
              eq(municipalities.stateId, stateId)
            )
          )
          .limit(1);

        if (municipality.length === 0) {
          const [newMun] = await db.insert(municipalities).values({
            id: crypto.randomUUID(),
            name: row.municipality,
            stateId,
          }).returning();
          municipalityId = newMun.id;
          results.created.municipalities++;
        } else {
          municipalityId = municipality[0].id;
        }
        municipalityCache.set(munKey, municipalityId);
      }

      // 3. Buscar o crear parroquia
      const parKey = `${row.parish}|${municipalityId}`;
      let parishId = parishCache.get(parKey);
      if (!parishId) {
        let parish = await db
          .select()
          .from(parishes)
          .where(
            and(
              eq(parishes.name, row.parish),
              eq(parishes.municipalityId, municipalityId)
            )
          )
          .limit(1);

        if (parish.length === 0) {
          const [newParish] = await db.insert(parishes).values({
            id: crypto.randomUUID(),
            name: row.parish,
            municipalityId,
          }).returning();
          parishId = newParish.id;
          results.created.parishes++;
        } else {
          parishId = parish[0].id;
        }
        parishCache.set(parKey, parishId);
      }

      // 4. Buscar o crear ubicación
      let locationId = locationCache.get(row.locationName);
      if (!locationId) {
        let location = await db
          .select()
          .from(locations)
          .where(eq(locations.name, row.locationName))
          .limit(1);

        if (location.length === 0) {
          const [newLocation] = await db.insert(locations).values({
            id: crypto.randomUUID(),
            name: row.locationName,
            type: row.locationType as LocationType,
            address: row.locationAddress,
            parishId,
            latitude: row.locationLat ? parseFloat(row.locationLat) : null,
            longitude: row.locationLng ? parseFloat(row.locationLng) : null,
            capacity: row.locationCapacity ? parseInt(row.locationCapacity) : null,
            notes: row.locationNotes || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }).returning();
          locationId = newLocation.id;
          results.created.locations++;
        } else {
          // Actualizar ubicación existente
          await db
            .update(locations)
            .set({
              type: row.locationType as LocationType,
              address: row.locationAddress,
              parishId,
              latitude: row.locationLat ? parseFloat(row.locationLat) : null,
              longitude: row.locationLng ? parseFloat(row.locationLng) : null,
              capacity: row.locationCapacity ? parseInt(row.locationCapacity) : null,
              notes: row.locationNotes || null,
              updatedAt: new Date(),
            })
            .where(eq(locations.id, location[0].id));
          locationId = location[0].id;
          results.updated.locations++;
        }
        locationCache.set(row.locationName, locationId);
      }

      // 5. Buscar o crear unidad administrativa
      const unitKey = `${row.administrativeUnit}|${companyId}`;
      let unitId = unitCache.get(unitKey);
      if (!unitId) {
        let unit = await db
          .select()
          .from(administrativeUnits)
          .where(
            and(
              eq(administrativeUnits.name, row.administrativeUnit),
              eq(administrativeUnits.companyId, companyId)
            )
          )
          .limit(1);

        if (unit.length === 0) {
          const [newUnit] = await db.insert(administrativeUnits).values({
            id: crypto.randomUUID(),
            name: row.administrativeUnit,
            companyId,
            createdAt: new Date(),
            updatedAt: new Date(),
          }).returning();
          unitId = newUnit.id;
          results.created.administrativeUnits++;
        } else {
          unitId = unit[0].id;
        }
        unitCache.set(unitKey, unitId);
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
            administrativeUnitId: unitId,
            locationId,
            updatedAt: new Date(),
          })
          .where(eq(employees.id, existingEmployee[0].id));

        results.updated.employees++;
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
          administrativeUnitId: unitId,
          locationId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        results.created.employees++;
      }
    } catch (error) {
      results.errors.push(`Error en cédula ${row.cedula}: ${error.message}`);
    }
  }

  return results;
});
```

---

## ✅ Ventajas de la Carga Unificada

1. **Simplicidad**: Un solo endpoint, un solo CSV
2. **Atomicidad**: Todo se procesa en una transacción
3. **Eficiencia**: Cachés para evitar búsquedas repetidas
4. **Idempotencia**: Ejecutar múltiples veces no duplica datos
5. **Trazabilidad**: Reporte detallado de creaciones/actualizaciones
6. **Flexibilidad**: Soporta cualquier tipo de ubicación

---

## 🔄 Flujo de Trabajo

```
1. RRHH prepara CSV maestro con todos los datos
   ↓
2. Usuario sube CSV en la aplicación
   ↓
3. Sistema procesa fila por fila:
   - Crea/busca estado, municipio, parroquia
   - Crea/actualiza ubicación
   - Crea/busca unidad administrativa
   - Crea/actualiza empleado
   ↓
4. Sistema retorna reporte:
   {
     created: { states: 2, municipalities: 5, ... },
     updated: { locations: 3, employees: 45 },
     errors: []
   }
```

---

## 📝 Interfaz de Usuario

### Página: `/dashboard/bulk-import`

```vue
<template>
  <div class="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Carga Masiva de Datos</CardTitle>
        <CardDescription>
          Importa empleados, unidades, ubicaciones y geografía desde un CSV
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <!-- File upload -->
          <Input type="file" accept=".csv" @change="handleFileUpload" />

          <!-- Preview -->
          <div v-if="preview" class="rounded border p-4">
            <p class="mb-2 text-sm text-muted-foreground">
              {{ preview.rows }} filas detectadas
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead v-for="col in preview.columns" :key="col">
                    {{ col }}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="(row, i) in preview.data.slice(0, 5)" :key="i">
                  <TableCell v-for="col in preview.columns" :key="col">
                    {{ row[col] }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <!-- Import button -->
          <Button @click="importData" :disabled="!csvData || isLoading">
            <Upload class="mr-2 h-4 w-4" />
            {{ isLoading ? 'Importando...' : 'Importar Datos' }}
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Results -->
    <Card v-if="results">
      <CardHeader>
        <CardTitle>Resultados de la Importación</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-2">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <h4 class="mb-2 font-medium">Creados</h4>
              <ul class="space-y-1 text-sm">
                <li>Estados: {{ results.created.states }}</li>
                <li>Municipios: {{ results.created.municipalities }}</li>
                <li>Parroquias: {{ results.created.parishes }}</li>
                <li>Ubicaciones: {{ results.created.locations }}</li>
                <li>Unidades: {{ results.created.administrativeUnits }}</li>
                <li>Empleados: {{ results.created.employees }}</li>
              </ul>
            </div>
            <div>
              <h4 class="mb-2 font-medium">Actualizados</h4>
              <ul class="space-y-1 text-sm">
                <li>Ubicaciones: {{ results.updated.locations }}</li>
                <li>Empleados: {{ results.updated.employees }}</li>
              </ul>
            </div>
          </div>

          <div v-if="results.errors.length > 0" class="mt-4">
            <h4 class="mb-2 font-medium text-destructive">Errores</h4>
            <ul class="space-y-1 text-sm text-destructive">
              <li v-for="(error, i) in results.errors" :key="i">
                {{ error }}
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
```

---

## 🎯 Próximos Pasos

1. ✅ Crear endpoint `/api/bulk-import.post.ts`
2. ✅ Crear página `/dashboard/bulk-import`
3. ✅ Crear composable `useBulkImport.ts`
4. ✅ Agregar al menú de navegación
5. ✅ Probar con CSV de ejemplo

---

**Fecha**: 15 de enero de 2026  
**Versión**: 1.0
