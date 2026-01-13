# Plan de Implementación: Sistema de Seguimiento de Participación

Sistema web para el seguimiento y análisis en tiempo real de la participación de trabajadores en eventos (votaciones, elecciones, etc.) organizados por unidades administrativas de una empresa.

## User Review Required

> [!IMPORTANT] > **Decisiones de Arquitectura Clave**
>
> 1. **Base de Datos**: SQLite con Drizzle ORM
>
>    - Para producción en Vercel, usaremos **Turso** (SQLite edge database) que es compatible con Vercel y Drizzle
>    - Alternativa: Vercel Postgres si prefieres PostgreSQL
>
> 2. **Tiempo Real**:
>
>    - Usaremos **polling** cada 5-10 segundos para actualizar el dashboard
>    - Alternativa: Server-Sent Events (SSE) si prefieres push real
>    - WebSockets no es viable en Vercel (serverless)
>
> 3. **Generación de PDF**:
>
>    - Librería recomendada: **jsPDF** o **pdfmake**
>    - ¿Prefieres alguna en específico?
>
> 4. **Librería de Gráficas**:
>
>    - Recomendación: **Chart.js** con vue-chartjs o **Apache ECharts**
>    - ¿Tienes preferencia?
>
> 5. **Autenticación con better-auth**:
>    - Facebook OAuth requiere app verificada en Facebook Developers
>    - ¿Ya tienes las credenciales OAuth configuradas para Google, GitHub y Facebook?

> [!WARNING] > **Consideraciones de Vercel**
>
> - Vercel es serverless, las funciones tienen timeout de 10s (plan hobby) o 60s (plan pro)
> - Para reportes PDF grandes, podríamos necesitar optimización o procesamiento en background
> - SQLite tradicional no funciona en Vercel, necesitamos Turso o alternativa

## Proposed Changes

### Fase 1: Infraestructura y Configuración

#### [NEW] [drizzle.config.ts](file:///home/maikel/Dev/Portfolio/participacion-nuxt/drizzle.config.ts)

Configuración de Drizzle ORM para migraciones y conexión a base de datos.

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./server/database/schema.ts",
  out: "./server/database/migrations",
  dialect: "sqlite",
  driver: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
```

#### [NEW] [server/database/schema.ts](file:///home/maikel/Dev/Portfolio/participacion-nuxt/server/database/schema.ts)

Esquema completo de base de datos con Drizzle ORM:

**Tablas principales:**

- `users`: Usuarios autenticados (better-auth)
- `employees`: Trabajadores de la empresa
- `administrativeUnits`: Unidades administrativas
- `events`: Eventos de participación
- `votingCenters`: Centros de votación con ubicación geográfica
- `participations`: Registro de participación de empleados
- `nonParticipationReasons`: Motivos de no participación
- `csvListings`: Listados CSV emitidos

**Relaciones:**

- Employee → AdministrativeUnit (many-to-one)
- Employee → VotingCenter (many-to-one, opcional)
- Participation → Employee, Event (many-to-one)
- Participation → CsvListing (many-to-one, nullable)

#### [NEW] [server/utils/db.ts](file:///home/maikel/Dev/Portfolio/participacion-nuxt/server/utils/db.ts)

Cliente de base de datos singleton para Drizzle + Turso.

#### [MODIFY] [nuxt.config.ts](file:///home/maikel/Dev/Portfolio/participacion-nuxt/nuxt.config.ts)

Agregar configuración para:

- Runtime config con variables de entorno
- Módulo de better-auth
- Configuración de Nitro para Vercel

---

### Fase 2: Sistema de Autenticación

#### [NEW] [server/auth.ts](file:///home/maikel/Dev/Portfolio/participacion-nuxt/server/auth.ts)

Configuración de better-auth con proveedores OAuth:

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    },
  },
});
```

#### [NEW] [server/middleware/auth.ts](file:///home/maikel/Dev/Portfolio/participacion-nuxt/server/middleware/auth.ts)

Middleware para proteger rutas API.

#### [MODIFY] [app/pages/(auth)/login.vue](<file:///home/maikel/Dev/Portfolio/participacion-nuxt/app/pages/(auth)/login.vue>)

Actualizar página de login para usar better-auth con botones de OAuth.

#### [NEW] [app/composables/useAuth.ts](file:///home/maikel/Dev/Portfolio/participacion-nuxt/app/composables/useAuth.ts)

Composable para gestión de autenticación en el cliente.

---

### Fase 3: API Backend

#### [NEW] [server/api/employees/](file:///home/maikel/Dev/Portfolio/participacion-nuxt/server/api/employees/)

**CRUD de Empleados:**

- `GET /api/employees` - Listar con paginación, búsqueda y filtros
- `GET /api/employees/:id` - Obtener por ID
- `GET /api/employees/search` - Búsqueda por cédula
- `POST /api/employees` - Crear empleado
- `PUT /api/employees/:id` - Actualizar empleado
- `DELETE /api/employees/:id` - Eliminar empleado
- `POST /api/employees/import` - Importación masiva CSV

#### [NEW] [server/api/administrative-units/](file:///home/maikel/Dev/Portfolio/participacion-nuxt/server/api/administrative-units/)

CRUD de unidades administrativas.

#### [NEW] [server/api/events/](file:///home/maikel/Dev/Portfolio/participacion-nuxt/server/api/events/)

CRUD de eventos.

#### [NEW] [server/api/voting-centers/](file:///home/maikel/Dev/Portfolio/participacion-nuxt/server/api/voting-centers/)

CRUD de centros de votación.

#### [NEW] [server/api/participations/](file:///home/maikel/Dev/Portfolio/participacion-nuxt/server/api/participations/)

**Gestión de Participación:**

- `POST /api/participations` - Registrar participación
- `PUT /api/participations/:id` - Actualizar participación
- `GET /api/participations/stats` - Estadísticas para dashboard

#### [NEW] [server/api/listings/generate.post.ts](file:///home/maikel/Dev/Portfolio/participacion-nuxt/server/api/listings/generate.post.ts)

Generar listado CSV con empleados que participaron desde el último listado.

#### [NEW] [server/api/reports/generate.post.ts](file:///home/maikel/Dev/Portfolio/participacion-nuxt/server/api/reports/generate.post.ts)

Generar reporte PDF con filtros.

---

### Fase 4: Gestión de Datos Maestros

#### [NEW] [app/pages/employees/index.vue](file:///home/maikel/Dev/Portfolio/participacion-nuxt/app/pages/employees/index.vue)

Página de gestión de empleados:

- Tabla con paginación
- Búsqueda por cédula, nombre
- Filtros por unidad administrativa
- Botones de acción (crear, editar, eliminar)
- Importación masiva

#### [NEW] [app/pages/employees/[id].vue](file:///home/maikel/Dev/Portfolio/participacion-nuxt/app/pages/employees/[id].vue)

Formulario de creación/edición de empleado.

#### [NEW] [app/pages/administrative-units/index.vue](file:///home/maikel/Dev/Portfolio/participacion-nuxt/app/pages/administrative-units/index.vue)

Gestión de unidades administrativas.

#### [NEW] [app/pages/events/index.vue](file:///home/maikel/Dev/Portfolio/participacion-nuxt/app/pages/events/index.vue)

Gestión de eventos.

#### [NEW] [app/pages/voting-centers/index.vue](file:///home/maikel/Dev/Portfolio/participacion-nuxt/app/pages/voting-centers/index.vue)

Gestión de centros de votación.

---

### Fase 5: Sistema de Registro de Participación

#### [NEW] [app/pages/participation/register.vue](file:///home/maikel/Dev/Portfolio/participacion-nuxt/app/pages/participation/register.vue)

Interfaz principal para registrar participación:

**Componentes:**

1. **Buscador de empleado** (input de cédula con autocompletado)
2. **Card de empleado** (muestra datos del empleado encontrado)
3. **Botones de acción**:
   - "Participó" (verde)
   - "No Participó" (rojo, abre modal con motivos)
4. **Historial reciente** (últimas participaciones registradas)

**Flujo:**

1. Usuario escribe cédula
2. Sistema busca empleado en tiempo real
3. Muestra datos del empleado
4. Usuario marca participación o no participación
5. Sistema registra y muestra confirmación
6. Input se limpia para siguiente búsqueda

#### [NEW] [app/components/ParticipationSearch.vue](file:///home/maikel/Dev/Portfolio/participacion-nuxt/app/components/ParticipationSearch.vue)

Componente de búsqueda optimizado con debounce.

#### [NEW] [app/components/ParticipationActions.vue](file:///home/maikel/Dev/Portfolio/participacion-nuxt/app/components/ParticipationActions.vue)

Componente de botones de acción con modal de motivos.

---

### Fase 6: Dashboard en Tiempo Real

#### [NEW] [app/pages/dashboard/index.vue](file:///home/maikel/Dev/Portfolio/participacion-nuxt/app/pages/dashboard/index.vue)

Dashboard principal con gráficas en tiempo real:

**Layout:**

```
┌─────────────────────────────────────────────┐
│  Selector de Evento: [Dropdown]             │
├─────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Participó│  │ Pendiente│  │No Particip│  │
│  │   245    │  │   156    │  │    23     │  │
│  └──────────┘  └──────────┘  └──────────┘  │
├─────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────┐ │
│  │ Gráfica General │  │ Por Unidad Admin │ │
│  │  (Donut Chart)  │  │  (Bar Chart)     │ │
│  │                 │  │                  │ │
│  └─────────────────┘  └──────────────────┘ │
├─────────────────────────────────────────────┤
│  Tabla de Unidades Administrativas          │
│  (con % de participación)                   │
└─────────────────────────────────────────────┘
```

**Actualización:**

- Polling cada 10 segundos
- Indicador visual de última actualización
- Animaciones suaves en cambios de datos

#### [NEW] [app/components/dashboard/StatsCards.vue](file:///home/maikel/Dev/Portfolio/participacion-nuxt/app/components/dashboard/StatsCards.vue)

Cards de estadísticas numéricas.

#### [NEW] [app/components/dashboard/ParticipationChart.vue](file:///home/maikel/Dev/Portfolio/participacion-nuxt/app/components/dashboard/ParticipationChart.vue)

Gráfica de participación general (donut).

#### [NEW] [app/components/dashboard/UnitChart.vue](file:///home/maikel/Dev/Portfolio/participacion-nuxt/app/components/dashboard/UnitChart.vue)

Gráfica por unidad administrativa (barras).

#### [NEW] [app/composables/useDashboardData.ts](file:///home/maikel/Dev/Portfolio/participacion-nuxt/app/composables/useDashboardData.ts)

Composable para gestión de datos del dashboard con polling.

---

### Fase 7: Sistema de Listados CSV

#### [NEW] [app/pages/listings/index.vue](file:///home/maikel/Dev/Portfolio/participacion-nuxt/app/pages/listings/index.vue)

Página de generación de listados CSV:

**Funcionalidades:**

- Selector de evento
- Botón "Generar Nuevo Listado"
- Tabla de historial de listados generados
- Descarga de listados anteriores

**Lógica de generación:**

1. Obtener último listado del evento
2. Consultar participaciones desde la fecha del último listado
3. Generar CSV solo con cédulas nuevas
4. Registrar metadata del listado (fecha, hora, cantidad)
5. Descargar automáticamente

#### [NEW] [server/utils/csv.ts](file:///home/maikel/Dev/Portfolio/participacion-nuxt/server/utils/csv.ts)

Utilidad para generar archivos CSV.

---

### Fase 8: Sistema de Reportes PDF

#### [NEW] [app/pages/reports/index.vue](file:///home/maikel/Dev/Portfolio/participacion-nuxt/app/pages/reports/index.vue)

Página de generación de reportes PDF:

**Filtros:**

- Evento
- Unidad administrativa (opcional)
- Listado emitido (opcional)
- Estatus de participación (todos, participó, no participó, pendiente)

**Preview:**

- Tabla con datos filtrados
- Contador de registros

**Generación:**

- Botón "Generar PDF"
- Loading state durante generación
- Descarga automática

#### [NEW] [server/utils/pdf.ts](file:///home/maikel/Dev/Portfolio/participacion-nuxt/server/utils/pdf.ts)

Utilidad para generar PDFs con jsPDF o pdfmake.

**Template del PDF:**

- Header: Logo, título del reporte, filtros aplicados
- Tabla: Cédula, Nombre, Unidad, Estatus, Fecha
- Footer: Total de registros, fecha/hora de generación

---

### Fase 9: Mejoras de UX/UI

#### [MODIFY] [app/constants/menus.ts](file:///home/maikel/Dev/Portfolio/participacion-nuxt/app/constants/menus.ts)

Actualizar menú de navegación con nuevas páginas:

- Dashboard
- Registro de Participación
- Empleados
- Unidades Administrativas
- Eventos
- Centros de Votación
- Listados CSV
- Reportes

#### [NEW] [app/components/LoadingState.vue](file:///home/maikel/Dev/Portfolio/participacion-nuxt/app/components/LoadingState.vue)

Componente de loading state reutilizable.

#### [NEW] [app/components/ErrorState.vue](file:///home/maikel/Dev/Portfolio/participacion-nuxt/app/components/ErrorState.vue)

Componente de error state reutilizable.

#### [NEW] [app/middleware/auth.global.ts](file:///home/maikel/Dev/Portfolio/participacion-nuxt/app/middleware/auth.global.ts)

Middleware global para protección de rutas.

---

### Fase 10: Configuración de Despliegue

#### [NEW] [vercel.json](file:///home/maikel/Dev/Portfolio/participacion-nuxt/vercel.json)

Configuración de Vercel para Nuxt 4.

#### [MODIFY] [package.json](file:///home/maikel/Dev/Portfolio/participacion-nuxt/package.json)

Agregar dependencias:

- `drizzle-orm`
- `drizzle-kit`
- `@libsql/client` (Turso)
- `better-auth`
- `chart.js` y `vue-chartjs`
- `jspdf` o `pdfmake`
- `papaparse` (para CSV)
- `zod` (ya existe)

#### [NEW] [.env.example](file:///home/maikel/Dev/Portfolio/participacion-nuxt/.env.example)

Template de variables de entorno:

```env
# Database
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

# OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
```

---

## Verification Plan

### Automated Tests

```bash
# Instalar dependencias
pnpm install

# Generar migraciones de base de datos
pnpm drizzle-kit generate

# Aplicar migraciones
pnpm drizzle-kit migrate

# Ejecutar seeds de datos de prueba
pnpm db:seed

# Iniciar servidor de desarrollo
pnpm dev
```

### Manual Verification

1. **Autenticación**:

   - Verificar login con Google
   - Verificar login con GitHub
   - Verificar login con Facebook (si está configurado)
   - Verificar logout

2. **Gestión de Datos**:

   - Crear empleados manualmente
   - Importar empleados desde CSV
   - Crear unidades administrativas
   - Crear eventos
   - Crear centros de votación

3. **Registro de Participación**:

   - Buscar empleado por cédula
   - Marcar como "Participó"
   - Marcar como "No Participó" con motivo
   - Verificar actualizaciones en dashboard

4. **Dashboard**:

   - Verificar actualización en tiempo real
   - Verificar gráficas
   - Verificar estadísticas por unidad

5. **Listados CSV**:

   - Generar primer listado
   - Registrar más participaciones
   - Generar segundo listado
   - Verificar que solo incluye nuevos participantes

6. **Reportes PDF**:

   - Generar reporte con todos los filtros
   - Verificar formato del PDF
   - Verificar datos correctos

7. **Despliegue en Vercel**:
   - Configurar proyecto en Vercel
   - Configurar variables de entorno
   - Desplegar
   - Verificar funcionamiento en producción
