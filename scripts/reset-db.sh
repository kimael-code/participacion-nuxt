#!/bin/bash

# Script para resetear la base de datos LOCAL SQLite
# y reaplicar migraciones + seed

echo "🔄 Reseteando base de datos local..."

# 1. Eliminar archivo de base de datos local
echo "🗑️  Eliminando base de datos local..."
rm -f local.db
rm -f local.db-shm
rm -f local.db-wal

# 2. Eliminar carpeta de migraciones
echo "📁 Eliminando migraciones antiguas..."
rm -rf server/database/migrations

# 3. Generar nuevas migraciones
echo "🔨 Generando nuevas migraciones..."
pnpm drizzle-kit generate

# 4. Aplicar migraciones
echo "📤 Aplicando migraciones..."
pnpm drizzle-kit migrate

# 5. Dar permisos de escritura a la base de datos
echo "🔐 Configurando permisos..."
chmod 664 local.db 2>/dev/null || true

# 6. Ejecutar seed con variables de entorno explícitas
echo "🌱 Ejecutando seed..."
TURSO_DATABASE_URL="file:local.db" TURSO_AUTH_TOKEN="" pnpm tsx server/database/seed.ts

# 7. Asegurar permisos finales
chmod 664 local.db 2>/dev/null || true

echo "✅ Base de datos local reseteada y realimentada exitosamente!"
