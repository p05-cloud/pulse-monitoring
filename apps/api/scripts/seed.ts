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
  // Check if projects already exist by name, otherwise create new ones
  const productionProject = await prisma.project.findFirst({
    where: { name: 'Production' },
  });

  const stagingProject = await prisma.project.findFirst({
    where: { name: 'Staging' },
  });

  const projects = [];

  if (!productionProject) {
    const prod = await prisma.project.create({
      data: {
        name: 'Production',
        description: 'Production environment monitoring',
        color: '#EF4444', // Red
      },
    });
    projects.push(prod);
    console.log('✅ Production project created');
  } else {
    projects.push(productionProject);
    console.log('ℹ️  Production project already exists');
  }

  if (!stagingProject) {
    const staging = await prisma.project.create({
      data: {
        name: 'Staging',
        description: 'Staging environment monitoring',
        color: '#F59E0B', // Amber
      },
    });
    projects.push(staging);
    console.log('✅ Staging project created');
  } else {
    projects.push(stagingProject);
    console.log('ℹ️  Staging project already exists');
  }

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
