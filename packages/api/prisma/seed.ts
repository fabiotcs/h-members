import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hmembers.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const platformName = process.env.PLATFORM_NAME || 'H-Members';

  // Create admin user if not exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        name: 'Administrador',
        email: adminEmail,
        passwordHash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    console.log(`Admin user created: ${adminEmail}`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  // Create default platform settings
  const defaultSettings = [
    { key: 'platform_name', value: platformName },
    { key: 'primary_color', value: process.env.PRIMARY_COLOR || '#6366f1' },
    { key: 'logo_url', value: process.env.LOGO_URL || '/uploads/logos/logo.png' },
  ];

  for (const setting of defaultSettings) {
    await prisma.platformSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log('Platform settings seeded');

  // Create default category
  const existingCategory = await prisma.category.findUnique({
    where: { slug: 'geral' },
  });

  if (!existingCategory) {
    await prisma.category.create({
      data: { name: 'Geral', slug: 'geral', order: 1 },
    });
    console.log('Default category "Geral" created');
  }
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
