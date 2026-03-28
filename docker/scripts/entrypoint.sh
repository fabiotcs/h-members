#!/bin/sh
set -e

echo "==> Aguardando MySQL..."
until mysqladmin ping -h mysql --silent 2>/dev/null; do
  echo "    MySQL nao esta pronto, aguardando 2s..."
  sleep 2
done
echo "==> MySQL esta pronto!"

echo "==> Executando migrations..."
cd /app/packages/api
npx prisma migrate deploy

echo "==> Executando seed (se necessario)..."
npx prisma db seed || echo "Seed ja executado ou nao necessario"

echo "==> Criando subdiretorios de uploads (se necessario)..."
mkdir -p /app/uploads/covers /app/uploads/materials /app/uploads/logos

echo "==> Iniciando aplicacao..."
cd /app
exec "$@"
