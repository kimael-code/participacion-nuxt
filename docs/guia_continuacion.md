# Guía de Continuación del Proyecto

## 📋 Estado Actual del Proyecto

### ✅ Completado (Fase 1 y 2)

1. **Dependencias instaladas** (todas en `package.json`):
   - `drizzle-orm`, `drizzle-kit`, `@libsql/client`
   - `better-auth`
   - `echarts`, `vue-echarts`
   - `jspdf`, `jspdf-autotable`
   - `papaparse`, `@types/papaparse`

2. **Archivos de configuración creados**:
   - ✅ `drizzle.config.ts` - Configuración de Drizzle ORM para Turso
   - ✅ `server/database/schema.ts` - Schema completo con 14 tablas
   - ✅ `server/utils/db.ts` - Cliente de base de datos
   - ✅ `.env.example` - Template de variables de entorno

3. **Schema de base de datos** (normalizado):
   - Autenticación: `users`, `sessions`, `accounts`
   - Multi-tenancy: `companies`, `userCompanies`
   - Geografía: `states`, `municipalities`, `parishes`, `votingCenters`
   - Empresa: `employees`, `administrativeUnits`, `events`
   - Participación: `participations`, `nonParticipationReasons`, `csvListings`

### ⏳ En Progreso
- Generación de migraciones con Drizzle Kit

### ❌ Pendiente
- Configurar cuenta Turso
- Configurar better-auth con OAuth
- Actualizar `nuxt.config.ts`
- Crear seeds de datos
- Todo lo de Fase 3 en adelante

---

## 🏠 Cómo Continuar desde tu Portátil Personal

### Paso 1: Sincronizar el Repositorio

```bash
# Si aún no has clonado el repo en tu portátil
cd ~/Dev/Portfolio
git clone <URL_DEL_REPO> araguaney-nuxt
cd araguaney-nuxt

# Si ya lo tienes clonado, sincroniza
cd ~/Dev/Portfolio/araguaney-nuxt
git pull origin main  # o la rama en la que estés trabajando
```

### Paso 2: Verificar que tienes los nuevos archivos

```bash
# Debes tener estos archivos nuevos:
ls -la drizzle.config.ts
ls -la server/database/schema.ts
ls -la server/utils/db.ts
ls -la .env.example
```

### Paso 3: Instalar dependencias

```bash
# Asegúrate de tener pnpm instalado
pnpm --version

# Si no lo tienes:
npm install -g pnpm

# Instalar todas las dependencias
pnpm install
```

### Paso 4: Configurar variables de entorno

```bash
# Copiar el template
cp .env.example .env

# Editar .env con tus credenciales
nano .env  # o usa tu editor favorito
```

**Las variables que necesitas configurar:**

```env
# Database (Turso) - Configurar en Paso 5
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# Better Auth
BETTER_AUTH_SECRET=  # Generar con: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000

# OAuth Providers (Configurar en Paso 6)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

---

## 🗄️ Paso 5: Configurar Base de Datos Turso

### 5.1. Instalar Turso CLI

```bash
# macOS/Linux
curl -sSfL https://get.tur.so/install.sh | bash

# Verificar instalación
turso --version
```

### 5.2. Crear cuenta y autenticarse

```bash
# Crear cuenta (abrirá navegador)
turso auth signup

# O si ya tienes cuenta
turso auth login
```

### 5.3. Crear base de datos de desarrollo

```bash
# Crear DB
turso db create participacion-dev

# Ver información de la DB
turso db show participacion-dev

# Esto te dará:
# - URL de la base de datos
# - Región donde está hosteada
```

### 5.4. Obtener URL y token

```bash
# Obtener la URL
turso db show participacion-dev --url

# Crear token de autenticación
turso db tokens create participacion-dev

# Copiar estos valores a tu .env:
# TURSO_DATABASE_URL=libsql://participacion-dev-[tu-usuario].turso.io
# TURSO_AUTH_TOKEN=eyJhbGc...  (el token completo)
```

### 5.5. Generar migraciones

```bash
# Generar archivos de migración
pnpm drizzle-kit generate

# Esto creará archivos en server/database/migrations/
```

### 5.6.Aplicar migraciones

```bash
# Aplicar migraciones a Turso
pnpm drizzle-kit migrate

# Verificar
turso db shell participacion-dev
# Dentro del shell:
.tables
# Deberías ver todas las tablas
.quit
```

---

## 🔐 Paso 6: Configurar OAuth Providers

### 6.1. Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto o selecciona uno existente
3. Habilita "Google+ API"
4. Ve a "Credenciales" → "Crear credenciales" → "ID de cliente OAuth 2.0"
5. Tipo de aplicación: "Aplicación web"
6. Orígenes autorizados: `http://localhost:3000`
7. URIs de redirección: `http://localhost:3000/api/auth/callback/google`
8. Copia el Client ID y Client Secret a `.env`

### 6.2. GitHub OAuth

1. Ve a [GitHub Developer Settings](https://github.com/settings/developers)
2. "New OAuth App"
3. Application name: "Participación Nuxt (Dev)"
4. Homepage URL: `http://localhost:3000`
5. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
6. Genera Client Secret
7. Copia Client ID y Client Secret a `.env`

---

## 📝 Paso 7: Continuar con la Implementación

Ahora puedes continuar desde donde lo dejaste. Consulta los documentos:

### Ver el plan completo:
```bash
cat docs/implementation_plan.md
```

### Ver las tareas pendientes:
```bash
cat docs/task.md
```

### Próximos pasos según el plan:

1. **Actualizar `nuxt.config.ts`**:
   - Agregar `runtimeConfig` con variables de entorno
   
2. **Configurar better-auth** (`server/auth.ts`):
   - Integración con Drizzle
   - Configurar Google y GitHub OAuth

3. **Crear seeds de datos** (Fase 2):
   - Script para poblar catálogos geográficos
   - Datos de prueba para empresas

4. **Comenzar Fase 3: Backend/API**:
   - Endpoints de catálogos geográficos
   - CRUD de empresas
   - CRUD de empleados
   - etc.

---

## 🚀 Comandos Útiles

```bash
# Desarrollo
pnpm dev

# Ver estructura de tablas en Turso
turso db shell participacion-dev
.schema users
.schema companies
.quit

# Regenerar migraciones después de cambios en schema
pnpm drizzle-kit generate

# Aplicar nuevas migraciones
pnpm drizzle-kit migrate

# Ver logs de Drizzle
pnpm drizzle-kit studio  # Abre UI visual de la BD
```

---

## 📚 Recursos Adicionales

- **Documentación Turso**: https://docs.turso.tech/
- **Drizzle ORM**: https://orm.drizzle.team/
- **better-auth**: https://www.better-auth.com/docs
- **Nuxt 4**: https://nuxt.com/docs/4.x

---

## 🔄 Flujo de Trabajo Recomendado

1. **En tu estación de trabajo actual**:
   ```bash
   git add .
   git commit -m "feat: configuración inicial de base de datos y dependencias"
   git push origin main
   ```

2. **En tu portátil personal**:
   ```bash
   git pull origin main
   pnpm install
   # Configurar .env según Pasos 4-6
   pnpm drizzle-kit migrate
   pnpm dev
   ```

3. **Continuar desarrollo**:
   - Seguir el `task.md` paso a paso
   - Actualizar el `task.md` marcando tareas completadas
   - Hacer commits frecuentes

---

## ⚠️ Notas Importantes

1. **No subas `.env` a Git** - Ya está en `.gitignore`
2. **Usa la misma base de datos Turso** en ambos equipos (mismo URL y token)
3. **Sincroniza frecuentemente** para evitar conflictos
4. **Los seeds se ejecutan solo una vez** - no los corras en ambos equipos
5. **Para desarrollo local sin Turso**: el cliente de DB usa SQLite local si NODE_ENV=development

---

## 🐛 Troubleshooting

### "pnpm: command not found"
```bash
npm install -g pnpm
```

### "Error connecting to Turso"
```bash
# Revisa que el token sea válido
turso db tokens create participacion-dev
# Actualiza TURSO_AUTH_TOKEN en .env
```

### "Migrations not found"
```bash
# Regenera las migraciones
pnpm drizzle-kit generate
```

### "OAuth redirect mismatch"
- Verifica que las URLs de callback coincidan exactamente
- Para producción, actualiza con tu dominio de Vercel

---

¡Listo! Con estos pasos podrás continuar el desarrollo desde cualquier equipo.
