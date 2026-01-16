# Refactorización: Centros de Votación → Ubicaciones Genéricas

**Fecha**: 15 de enero de 2026  
**Motivo**: Soportar eventos diversos (elecciones, jornadas médicas, charlas, capacitaciones, etc.)

---

## 🎯 Problema Identificado

La tabla `voting_centers` (centros de votación) era demasiado específica para un sistema que debe manejar eventos diversos:

- ❌ **Elecciones**: Centros de votación ✅
- ❌ **Jornada Oftalmológica**: ¿Centro de votación? ❌
- ❌ **Charla de Seguridad**: ¿Centro de votación? ❌

---

## ✅ Solución Implementada

### Tabla Genérica: `locations`

Renombrada de `voting_centers` a `locations` con soporte de tipos:

```typescript
export const locations = sqliteTable("locations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().$type<LocationType>(), // NUEVO
  address: text("address").notNull(),
  parishId: text("parish_id")
    .notNull()
    .references(() => parishes.id),
  latitude: real("latitude"),
  longitude: real("longitude"),
  capacity: integer("capacity"), // NUEVO
  notes: text("notes"), // NUEVO
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
```

### Enum de Tipos de Ubicaciones

```typescript
export const LocationType = {
  VOTING_CENTER: "voting_center", // Centro de votación
  MEDICAL_FACILITY: "medical_facility", // Centro médico/oftalmológico
  CONFERENCE_ROOM: "conference_room", // Sala de conferencias
  AUDITORIUM: "auditorium", // Auditorio
  TRAINING_CENTER: "training_center", // Centro de capacitación
  OFFICE: "office", // Oficina
  OTHER: "other", // Otro
} as const;
```

---

## 📝 Cambios Realizados

### 1. Schema (`server/database/schema.ts`)

- ✅ Renombrado `votingCenters` → `locations`
- ✅ Agregado campo `type` con enum
- ✅ Agregado campo `capacity` (capacidad del lugar)
- ✅ Agregado campo `notes` (notas adicionales)
- ✅ Actualizado `employees.votingCenterId` → `employees.locationId`
- ✅ Actualizado todas las relaciones

### 2. Seed (`server/database/seed.ts`)

- ✅ Actualizado import: `votingCenters` → `locations`
- ✅ Agregado import de `LocationType`
- ✅ Actualizado creación de ubicaciones con `type: LocationType.VOTING_CENTER`
- ✅ Actualizado empleados: `votingCenterId` → `locationId`

### 3. API Endpoints (6 archivos)

#### `server/api/employees/catalogs.get.ts`

- ✅ `db.query.votingCenters` → `db.query.locations`

#### `server/api/employees/search.get.ts`

- ✅ `votingCenter: { ... }` → `location: { ... }`

#### `server/api/employees/index.get.ts`

- ✅ `votingCenter: true` → `location: true`

#### `server/api/employees/batch.post.ts`

- ✅ `votingCenterId: item.votingCenterId` → `locationId: item.locationId`

#### `server/api/employees/index.post.ts`

- ✅ `votingCenterId: body.votingCenterId` → `locationId: body.locationId`

#### `server/api/employees/[id].patch.ts`

- ✅ `votingCenterId: body.votingCenterId` → `locationId: body.locationId`

### 4. Migración de Base de Datos

**Archivo**: `server/database/migrations/0000_narrow_outlaw_kid.sql`

```sql
-- Rename voting_centers table to locations
ALTER TABLE voting_centers RENAME TO locations;

-- Add new columns to locations table
ALTER TABLE locations ADD COLUMN type TEXT NOT NULL DEFAULT 'voting_center';
ALTER TABLE locations ADD COLUMN capacity INTEGER;
ALTER TABLE locations ADD COLUMN notes TEXT;

-- Rename voting_center_id to location_id in employees table
ALTER TABLE employees RENAME COLUMN voting_center_id TO location_id;
```

✅ **Migración aplicada exitosamente**

---

## 🎯 Casos de Uso Soportados

### 1. Elecciones Municipales

```javascript
{
  name: "Escuela Básica Ciudad de Barquisimeto",
  type: LocationType.VOTING_CENTER,
  address: "Av. Libertador",
  parishId: "...",
}
```

### 2. Jornada Oftalmológica

```javascript
{
  name: "Clínica Vista Clara",
  type: LocationType.MEDICAL_FACILITY,
  address: "Calle 5, El Cafetal",
  parishId: "...",
  capacity: 50,
  notes: "Horario: 8am-4pm, Entrega de lentes"
}
```

### 3. Charla de Seguridad

```javascript
{
  name: "Auditorio Principal",
  type: LocationType.AUDITORIUM,
  address: "Edificio Corporativo, Piso 3",
  parishId: "...",
  capacity: 200,
  notes: "Requiere confirmación previa"
}
```

### 4. Capacitación Técnica

```javascript
{
  name: "Centro de Capacitación TI",
  type: LocationType.TRAINING_CENTER,
  address: "Zona Industrial",
  parishId: "...",
  capacity: 30,
  notes: "Equipos de cómputo disponibles"
}
```

---

## 🔄 Estrategia de Migración

### Datos Existentes

- ✅ Todos los centros de votación existentes se mantienen
- ✅ Campo `type` se establece por defecto a `'voting_center'`
- ✅ Relaciones de empleados se preservan (renombrado de columna)

### Datos Nuevos

- ✅ Se pueden crear ubicaciones de cualquier tipo
- ✅ Campos `capacity` y `notes` son opcionales
- ✅ Cada ubicación sigue vinculada a una parroquia (geografía normalizada)

---

## 📊 Impacto en el Frontend

### Cambios Necesarios (Pendientes)

1. **Componentes de Empleados**:

   - Actualizar `EmployeeDialog.vue`: `votingCenterId` → `locationId`
   - Actualizar `ImportEmployeesDialog.vue`: CSV headers

2. **Formularios**:

   - Cambiar label "Centro de Votación" → "Ubicación"
   - Agregar selector de tipo de ubicación
   - Agregar campos opcionales: capacidad, notas

3. **Tablas**:

   - Mostrar tipo de ubicación con badge/icon
   - Mostrar capacidad si está disponible

4. **Filtros**:
   - Permitir filtrar por tipo de ubicación

---

## ✅ Ventajas de la Refactorización

1. **Flexibilidad**: Soporta cualquier tipo de evento
2. **Escalabilidad**: Fácil agregar nuevos tipos
3. **Claridad**: Nombres más descriptivos
4. **Metadata**: Campos adicionales (capacity, notes)
5. **Type-Safety**: Enum con TypeScript
6. **Retrocompatibilidad**: Datos existentes preservados

---

## 🚀 Próximos Pasos

1. ✅ **Schema actualizado**
2. ✅ **Migraciones aplicadas**
3. ✅ **Seed actualizado**
4. ✅ **APIs actualizadas**
5. ⏳ **Frontend pendiente**:
   - Actualizar componentes Vue
   - Actualizar formularios
   - Agregar selector de tipo
   - Actualizar importación CSV

---

## 📝 Notas Técnicas

### Decisión: ENUM vs Tabla Separada

**Elegimos ENUM** porque:

- ✅ Tipos de ubicaciones son universales
- ✅ No requieren metadata compleja
- ✅ No cambian frecuentemente
- ✅ Type-safety con TypeScript
- ✅ Sin JOINs adicionales

**Tabla separada sería necesaria si**:

- ❌ Cada empresa define sus propios tipos
- ❌ Tipos con iconos, colores, configuraciones
- ❌ Tipos creados dinámicamente por usuarios

### SQLite Limitations

- ⚠️ No se puede eliminar constraint UNIQUE en SQLite
- ✅ Mantenemos `UNIQUE` en `locations.name` por ahora
- ✅ Podemos manejarlo en código si es necesario

---

**Refactorización completada exitosamente** ✅

**Fecha**: 15 de enero de 2026  
**Versión**: 1.0
