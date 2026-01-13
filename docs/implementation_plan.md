# Plan de Implementación: Sistema de Seguimiento de Participación

Sistema web para el seguimiento y análisis en tiempo real de la participación de trabajadores en eventos (votaciones, elecciones, etc.) organizados por unidades administrativas de una empresa.

## User Review Required

> [!IMPORTANT] 
> **Decisiones de Arquitectura Confirmadas** ✅
>
> 1. **Base de Datos**: **Turso** (SQLite Edge Database)
>
>    - SQLite hosteado en el edge con excelente integración con Drizzle ORM
>    - Plan gratuito: 9GB storage, 500M row reads/mes
>    - Desarrollo local con SQLite, producción con Turso sin cambios de código
>    - Exportable/importable para portabilidad total
>
> 2. **Tiempo Real**: **Server-Sent Events (SSE)**
>
>    - Nuxt 4 tiene soporte nativo para SSE via `$fetch` con `responseType: 'stream'`
>    - Push real del servidor cuando hay cambios
>    - Más eficiente que polling para este caso de uso
>    - Compatible con Vercel serverless
>
> 3. **Generación de PDF**: **jsPDF + jspdf-autotable**
>
>    - Liviana y optimizada para Vercel serverless
>    - Generación en el cliente (no consume tiempo de función serverless)
>    - Plugin autotable perfecto para tablas de datos
>
> 4. **Librería de Gráficas**: **Apache ECharts** con **vue-echarts**
>
>    - Gráficas potentes y altamente customizables
>    - Excelente integración con Vue 3
>    - Animaciones fluidas
>
> 5. **Autenticación**: **better-auth** con **Google + GitHub OAuth**
>
>    - Inicio de sesión/registro automático con Google y GitHub
>    - Facebook OAuth se agregará posteriormente
>    - Integración directa con Drizzle ORM

> [!NOTE]
> **Stack Final del Proyecto**
>
> - **Frontend**: Nuxt 4 + Vue 3 + TailwindCSS 4 + Shadcn Vue
> - **Backend**: Nitro (serverless) + Drizzle ORM + Turso DB  
> - **Auth**: better-auth + OAuth (Google, GitHub)
> - **Tiempo Real**: Server-Sent Events (SSE)
> - **Visualización**: Apache ECharts  
> - **Reportes**: jsPDF
> - **Deploy**: Vercel (plan gratuito)

## Proposed Changes

### Fase 1: Infraestructura y Configuración

#### [NEW] [drizzle.config.ts](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/drizzle.config.ts)

Configuración de Drizzle ORM para migraciones y conexión a Turso.

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

#### [NEW] [server/database/schema.ts](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/server/database/schema.ts)

Esquema completo de base de datos con Drizzle ORM:

**Tablas principales:**

- `users`: Usuarios autenticados (better-auth)
- `companies`: **Empresas/Organizaciones** (multi-tenancy)
- `employees`: Trabajadores de las empresas
- `administrativeUnits`: Unidades administrativas por empresa
- `events`: Eventos de participación por empresa
- `participations`: Registro de participación de empleados
- `nonParticipationReasons`: Motivos de no participación
- `csvListings`: Listados CSV emitidos

**Tablas de catálogo geográfico (normalizadas):**

- `states`: Estados/regiones del país
- `municipalities`: Municipios por estado
- `parishes`: Parroquias por municipio
- `votingCenters`: Centros de votación

**Estructura normalizada de ubicación geográfica:**

```typescript
// Estados
states {
  id: text (PK)
  name: text
  code: text (opcional, ej: "MIR" para Miranda)
}

// Municipios
municipalities {
  id: text (PK)
  name: text
  stateId: text (FK -> states.id)
}

// Parroquias
parishes {
  id: text (PK)
  name: text
  municipalityId: text (FK -> municipalities.id)
}

// Centros de votación
votingCenters {
  id: text (PK)
  name: text
  address: text (dirección completa)
  parishId: text (FK -> parishes.id)
  latitude: real (opcional, para mapas)
  longitude: real (opcional, para mapas)
}
```

**Ventajas de la normalización:**
- ✅ Sin duplicación de datos geográficos
- ✅ Integridad referencial garantizada
- ✅ Fácil mantenimiento de catálogos
- ✅ Dropdowns/selects construidos desde las tablas
- ✅ Prevención de typos y inconsistencias

**Relaciones (Multi-Tenancy):**

- User → Companies (many-to-many, un usuario puede acceder a varias empresas)
- Company → Employees (one-to-many)
- Company → AdministrativeUnits (one-to-many)
- Company → Events (one-to-many)
- Employee → AdministrativeUnit (many-to-one)
- Employee → VotingCenter (many-to-one, opcional)
- VotingCenter → Parish (many-to-one)
- Parish → Municipality (many-to-one)
- Municipality → State (many-to-one)
- Participation → Employee, Event (many-to-one)
- Participation → CsvListing (many-to-one, nullable)

#### Arquitectura Multi-Empresa

El sistema implementará **multi-tenancy** permitiendo que múltiples empresas usen la aplicación:

**Selector de Empresa:**
- Ubicado en el **sidebar**, en la sección superior que muestra logo y nombre de empresa (componente de Shadcn Vue)
- Al hacer clic, muestra dropdown con lista de empresas a las que el usuario tiene acceso
- Al cambiar de empresa, toda la aplicación se actualiza para mostrar solo datos de esa empresa

**Contexto Global:**
```typescript
// app/composables/useCompanyContext.ts
export const useCompanyContext = () => {
  const selectedCompany = useState<Company>('selectedCompany')
  const userCompanies = useState<Company[]>('userCompanies')
  
  const switchCompany = (companyId: string) => {
    selectedCompany.value = userCompanies.value.find(c => c.id === companyId)
    // Recargar todos los datos con el nuevo contexto
  }
  
  return { selectedCompany, userCompanies, switchCompany }
}
```

**Filtrado de Datos:**
- Todas las consultas a la base de datos incluirán `WHERE company_id = :selectedCompanyId`
- Middleware de API verificará que el usuario tenga acceso a la empresa solicitada
- Seeds incluirán datos para 2-3 empresas de ejemplo

---

#### [NEW] [server/api/companies/](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/server/api/companies/)

**CRUD de Empresas:**

- `GET /api/companies` - Listar empresas del usuario autenticado
- `GET /api/companies/:id` - Obtener detalle de empresa
- `POST /api/companies` - Crear nueva empresa
- `PUT /api/companies/:id` - Actualizar empresa
- `DELETE /api/companies/:id` - Eliminar empresa

---

#### [NEW] [server/api/geographic/](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/server/api/geographic/)

**API de Catálogos Geográficos:**

- `GET /api/geographic/states` - Listar todos los estados
- `GET /api/geographic/municipalities` - Listar municipios (filtro opcional por estado)
- `GET /api/geographic/parishes` - Listar parroquias (filtro opcional por municipio)

Estos endpoints son **READ-ONLY** para usuarios normales. Los datos se cargan vía seeds.

---



Cliente de base de datos singleton para Drizzle + Turso.

```typescript
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client);
```

#### [MODIFY] [nuxt.config.ts](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/nuxt.config.ts)

Agregar configuración para:

- Runtime config con variables de entorno
- Configuración de Nitro para Vercel

#### [MODIFY] [package.json](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/package.json)

Agregar dependencias:

- `drizzle-orm`
- `drizzle-kit`
- `@libsql/client` (Turso)
- `better-auth`
- `echarts` y `vue-echarts`
- `jspdf` y `jspdf-autotable`
- `papaparse` (para CSV)

---

### Fase 2: Sistema de Autenticación

#### [NEW] [server/auth.ts](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/server/auth.ts)

Configuración de better-auth con Google y GitHub OAuth:

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./utils/db";

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
  },
});
```

#### [NEW] [server/middleware/auth.ts](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/server/middleware/auth.ts)

Middleware para proteger rutas API.

#### [MODIFY] [app/pages/(auth)/login.vue](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/app/pages/(auth)/login.vue)

Actualizar página de login para usar better-auth con botones de OAuth (Google y GitHub).

#### [NEW] [app/composables/useAuth.ts](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/app/composables/useAuth.ts)

Composable para gestión de autenticación en el cliente.

---

### Fase 3: API Backend

#### [NEW] [server/api/employees/](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/server/api/employees/)

**CRUD de Empleados:**

- `GET /api/employees` - Listar con paginación, búsqueda y filtros
- `GET /api/employees/:id` - Obtener por ID
- `GET /api/employees/search` - Búsqueda por cédula
- `POST /api/employees` - Crear empleado
- `PUT /api/employees/:id` - Actualizar empleado
- `DELETE /api/employees/:id` - Eliminar empleado
- `POST /api/employees/import` - Importación masiva CSV

#### [NEW] [server/api/administrative-units/](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/server/api/administrative-units/)

CRUD de unidades administrativas.

#### [NEW] [server/api/events/](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/server/api/events/)

CRUD de eventos.

#### [NEW] [server/api/voting-centers/](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/server/api/voting-centers/)

CRUD de centros de votación.

#### [NEW] [server/api/participations/](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/server/api/participations/)

**Gestión de Participación:**

- `POST /api/participations` - Registrar participación
- `PUT /api/participations/:id` - Actualizar participación
- `GET /api/participations/stats` - Estadísticas para dashboard

#### [NEW] [server/api/dashboard/stream.get.ts](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/server/api/dashboard/stream.get.ts)

**Endpoint SSE para Dashboard en Tiempo Real:**

```typescript
export default defineEventHandler(async (event) => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Enviar datos iniciales
      const data = await getDashboardStats();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      // Configurar intervalo para enviar actualizaciones
      const interval = setInterval(async () => {
        const updatedData = await getDashboardStats();
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(updatedData)}\n\n`)
        );
      }, 5000); // Cada 5 segundos

      // Limpiar al cerrar
      setTimeout(() => {
        clearInterval(interval);
        controller.close();
      }, 60000); // Cerrar después de 60s
    },
  });

  return sendStream(event, stream);
});
```

#### [NEW] [server/api/listings/generate.post.ts](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/server/api/listings/generate.post.ts)

Generar listado CSV con empleados que participaron desde el último listado.

#### [NEW] [server/api/reports/generate.post.ts](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/server/api/reports/generate.post.ts)

Generar reporte PDF con filtros.

---

### Fase 4: Gestión de Datos Maestros

#### [NEW] [app/pages/companies/index.vue](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/app/pages/companies/index.vue)

**Página de gestión de empresas:**

- Tabla con empresas del usuario
- Botones de acción (crear, editar, eliminar)
- Formulario para agregar logo, nombre, RIF/NIT
- Solo usuarios admin pueden crear empresas

#### [NEW] [app/components/CompanySwitcher.vue](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/app/components/CompanySwitcher.vue)

**Selector de empresa para el sidebar:**

- Muestra logo y nombre de empresa actual
- Dropdown con lista de empresas disponibles
- Al cambiar empresa, actualiza contexto global
- Diseño basado en componente de Shadcn Vue (Select/Dropdown)

#### [NEW] [app/composables/useCompanyContext.ts](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/app/composables/useCompanyContext.ts)

Composable para gestión del contexto de empresa seleccionada.

#### [NEW] [app/pages/employees/index.vue](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/app/pages/employees/index.vue)

Página de gestión de empleados:

- Tabla con paginación
- Búsqueda por cédula, nombre
- Filtros por unidad administrativa
- Botones de acción (crear, editar, eliminar)
- Importación masiva

#### [NEW] [app/pages/employees/[id].vue](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/app/pages/employees/[id].vue)

Formulario de creación/edición de empleado.

#### [NEW] [app/pages/administrative-units/index.vue](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/app/pages/administrative-units/index.vue)

Gestión de unidades administrativas.

#### [NEW] [app/pages/events/index.vue](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/app/pages/events/index.vue)

Gestión de eventos.

#### [NEW] [app/pages/voting-centers/index.vue](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/app/pages/voting-centers/index.vue)

Gestión de centros de votación.

---

### Fase 5: Sistema de Registro de Participación

#### [NEW] [app/pages/participation/register.vue](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/app/pages/participation/register.vue)

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

#### [NEW] [app/components/ParticipationSearch.vue](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/app/components/ParticipationSearch.vue)

Componente de búsqueda optimizado con debounce.

#### [NEW] [app/components/ParticipationActions.vue](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/app/components/ParticipationActions.vue)

Componente de botones de acción con modal de motivos.

---

### Fase 6: Dashboard en Tiempo Real con SSE

#### [NEW] [app/pages/dashboard/index.vue](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/app/pages/dashboard/index.vue)

Dashboard principal con gráficas en tiempo real usando SSE:

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

**Actualización vía SSE:**

- Conexión persistente al endpoint `/api/dashboard/stream`
- Actualizaciones push cuando hay cambios
- Indicador visual de conexión activa
- Animaciones suaves en cambios de datos

#### [NEW] [app/components/dashboard/StatsCards.vue](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/app/components/dashboard/StatsCards.vue)

Cards de estadísticas numéricas.

#### [NEW] [app/components/dashboard/ParticipationChart.vue](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/app/components/dashboard/ParticipationChart.vue)

Gráfica de participación general (donut) con Apache ECharts.

#### [NEW] [app/components/dashboard/UnitChart.vue](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/app/components/dashboard/UnitChart.vue)

Gráfica por unidad administrativa (barras) con Apache ECharts.

#### [NEW] [app/composables/useDashboardSSE.ts](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/app/composables/useDashboardSSE.ts)

Composable para gestión de conexión SSE al dashboard:

```typescript
export const useDashboardSSE = (eventId: Ref<string>) => {
  const stats = ref(null);
  const isConnected = ref(false);

  const connect = async () => {
    const response = await $fetch<ReadableStream>(
      `/api/dashboard/stream?eventId=${eventId.value}`,
      {
        method: "GET",
        responseType: "stream",
      }
    );

    const reader = response.pipeThrough(new TextDecoderStream()).getReader();
    isConnected.value = true;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      // Parsear data: {...}
      const data = value.match(/data: (.*)/)?.[1];
      if (data) {
        stats.value = JSON.parse(data);
      }
    }
  };

  return { stats, isConnected, connect };
};
```

---

### Fase 7: Sistema de Listados CSV

#### [NEW] [app/pages/listings/index.vue](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/app/pages/listings/index.vue)

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

#### [NEW] [server/utils/csv.ts](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/server/utils/csv.ts)

Utilidad para generar archivos CSV usando `papaparse`.

---

### Fase 8: Sistema de Reportes PDF

#### [NEW] [app/pages/reports/index.vue](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/app/pages/reports/index.vue)

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

#### [NEW] [app/composables/usePDFGenerator.ts](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/app/composables/usePDFGenerator.ts)

Composable para generar PDFs con jsPDF en el cliente:

```typescript
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const usePDFGenerator = () => {
  const generateReport = (data, filters) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(16);
    doc.text("Reporte de Participación", 14, 20);

    // Filtros aplicados
    doc.setFontSize(10);
    doc.text(`Evento: ${filters.event}`, 14, 30);

    // Tabla de datos
    autoTable(doc, {
      head: [["Cédula", "Nombre", "Unidad", "Estatus", "Fecha"]],
      body: data.map((row) => [
        row.cedula,
        row.nombre,
        row.unidad,
        row.estatus,
        row.fecha,
      ]),
      startY: 40,
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.text(
      `Total: ${data.length} registros | Generado: ${new Date().toLocaleString()}`,
      14,
      doc.internal.pageSize.height - 10
    );

    doc.save(`reporte-${filters.event}-${Date.now()}.pdf`);
  };

  return { generateReport };
};
```

---

### Fase 9: Mejoras de UX/UI

#### [MODIFY] [app/constants/menus.ts](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/app/constants/menus.ts)

Actualizar menú de navegación con nuevas páginas:

- Dashboard
- Registro de Participación
- Empleados
- Unidades Administrativas
- Eventos
- Centros de Votación
- Listados CSV
- Reportes

#### [NEW] [app/components/LoadingState.vue](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/app/components/LoadingState.vue)

Componente de loading state reutilizable.

#### [NEW] [app/components/ErrorState.vue](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/app/components/ErrorState.vue)

Componente de error state reutilizable.

#### [NEW] [app/middleware/auth.global.ts](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/app/middleware/auth.global.ts)

Middleware global para protección de rutas.

---

### Fase 10: Configuración de Despliegue

#### [NEW] [.env.example](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/.env.example)

Template de variables de entorno:

```env
# Database (Turso)
TURSO_DATABASE_URL=libsql://[nombre-db].turso.io
TURSO_AUTH_TOKEN=

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

# OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

#### [NEW] [README.md](file:///home/maikel/Dev/Portfolio/araguaney-nuxt/README.md)

Documentación completa del proyecto con:

- Descripción del sistema
- Stack tecnológico
- Instalación y configuración
- Guía de deployment en Vercel
- Configuración de Turso
- Configuración de OAuth

---

## Verification Plan

### Automated Tests

```bash
# 1. Instalar dependencias
pnpm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con credenciales

# 3. Crear base de datos en Turso
turso db create participacion-dev
turso db show participacion-dev
# Copiar URL y generar auth token

# 4. Generar migraciones de base de datos
pnpm drizzle-kit generate

# 5. Aplicar migraciones
pnpm drizzle-kit migrate

# 6. Ejecutar seeds de datos de prueba
pnpm db:seed

# 7. Iniciar servidor de desarrollo
pnpm dev
# Servidor disponible en http://localhost:3000
```

### Manual Verification

1. **Autenticación**:

   - Verificar login con Google OAuth
   - Verificar login con GitHub OAuth
   - Verificar logout
   - Verificar redirección a login en rutas protegidas

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
   - Verificar actualizaciones en dashboard vía SSE

4. **Dashboard en Tiempo Real**:

   - Verificar conexión SSE activa
   - Registrar participación y observar actualización automática
   - Verificar gráficas de Apache ECharts
   - Verificar estadísticas por unidad
   - Cambiar evento y verificar actualización

5. **Listados CSV**:

   - Generar primer listado
   - Registrar más participaciones
   - Generar segundo listado
   - Verificar que solo incluye nuevos participantes
   - Descargar y verificar formato CSV

6. **Reportes PDF**:

   - Aplicar filtros (evento, unidad, estatus)
   - Generar reporte PDF con jsPDF
   - Verificar formato del PDF
   - Verificar datos correctos en tabla
   - Verificar metadata (fecha, total de registros)

7. **Despliegue en Vercel**:
   - Crear proyecto en Vercel
   - Configurar variables de entorno en Vercel
   - Configurar base de datos Turso para producción
   - Configurar OAuth callbacks para dominio de producción
   - Desplegar aplicación
   - Verificar funcionamiento completo en producción
   - Verificar SSE funciona correctamente en Vercel
