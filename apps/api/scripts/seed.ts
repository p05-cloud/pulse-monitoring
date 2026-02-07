import { PrismaClient, UserRole, MonitorStatus, HttpMethod } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Project definitions with descriptions and colors
const projectDefinitions = [
  {
    name: 'Tata Mutual Funds',
    description: 'Monitoring for Tata Mutual Funds digital ecosystem - includes investor portals, admin dashboards, CMS APIs, and distributor platforms serving millions of mutual fund investors',
    color: '#10B981', // Emerald green
    monitors: [
      { name: 'Admin Dashboard', url: 'https://admin-dashboard.tatamutualfund.com/login', tags: ['admin', 'dashboard'] },
      { name: 'Admin Portal', url: 'https://admin.tatamutualfund.com/login', tags: ['admin', 'portal'] },
      { name: 'CMS API - Index Fund Menu', url: 'https://betacms.tatamutualfund.com/api/CMSDATA_corporate_main_menu_index_fund', tags: ['api', 'cms'] },
      { name: 'CMS API - Invest Menu', url: 'https://betacms.tatamutualfund.com/api/CMSDATA_corporate_main_menu_invest', tags: ['api', 'cms'] },
      { name: 'CMS API - Expert Advice', url: 'https://betacms.tatamutualfund.com/api/CMSDATA_corporate_portal_expert_advice?advice_category=All', tags: ['api', 'cms'] },
      { name: 'CMS API - Press Release', url: 'https://betacms.tatamutualfund.com/api/CMSDATA_expert_advice_media_press_releas', tags: ['api', 'cms'] },
      { name: 'Online Investor Portal', url: 'https://online.tatamutualfund.com/login', tags: ['investor', 'portal'] },
      { name: 'Distributor API', url: 'https://prod-dist-api.tatamfdev.com/', tags: ['api', 'distributor'] },
      { name: 'Distributor Auth API', url: 'https://prod-dist-api.tatamfdev.com/api/v1/auth/pre-login', tags: ['api', 'auth'] },
      { name: 'RM Pragati Portal', url: 'https://rm-pragati.tatamutualfund.com/rm-login', tags: ['rm', 'portal'] },
      { name: 'Pragati Investor Portal', url: 'https://www.pragati.tatamutualfund.com/login', tags: ['investor', 'pragati'] },
      { name: 'Main Website', url: 'https://www.tatamutualfund.com/', tags: ['website', 'public'] },
    ],
  },
  {
    name: 'SystemX - Tata Capital',
    description: 'Critical monitoring for Tata Capital financial systems - includes loan management, learning platforms, and internal applications supporting financial services operations',
    color: '#6366F1', // Indigo
    monitors: [
      { name: 'Nirikshan Portal', url: 'https://nirikshan.tatacapital.com/login', tags: ['portal', 'monitoring'] },
      { name: 'CSFD LMS Portal', url: 'https://csfd-ue-lms-lams.tatacapital.com/LIT/Renderer/common/elogin.jsp', tags: ['lms', 'training'] },
      { name: 'Apps68 Server', url: 'https://apps68.tatacapital.com/', tags: ['app-server'] },
      { name: 'Apps55 Server', url: 'https://apps55.tatacapital.com/', tags: ['app-server'] },
    ],
  },
  {
    name: 'Tata Power',
    description: 'Comprehensive monitoring for Tata Power data analytics and operational systems - covers plant monitoring, coal SCM, emissions tracking, weather portals, and power generation analytics across multiple facilities',
    color: '#F59E0B', // Amber
    monitors: [
      { name: 'CCRA3 Analytics', url: 'https://data-analytics.tatapower.com/CCRA3', tags: ['analytics'] },
      { name: 'Coal SCM', url: 'https://data-analytics.tatapower.com/CoalSCM/', tags: ['scm', 'coal'] },
      { name: 'Collection Forecast', url: 'https://data-analytics.tatapower.com/collection_forecast', tags: ['analytics', 'forecast'] },
      { name: 'Fleet Management', url: 'https://data-analytics.tatapower.com/fms/', tags: ['fleet'] },
      { name: 'Haldia Power Sales', url: 'https://data-analytics.tatapower.com/HaldiaPowerSales', tags: ['haldia', 'sales'] },
      { name: 'Haldia APC', url: 'https://data-analytics.tatapower.com/haldia_apc/', tags: ['haldia', 'apc'] },
      { name: 'Jojobera Main', url: 'https://data-analytics.tatapower.com/Jojobera', tags: ['jojobera'] },
      { name: 'Jojobera BTL Monitoring', url: 'https://data-analytics.tatapower.com/JojoberaBoilerTubeLeakage/', tags: ['jojobera', 'btl'] },
      { name: 'Jojobera Coal SCM', url: 'https://data-analytics.tatapower.com/JojoberaCoalSCM/', tags: ['jojobera', 'scm'] },
      { name: 'Jojobera APC', url: 'https://data-analytics.tatapower.com/jojobera_apc', tags: ['jojobera', 'apc'] },
      { name: 'Jojobera BTL Dashboard', url: 'https://data-analytics.tatapower.com/Jojobera_BTL', tags: ['jojobera', 'btl'] },
      { name: 'Liquidity Management', url: 'https://data-analytics.tatapower.com/liquidity_management', tags: ['finance'] },
      { name: 'Maithon Plant', url: 'https://data-analytics.tatapower.com/Maithon', tags: ['maithon'] },
      { name: 'MPL APC', url: 'https://data-analytics.tatapower.com/mpl_apc/', tags: ['mpl', 'apc'] },
      { name: 'MPL Combustion', url: 'https://data-analytics.tatapower.com/mpl_combustion/', tags: ['mpl', 'combustion'] },
      { name: 'Mundra Coal Recovery', url: 'https://data-analytics.tatapower.com/MundraCoalUnderRecovery/', tags: ['mundra', 'coal'] },
      { name: 'Parikshan Portal', url: 'https://data-analytics.tatapower.com/parikshan/', tags: ['monitoring'] },
      { name: 'Solar Rooftop', url: 'https://data-analytics.tatapower.com/solarRooftop2', tags: ['solar', 'renewable'] },
      { name: 'Emissions Monitoring', url: 'https://data-analytics.tatapower.com/PlantEmissionMonitoring', tags: ['emissions', 'environment'] },
      { name: 'Prayagraj Power Gen', url: 'https://data-analytics.tatapower.com/PrayagrajPowerGeneration/', tags: ['prayagraj', 'generation'] },
      { name: 'Weather Portal', url: 'https://data-analytics.tatapower.com/tpcWeatherPortal/web', tags: ['weather'] },
    ],
  },
  {
    name: 'ITSM',
    description: 'IT Service Management API monitoring - core infrastructure for IT ticketing, incident management, and service delivery operations',
    color: '#3B82F6', // Blue
    monitors: [
      { name: 'ITSM API', url: 'https://api-itsm.acc.ltd/', tags: ['api', 'itsm'] },
    ],
  },
];

async function main() {
  console.log('Starting database seed...');

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

  console.log('Admin user created:', admin.email);

  // Create projects and monitors
  let totalMonitors = 0;

  for (const projectDef of projectDefinitions) {
    // Check if project already exists
    let project = await prisma.project.findFirst({
      where: { name: projectDef.name },
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          name: projectDef.name,
          description: projectDef.description,
          color: projectDef.color,
        },
      });
      console.log(`Project created: ${project.name}`);
    } else {
      console.log(`Project already exists: ${project.name}`);
    }

    // Create monitors for this project
    for (const monitorDef of projectDef.monitors) {
      const existingMonitor = await prisma.monitor.findFirst({
        where: {
          projectId: project.id,
          url: monitorDef.url,
        },
      });

      if (!existingMonitor) {
        await prisma.monitor.create({
          data: {
            projectId: project.id,
            name: monitorDef.name,
            url: monitorDef.url,
            method: HttpMethod.GET,
            intervalSeconds: 60,
            timeoutMs: 30000,
            expectedStatus: 200,
            tags: monitorDef.tags,
            isActive: true,
            currentStatus: MonitorStatus.UNKNOWN,
            consecutiveFailures: 0,
          },
        });
        totalMonitors++;
        console.log(`  Monitor created: ${monitorDef.name}`);
      } else {
        console.log(`  Monitor already exists: ${monitorDef.name}`);
      }
    }
  }

  console.log('\nDatabase seeded successfully!');
  console.log(`Total new monitors created: ${totalMonitors}`);
  console.log('\nLogin credentials:');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
