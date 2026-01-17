# Mejoras Futuras - Sistema de Participación

Este documento consolida todas las mejoras futuras identificadas durante el desarrollo del sistema. Están organizadas por fase y prioridad.

## 📋 Índice

- [Fase 5: Gestión de Datos Maestros](#fase-5-gestión-de-datos-maestros)
- [Fase 7: Dashboard](#fase-7-dashboard)
- [Fase 8: Listados CSV](#fase-8-listados-csv)
- [Fase 9: Reportes PDF](#fase-9-reportes-pdf)
- [Fase 10: Mejoras UX/UI](#fase-10-mejoras-uxui)
- [Mejoras Generales](#mejoras-generales)

---

## Fase 5: Gestión de Datos Maestros

### Prioridad Alta

#### 1. Confirmaciones de Eliminación

**Descripción**: Agregar diálogos de confirmación antes de eliminar registros.

**Implementación**:

```vue
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Eliminar</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta acción no se puede deshacer. Se eliminará permanentemente el registro.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction @click="handleDelete">Eliminar</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Archivos afectados**:

- `app/pages/dashboard/companies/index.vue`
- `app/pages/dashboard/employees/index.vue`
- `app/pages/dashboard/units/index.vue`
- `app/pages/dashboard/events/index.vue`
- `app/pages/dashboard/locations/index.vue`

**Tiempo estimado**: 1-2 horas

---

#### 2. Loading States en Tablas

**Descripción**: Agregar skeletons mientras cargan los datos.

**Implementación**:

```vue
<TableRow v-if="loading">
  <TableCell v-for="i in 5" :key="i">
    <Skeleton class="h-4 w-full" />
  </TableCell>
</TableRow>
```

**Archivos afectados**: Todas las páginas con tablas

**Tiempo estimado**: 2-3 horas

---

### Prioridad Media

#### 3. Exportación de Empleados a CSV

**Descripción**: Permitir exportar la lista de empleados a CSV.

**Implementación**:

```typescript
const exportToCSV = () => {
  const headers = ['Cédula', 'Nombre', 'Apellido', 'Unidad', 'Email'];
  const rows = employees.value.map(e => [
    e.cedula,
    e.firstName,
    e.lastName,
    e.administrativeUnit?.name || '',
    e.email || '',
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `empleados_${Date.now()}.csv`;
  a.click();
};
```

**Tiempo estimado**: 30 minutos

---

#### 4. Filtros Avanzados

**Descripción**: Agregar más opciones de filtrado (por rango de fechas, múltiples criterios).

**Tiempo estimado**: 2-3 horas

---

#### 5. Bulk Actions

**Descripción**: Permitir seleccionar múltiples registros y realizar acciones en lote.

**Tiempo estimado**: 3-4 horas

---

### Prioridad Baja

#### 6. Preview de Logo

**Descripción**: Mostrar preview del logo antes de subirlo.

**Implementación**:

```vue
<div v-if="logoPreview" class="mt-2">
  <img :src="logoPreview" alt="Preview" class="h-20 w-20 object-cover rounded" />
</div>
```

**Tiempo estimado**: 30 minutos

---

#### 7. Validación de Formato de Imagen

**Descripción**: Validar que las imágenes sean PNG/JPG y no excedan cierto tamaño.

**Tiempo estimado**: 1 hora

---

#### 8. Compresión de Imágenes

**Descripción**: Comprimir imágenes grandes automáticamente.

**Tiempo estimado**: 2 horas

---

## Fase 7: Dashboard

### Prioridad Alta

#### 1. Mejorar Selector de Eventos

**Descripción**: Hacer el selector de eventos más prominente y fácil de usar.

**Implementación sugerida**:

- Mover a la parte superior del dashboard
- Agregar indicador visual del evento activo
- Mostrar fecha del evento
- Agregar botón de "Cambiar evento"

**Tiempo estimado**: 1-2 horas

---

### Prioridad Media

#### 2. Gráfico de Tendencias

**Descripción**: Agregar gráfico de línea mostrando participación a lo largo del tiempo.

**Tiempo estimado**: 2-3 horas

---

#### 3. Comparación de Eventos

**Descripción**: Permitir comparar estadísticas entre diferentes eventos.

**Tiempo estimado**: 3-4 horas

---

## Fase 8: Listados CSV

### Prioridad Media

#### 1. Formato CSV con Headers

**Descripción**: Opción para generar CSV con headers y más columnas.

**Formato actual**:

```csv
12345678,23456789,34567890
```

**Formato propuesto**:

```csv
Cedula,Nombre,Apellido,Unidad
12345678,Juan,Pérez,Administración
23456789,María,González,Ventas
```

**Implementación**:

```typescript
// En server/api/listings/generate.post.ts
const csvContent = [
  'Cedula,Nombre,Apellido,Unidad',
  ...cedulas.map(c => {
    const emp = employees.find(e => e.cedula === c);
    return `${c},${emp.firstName},${emp.lastName},${emp.unit}`;
  })
].join('\n');
```

**Tiempo estimado**: 1-2 horas

---

#### 2. Tabla de Tracking Dedicada

**Descripción**: Crear tabla `csv_listing_employees` para tracking más robusto.

**Schema**:

```typescript
export const csvListingEmployees = sqliteTable('csv_listing_employees', {
  id: text('id').primaryKey(),
  listingId: text('listing_id').references(() => csvListings.id),
  employeeId: text('employee_id').references(() => employees.id),
  cedula: text('cedula').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

**Beneficios**:

- Tracking más preciso de empleados incluidos
- Lógica incremental más robusta para no participación
- Auditoría completa

**Tiempo estimado**: 3-4 horas

---

#### 3. Exportar en Otros Formatos

**Descripción**: Permitir exportar en Excel, JSON, XML.

**Tiempo estimado**: 4-6 horas

---

## Fase 9: Reportes PDF

### Prioridad Baja

#### 1. Gráfico de Resumen en PDF

**Descripción**: Agregar pie chart con resumen de participación.

**Implementación**:

```typescript
// Usar jsPDF con canvas para gráficos
import { Chart } from 'chart.js';

// Crear canvas temporal
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// Generar gráfico
new Chart(ctx, {
  type: 'pie',
  data: {
    labels: ['Asistieron', 'No Asistieron', 'Pendientes'],
    datasets: [{
      data: [participated, notParticipated, pending],
      backgroundColor: ['#22c55e', '#ef4444', '#6b7280'],
    }],
  },
});

// Agregar al PDF
const chartImage = canvas.toDataURL('image/png');
doc.addImage(chartImage, 'PNG', 14, 100, 80, 80);
```

**Tiempo estimado**: 2-3 horas

---

#### 2. Fuentes Personalizadas

**Descripción**: Usar fuentes personalizadas en PDF para mejor apariencia.

**Tiempo estimado**: 1-2 horas

---

#### 3. Templates de PDF

**Descripción**: Permitir diferentes templates de PDF (formal, ejecutivo, detallado).

**Tiempo estimado**: 4-6 horas

---

## Fase 10: Mejoras UX/UI

### Prioridad Alta

#### 1. Responsive Design Completo

**Descripción**: Optimizar todas las páginas para móviles y tablets.

**Áreas críticas**:

- Tablas (convertir a cards en móvil)
- Diálogos (full screen en móvil)
- Navegación (hamburger menu)
- Dashboard (stack vertical en móvil)

**Tiempo estimado**: 1-2 semanas

---

#### 2. Dark Mode Completo

**Descripción**: Verificar y ajustar todos los componentes para dark mode.

**Tiempo estimado**: 3-5 días

---

#### 3. Animaciones y Transiciones

**Descripción**: Agregar micro-animaciones para mejorar UX.

**Ejemplos**:

- Fade in/out en modales
- Slide en navegación
- Skeleton loaders
- Progress indicators

**Tiempo estimado**: 1 semana

---

### Prioridad Media

#### 4. Toasts Mejorados

**Descripción**: Toasts más descriptivos con acciones (deshacer, ver detalles).

**Tiempo estimado**: 2-3 días

---

#### 5. Validación de Formularios Mejorada

**Descripción**: Mensajes de error más claros y validación en tiempo real.

**Tiempo estimado**: 3-5 días

---

#### 6. Accesibilidad (a11y)

**Descripción**: Mejorar accesibilidad para lectores de pantalla y navegación por teclado.

**Tiempo estimado**: 1 semana

---

## Mejoras Generales

### Prioridad Alta

#### 1. Testing Automatizado

**Descripción**: Implementar tests unitarios, de integración y E2E.

**Stack sugerido**:

- Vitest (unit tests)
- Playwright (E2E)
- Testing Library (component tests)

**Tiempo estimado**: 2-3 semanas

---

#### 2. Manejo de Errores Global

**Descripción**: Implementar error boundary y logging centralizado.

**Tiempo estimado**: 1 semana

---

#### 3. Optimización de Performance

**Descripción**:

- Lazy loading de componentes
- Virtual scrolling en tablas grandes
- Optimización de queries
- Caching estratégico

**Tiempo estimado**: 1-2 semanas

---

### Prioridad Media

#### 4. Internacionalización (i18n)

**Descripción**: Soporte para múltiples idiomas.

**Tiempo estimado**: 1-2 semanas

---

#### 5. Notificaciones en Tiempo Real

**Descripción**: Notificaciones push cuando hay nuevas participaciones.

**Tiempo estimado**: 1 semana

---

#### 6. Auditoría Completa

**Descripción**: Registrar todas las acciones importantes (quién, qué, cuándo).

**Tiempo estimado**: 1 semana

---

#### 7. Backup y Restauración

**Descripción**: Sistema de backup automático de la base de datos.

**Tiempo estimado**: 3-5 días

---

### Prioridad Baja

#### 8. Modo Offline

**Descripción**: Permitir registro de participación sin conexión.

**Tiempo estimado**: 2-3 semanas

---

#### 9. PWA (Progressive Web App)

**Descripción**: Convertir en PWA para instalación en dispositivos.

**Tiempo estimado**: 1 semana

---

#### 10. Integración con APIs Externas

**Descripción**: Integrar con sistemas de nómina, RRHH, etc.

**Tiempo estimado**: Variable según API

---

## Resumen por Prioridad

### Alta Prioridad (Recomendado implementar primero)

1. Confirmaciones de eliminación (Fase 5)
2. Loading states en tablas (Fase 5)
3. Mejorar selector de eventos (Fase 7)
4. Responsive design completo (Fase 10)
5. Testing automatizado (General)
6. Manejo de errores global (General)

**Tiempo total estimado**: 4-6 semanas

---

### Media Prioridad

1. Exportación de empleados a CSV (Fase 5)
2. Formato CSV con headers (Fase 8)
3. Tabla de tracking dedicada (Fase 8)
4. Toasts mejorados (Fase 10)
5. Internacionalización (General)

**Tiempo total estimado**: 3-4 semanas

---

### Baja Prioridad (Nice to have)

1. Preview de logo (Fase 5)
2. Gráfico de resumen en PDF (Fase 9)
3. PWA (General)
4. Modo offline (General)

**Tiempo total estimado**: 4-6 semanas

---

## Notas de Implementación

### Consideraciones Técnicas

1. **Backward Compatibility**: Todas las mejoras deben mantener compatibilidad con datos existentes.

2. **Testing**: Cada mejora debe incluir tests antes de merge.

3. **Documentación**: Actualizar documentación con cada nueva feature.

4. **Performance**: Monitorear impacto en performance antes de deploy.

5. **User Feedback**: Priorizar mejoras basadas en feedback de usuarios reales.

### Proceso Sugerido

1. **Planificación**: Revisar y priorizar mejoras cada sprint
2. **Diseño**: Crear mockups/prototipos si es necesario
3. **Implementación**: Desarrollo en feature branch
4. **Testing**: Tests automatizados + QA manual
5. **Review**: Code review del equipo
6. **Deploy**: Deploy gradual (canary/blue-green)
7. **Monitor**: Monitorear métricas post-deploy

---

## Contribuciones

Si deseas contribuir con alguna de estas mejoras:

1. Crea un issue en GitHub describiendo la mejora
2. Espera aprobación del equipo
3. Crea un feature branch desde `dev`
4. Implementa la mejora con tests
5. Crea un Pull Request
6. Espera code review y aprobación

---

**Última actualización**: 2026-01-16
**Versión del documento**: 1.0
