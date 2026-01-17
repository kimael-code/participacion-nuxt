# Task: Sistema de Seguimiento de Participación de Trabajadores

## Fase 0: Decisiones Técnicas

- [x] Confirmar stack de base de datos (Turso - SQLite Edge)
- [x] Confirmar estrategia de tiempo real (SSE - Server-Sent Events)
- [x] Confirmar librería de PDF (jsPDF + jspdf-autotable)
- [x] Confirmar librería de gráficas (Apache ECharts)
- [x] Confirmar proveedores OAuth (Google + GitHub)

## Fase 1: Configuración de Infraestructura

- [x] Instalar dependencias del proyecto
  - [x] `drizzle-orm` y `drizzle-kit`
  - [x] `@libsql/client` (cliente Turso)
  - [x] `better-auth` y adaptadores
  - [x] `echarts` y `vue-echarts`
  - [x] `jspdf` y `jspdf-autotable`
  - [x] `papaparse` (para CSV)
- [x] Configurar Turso database
  - [x] Crear cuenta en Turso
  - [x] Crear base de datos de desarrollo
  - [x] Obtener URL y auth token
- [x] Configurar Drizzle ORM
  - [x] Crear `drizzle.config.ts`
  - [x] Crear `server/utils/db.ts`
- [x] Configurar better-auth
  - [x] Crear `server/auth.ts`
  - [x] Configurar OAuth providers (Google, GitHub)
- [x] Actualizar `nuxt.config.ts`
  - [x] Agregar runtime config
  - [x] Configurar módulos necesarios
- [x] Crear `.env.example` con variables requeridas

## Fase 2: Diseño de Base de Datos

- [x] Diseñar esquema de base de datos en `server/database/schema.ts`
  - [x] Tabla de usuarios (better-auth)
  - [x] Tablas RBAC: `roles`, `permissions`, `rolePermissions`
  - [x] Tabla de empresas (companies) - multi-tenancy
  - [x] Tabla de relación user-companies (many-to-many)
  - [x] Tabla de trabajadores (employees) con FK a company
  - [x] Tabla de unidades administrativas con FK a company
  - [x] Tabla de eventos con FK a company
  - [x] Tablas de catálogo geográfico (normalizadas)
    - [x] Tabla `states` (estados)
    - [x] Tabla `municipalities` (municipios) con FK a state
    - [x] Tabla `parishes` (parroquias) con FK a municipality
  - [x] Tabla de centros de votación
    - [x] Campos: name, address
    - [x] FK a parish (ubicación normalizada)
    - [x] Campos opcionales: latitude, longitude (para mapas)
  - [x] Tabla de participación
  - [x] Tabla de motivos de no participación
  - [x] Tabla de listados CSV emitidos
  - [x] Definir todas las relaciones multi-tenancy y geográficas
- [x] Generar migraciones con Drizzle
- [x] Crear script de seeds
  - [x] Datos de prueba (2-3 empresas)
  - [x] Catálogo completo de estados, municipios y parroquias

## Fase 3: Backend/API

- [x] Implementar API routes para catálogos geográficos (READ-ONLY)
  - [x] `GET /api/geographic/states`
  - [x] `GET /api/geographic/municipalities?stateId=`
  - [x] `GET /api/geographic/parishes?municipalityId=`
- [x] Implementar API routes para empresas (CRUD)
  - [x] `GET /api/companies` (empresas del usuario)
  - [x] `GET /api/companies/:id` (detalle)
  - [x] `POST /api/companies` (crear)
  - [x] `PUT /api/companies/:id` (actualizar)
  - [x] `DELETE /api/companies/:id` (eliminar)
- [x] Implementar API routes para empleados
  - [x] `GET /api/employees` (filtrado por empresa activa)
  - [x] `GET /api/employees/catalogs` (catálogos para formularios)
  - [x] `GET /api/employees/search` (búsqueda por cédula)
  - [x] `POST /api/employees` (crear)
  - [x] `PATCH /api/employees/:id` (actualizar)
  - [x] `DELETE /api/employees/:id` (eliminar)
  - [x] `POST /api/bulk-import` (importación CSV)
- [x] Implementar API routes para unidades administrativas (CRUD, por empresa)
- [x] Implementar API routes para eventos (CRUD, por empresa)
  - [x] `GET /api/events` (listar)
  - [x] `POST /api/events` (crear)
  - [x] `PATCH /api/events/:id` (actualizar)
  - [x] `DELETE /api/events/:id` (eliminar)
  - [x] `POST /api/events/activate` (activar evento)
  - [x] `POST /api/events/deactivate` (desactivar evento)
  - [x] `GET /api/events/active` (obtener evento activo)
- [x] Implementar API routes para centros de votación (CRUD)
  - [x] Incluir JOINs para obtener ubicación completa (state, municipality, parish)
- [x] Implementar API routes para participación
  - [x] `POST /api/participations` (registrar)
  - [x] `PUT /api/participations/:id` (actualizar)
  - [x] `DELETE /api/participations/:id` (eliminar)
  - [x] `GET /api/participations/reasons` (motivos)
  - [x] `GET /api/participations/recent` (recientes)
  - [x] Estadísticas integradas en dashboard
- [x] Implementar SSE endpoint para dashboard
  - [x] `GET /api/dashboard/stats` (Server-Sent Events)
- [x] Implementar generación de listados CSV
  - [x] `POST /api/listings/generate` (generar listado)
  - [x] `GET /api/listings/history` (historial)
- [x] Implementar middleware de autenticación
- [x] Implementar middleware de verificación de acceso a empresa
- [x] Implementar validaciones con Zod

## Fase 4: Sistema de Autenticación

- [x] Configurar páginas de autenticación
  - [x] Actualizar `/login` con botones OAuth
  - [x] Página `/register` funcional
  - [x] Configurar callbacks de OAuth
- [x] Crear cliente de autenticación `auth-client.ts`
- [x] Implementar middleware global de protección de rutas
- [x] Configurar redirecciones post-login
- [x] Sistema RBAC completo
  - [x] Composable `usePermissions.ts`
  - [x] Tablas de roles y permisos

## Fase 5: Gestión de Datos Maestros

- [x] Implementar contexto de empresa
  - [x] Crear composable `useCompanyContext.ts`
  - [x] Crear componente `CompanySwitcher.vue` (sidebar)
  - [x] Integrar selector en layout principal
- [x] Página de gestión de empresas (`/dashboard/companies`)
  - [x] Listado con tabla
  - [x] Formulario de creación/edición (CompanyDialog.vue)
  - [x] Upload de logo
  - [x] Validación RIF/NIT
- [x] Página de gestión de empleados (`/dashboard/employees`)
  - [x] Listado con tabla (filtrado por empresa activa)
  - [x] Búsqueda y filtros
  - [x] Formulario de creación/edición (EmployeeDialog.vue)
  - [x] Importación masiva CSV (página dedicada /dashboard/bulk-import)
  - [x] Validación de cédulas
- [x] Página de gestión de unidades administrativas (`/dashboard/units`)
  - [x] CRUD completo con UnitDialog.vue
- [x] Página de gestión de eventos (`/dashboard/events`)
  - [x] CRUD completo con EventDialog.vue
  - [x] Activación/desactivación de eventos
- [x] Página de gestión de centros de votación (`/dashboard/locations`)
  - [x] CRUD completo con LocationDialog.vue
  - [x] Integración con catálogos geográficos

## Fase 6: Sistema de Registro de Participación

- [x] Crear página `/dashboard/participation/register`
- [x] Implementar composable `useEmployeeSearch.ts`
  - [x] Input de cédula con debounce
  - [x] Búsqueda en tiempo real
  - [x] Mostrar resultados instantáneos
- [x] Implementar composable `useParticipationRegistration.ts`
  - [x] Botón "Participó"
  - [x] Botón "No Participó" con modal de motivos
  - [x] Confirmaciones visuales
- [x] Implementar historial reciente de participaciones

## Fase 7: Dashboard en Tiempo Real

- [x] Crear página `/dashboard`
- [x] Implementar composable `useDashboardStats.ts`
  - [x] Conexión SSE al endpoint
  - [x] Manejo de eventos
  - [x] Reconexión automática
- [x] Implementar stats cards integradas
  - [x] Indicadores numéricos
  - [x] Actualizaciones en tiempo real
- [x] Implementar gráficas con Apache ECharts
  - [x] `ParticipationChart.vue` (donut/pie chart)
  - [x] `UnitChart.vue` (bar chart)
  - [x] Plugin `echarts.ts` configurado
  - [x] Animaciones fluidas
- [/] Implementar selector de evento (mejorar)
- [x] Implementar tabla de unidades con % participación
- [x] Agregar indicador de conexión SSE activa

## Fase 8: Sistema de Listados CSV

- [x] Crear página `/dashboard/listings`
- [x] Implementar interfaz de generación
  - [x] Selector de evento
  - [x] Botón de generación
  - [x] Historial de listados
- [/] Implementar lógica de generación incremental
  - [/] Solo empleados nuevos desde último listado
  - [/] Formato CSV con cédulas
- [x] Crear API endpoints
  - [x] `POST /api/listings/generate`
  - [x] `GET /api/listings/history`
- [ ] Implementar descarga automática
- [/] Registrar metadata de listados emitidos

## Fase 9: Sistema de Reportes PDF

- [x] Crear página `/dashboard/reports`
- [/] Implementar interfaz de filtros
  - [x] Evento
  - [/] Unidad administrativa
  - [/] Listado emitido
  - [/] Estatus de participación
- [x] Crear composable `usePDFGenerator.ts`
  - [x] Integración con jsPDF
  - [/] Template de reporte
  - [/] Generación de tablas con autotable
- [x] Crear API endpoints
  - [x] `GET /api/reports`
  - [x] `GET /api/reports/export`
- [ ] Implementar preview de datos
- [/] Implementar generación y descarga de PDF en cliente

## Fase 10: Mejoras de UX/UI

- [ ] Actualizar menú de navegación en `menus.ts`
- [ ] Crear componente `LoadingState.vue`
- [ ] Crear componente `ErrorState.vue`
- [ ] Implementar notificaciones toast
- [ ] Optimizar diseño responsive
- [ ] Agregar confirmaciones para acciones críticas
- [ ] Implementar breadcrumbs de navegación
- [ ] Agregar shortcuts de teclado

## Fase 11: Testing y Validación

- [ ] Probar flujo completo de autenticación OAuth
- [ ] Probar CRUD de empleados
- [ ] Probar importación masiva CSV
- [ ] Probar registro de participación
- [ ] Validar conexión SSE en dashboard
- [ ] Validar actualización en tiempo real
- [ ] Validar generación de listados CSV
- [ ] Validar generación de reportes PDF
- [ ] Testing en diferentes navegadores
- [ ] Testing responsive en dispositivos móviles

## Fase 12: Despliegue en Vercel

- [ ] Configurar proyecto en Vercel
- [ ] Configurar variables de entorno
  - [ ] Turso (producción)
  - [ ] Better Auth
  - [ ] OAuth credentials (con URLs de producción)
- [ ] Configurar base de datos Turso de producción
- [ ] Actualizar OAuth callbacks para dominio de producción
- [ ] Realizar despliegue inicial
- [ ] Validar funcionamiento en producción
  - [ ] Autenticación OAuth
  - [ ] Conexión SSE
  - [ ] Generación de PDF
  - [ ] Generación de CSV
- [ ] Actualizar README.md con documentación completa
