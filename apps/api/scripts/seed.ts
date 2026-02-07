import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminEmail = 'admin@pulse.local';
  const adminPassword = 'password';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: hashedPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create sample projects
  const projects = await Promise.all([
    prisma.project.upsert({
      where: { id: 'proj_1' },
      update: {},
      create: {
        id: 'proj_1',
        name: 'Production',
        description: 'Production environment monitoring',
      },
    }),
    prisma.project.upsert({
      where: { id: 'proj_2' },
      update: {},
      create: {
        id: 'proj_2',
        name: 'Staging',
        description: 'Staging environment monitoring',
      },
    }),
  ]);

  console.log('✅ Projects created:', projects.length);

  console.log('🎉 Database seeded successfully!');
  console.log('\n📝 Login credentials:');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
