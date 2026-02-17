import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@dqms.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const name = 'System Admin';

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create or update admin
  const admin = await prisma.admin.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      isActive: true,
    },
    create: {
      email,
      password: hashedPassword,
      name,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  // Admin seeded successfully - credentials in environment variables
  return admin;
}

seedAdmin()
  .catch((e) => {
    process.stderr.write('Error seeding admin user\n');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
