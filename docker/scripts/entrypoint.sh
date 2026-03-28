#!/bin/sh
set -e

echo "==> Aguardando MySQL..."
# Simple TCP check — wait until MySQL port is reachable
until nc -z mysql 3306 2>/dev/null; do
  echo "    MySQL nao esta pronto, aguardando 2s..."
  sleep 2
done
# Extra wait for MySQL to finish initialization
sleep 3
echo "==> MySQL esta pronto!"

echo "==> Sincronizando schema do banco..."
cd /app/packages/api
npx prisma db push --skip-generate

echo "==> Executando seed (se necessario)..."
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@hmembers.com';
  const pass = process.env.ADMIN_PASSWORD || 'Admin@123';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const hash = await bcrypt.hash(pass, 10);
    await prisma.user.create({ data: { name: 'Administrador', email, passwordHash: hash, role: 'ADMIN', status: 'ACTIVE' } });
    console.log('Admin user created:', email);
  } else {
    console.log('Admin user exists:', email);
  }
  const settings = [
    { key: 'platform_name', value: process.env.PLATFORM_NAME || 'H-Members' },
    { key: 'primary_color', value: process.env.PRIMARY_COLOR || '#6366f1' },
    { key: 'logo_url', value: process.env.LOGO_URL || '' },
  ];
  for (const s of settings) {
    await prisma.platformSetting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }
  console.log('Settings seeded');
  await prisma.category.upsert({ where: { slug: 'geral' }, update: {}, create: { name: 'Geral', slug: 'geral', order: 1 } });
  console.log('Default category seeded');
}
main().catch(e => { console.error('Seed error:', e); }).finally(() => prisma.\$disconnect());
" || echo "Seed concluido com avisos"

echo "==> Criando subdiretorios de uploads (se necessario)..."
mkdir -p /app/uploads/covers /app/uploads/materials /app/uploads/logos

echo "==> Iniciando aplicacao..."
cd /app
exec "$@"
