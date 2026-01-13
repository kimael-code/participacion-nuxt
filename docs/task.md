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
- [ ] Configurar Turso database
  - [ ] Crear cuenta en Turso
  - [ ] Crear base de datos de desarrollo
  - [ ] Obtener URL y auth token
- [x] Configurar Drizzle ORM
  - [x] Crear `drizzle.config.ts`
  - [x] Crear `server/utils/db.ts`
- [ ] Configurar better-auth
  - [ ] Crear `server/auth.ts`
  - [ ] Configurar OAuth providers (Google, GitHub)
- [ ] Actualizar `nuxt.config.ts`
  - [ ] Agregar runtime config
  - [ ] Configurar módulos necesarios
- [x] Crear `.env.example` con variables requeridas

## Fase 2: Diseño de Base de Datos

- [/] Diseñar esquema de base de datos en `server/database/schema.ts`
  - [x] Tabla de usuarios (better-auth)
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
- [ ] Generar migraciones con Drizzle
- [ ] Crear script de seeds
  - [ ] Datos de prueba (2-3 empresas)
  - [ ] Catálogo completo de estados, municipios y parroquias

## Fase 3: Backend/API

- [ ] Implementar API routes para catálogos geográficos (READ-ONLY)
  - [ ] `GET /api/geographic/states`
  - [ ] `GET /api/geographic/municipalities?stateId=`
  - [ ] `GET /api/geographic/parishes?municipalityId=`
- [ ] Implementar API routes para empresas (CRUD)
  - [ ] `GET /api/companies` (empresas del usuario)
  - [ ] `GET /api/companies/:id` (detalle)
  - [ ] `POST /api/companies` (crear)
  - [ ] `PUT /api/companies/:id` (actualizar)
  - [ ] `DELETE /api/companies/:id` (eliminar)
- [ ] Implementar API routes para empleados
  - [ ] `GET /api/employees` (filtrado por empresa activa)
  - [ ] `GET /api/employees/:id` (detalle)
  - [ ] `GET /api/employees/search` (búsqueda por cédula)
  - [ ] `POST /api/employees` (crear)
  - [ ] `PUT /api/employees/:id` (actualizar)
  - [ ] `DELETE /api/employees/:id` (eliminar)
  - [ ] `POST /api/employees/import` (importación CSV)
- [ ] Implementar API routes para unidades administrativas (CRUD, por empresa)
- [ ] Implementar API routes para eventos (CRUD, por empresa)
- [ ] Implementar API routes para centros de votación (CRUD)
  - [ ] Incluir JOINs para obtener ubicación completa (state, municipality, parish)
- [ ] Implementar API routes para participación
  - [ ] `POST /api/participations` (registrar)
  - [ ] `PUT /api/participations/:id` (actualizar)
  - [ ] `GET /api/participations/stats` (estadísticas por empresa)
- [ ] Implementar SSE endpoint para dashboard
  - [ ] `GET /api/dashboard/stream` (Server-Sent Events, por empresa)
- [ ] Implementar generación de listados CSV
  - [ ] `POST /api/listings/generate`
- [ ] Implementar middleware de autenticación
- [ ] Implementar middleware de verificación de acceso a empresa
- [ ] Implementar validaciones con Zod

## Fase 4: Sistema de Autenticación

- [ ] Configurar páginas de autenticación
  - [ ] Actualizar `/login` con botones OAuth
  - [ ] Configurar callbacks de OAuth
- [ ] Crear composable `useAuth.ts`
- [ ] Implementar middleware global de protección de rutas
- [ ] Configurar redirecciones post-login

## Fase 5: Gestión de Datos Maestros

- [ ] Implementar contexto de empresa
  - [ ] Crear composable `useCompanyContext.ts`
  - [ ] Crear componente `CompanySwitcher.vue` (sidebar)
  - [ ] Integrar selector en layout principal
- [ ] Página de gestión de empresas (`/companies`)
  - [ ] Listado con tabla
  - [ ] Formulario de creación/edición
  - [ ] Upload de logo
  - [ ] Validación RIF/NIT
- [ ] Página de gestión de empleados (`/employees`)
  - [ ] Listado con tabla (filtrado por empresa activa)
  - [ ] Búsqueda y filtros
  - [ ] Formulario de creación/edición
  - [ ] Importación masiva CSV
  - [ ] Validación de cédulas
- [ ] Página de gestión de unidades administrativas
- [ ] Página de gestión de eventos
- [ ] Página de gestión de centros de votación

## Fase 6: Sistema de Registro de Participación

- [ ] Crear página `/participation/register`
- [ ] Implementar componente `ParticipationSearch.vue`
  - [ ] Input de cédula con debounce
  - [ ] Búsqueda en tiempo real
  - [ ] Mostrar resultados instantáneos
- [ ] Implementar componente `ParticipationActions.vue`
  - [ ] Botón "Participó"
  - [ ] Botón "No Participó" con modal de motivos
  - [ ] Confirmaciones visuales
- [ ] Implementar historial reciente de participaciones

## Fase 7: Dashboard en Tiempo Real

- [ ] Crear página `/dashboard`
- [ ] Implementar composable `useDashboardSSE.ts`
  - [ ] Conexión SSE al endpoint
  - [ ] Manejo de eventos
  - [ ] Reconexión automática
- [ ] Implementar componente `StatsCards.vue`
  - [ ] Indicadores numéricos
  - [ ] Actualizaciones en tiempo real
- [ ] Implementar gráficas con Apache ECharts
  - [ ] `ParticipationChart.vue` (donut/pie chart)
  - [ ] `UnitChart.vue` (bar chart)
  - [ ] Animaciones fluidas
- [ ] Implementar selector de evento
- [ ] Implementar tabla de unidades con % participación
- [ ] Agregar indicador de conexión SSE activa

## Fase 8: Sistema de Listados CSV

- [ ] Crear página `/listings`
- [ ] Implementar interfaz de generación
  - [ ] Selector de evento
  - [ ] Botón de generación
  - [ ] Historial de listados
- [ ] Implementar lógica de generación incremental
  - [ ] Solo empleados nuevos desde último listado
  - [ ] Formato CSV con cédulas
- [ ] Crear utilidad `server/utils/csv.ts`
- [ ] Implementar descarga automática
- [ ] Registrar metadata de listados emitidos

## Fase 9: Sistema de Reportes PDF

- [ ] Crear página `/reports`
- [ ] Implementar interfaz de filtros
  - [ ] Evento
  - [ ] Unidad administrativa
  - [ ] Listado emitido
  - [ ] Estatus de participación
- [ ] Crear composable `usePDFGenerator.ts`
  - [ ] Integración con jsPDF
  - [ ] Template de reporte
  - [ ] Generación de tablas con autotable
- [ ] Implementar preview de datos
- [ ] Implementar generación y descarga de PDF en cliente

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
