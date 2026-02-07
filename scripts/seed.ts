import { PrismaClient, UserRole, HttpMethod, MonitorStatus, IncidentStatus, AlertContactType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (optional - for fresh seed)
  await prisma.notificationLog.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.checkResult.deleteMany();
  await prisma.monitorAlertContact.deleteMany();
  await prisma.monitor.deleteMany();
  await prisma.alertContact.deleteMany();
  await prisma.projectUser.deleteMany();
  await prisma.project.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // ========================================
  // USERS
  // ========================================
  const passwordHash = await bcrypt.hash('password', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@pulse.local',
      passwordHash,
      name: 'Admin User',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'john@pulse.local',
      passwordHash,
      name: 'John Doe',
      role: UserRole.USER,
      isActive: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jane@pulse.local',
      passwordHash,
      name: 'Jane Smith',
      role: UserRole.USER,
      isActive: true,
    },
  });

  console.log('✅ Created 3 users (admin@pulse.local, john@pulse.local, jane@pulse.local)');
  console.log('   Default password: password');

  // ========================================
  // PROJECTS
  // ========================================
  const prodProject = await prisma.project.create({
    data: {
      name: 'Production',
      description: 'Production environment monitors',
      color: '#EF4444', // Red
    },
  });

  const stagingProject = await prisma.project.create({
    data: {
      name: 'Staging',
      description: 'Staging environment monitors',
      color: '#F59E0B', // Orange
    },
  });

  const devProject = await prisma.project.create({
    data: {
      name: 'Development',
      description: 'Development environment monitors',
      color: '#10B981', // Green
    },
  });

  console.log('✅ Created 3 projects (Production, Staging, Development)');

  // Link users to projects
  await prisma.projectUser.createMany({
    data: [
      { projectId: prodProject.id, userId: adminUser.id, role: 'owner' },
      { projectId: prodProject.id, userId: user1.id, role: 'member' },
      { projectId: stagingProject.id, userId: adminUser.id, role: 'owner' },
      { projectId: stagingProject.id, userId: user2.id, role: 'member' },
      { projectId: devProject.id, userId: adminUser.id, role: 'owner' },
      { projectId: devProject.id, userId: user1.id, role: 'member' },
      { projectId: devProject.id, userId: user2.id, role: 'member' },
    ],
  });

  console.log('✅ Linked users to projects');

  // ========================================
  // ALERT CONTACTS
  // ========================================
  const emailContact = await prisma.alertContact.create({
    data: {
      name: 'DevOps Team Email',
      type: AlertContactType.EMAIL,
      config: {
        email: 'devops@pulse.local',
      },
      isActive: true,
    },
  });

  const teamsContact = await prisma.alertContact.create({
    data: {
      name: 'Teams DevOps Channel',
      type: AlertContactType.TEAMS,
      config: {
        webhookUrl: 'https://outlook.office.com/webhook/example',
      },
      isActive: true,
    },
  });

  console.log('✅ Created 2 alert contacts');

  // ========================================
  // MONITORS
  // ========================================
  const monitors = await Promise.all([
    // Production monitors
    prisma.monitor.create({
      data: {
        projectId: prodProject.id,
        name: 'API Gateway',
        url: 'https://api.example.com/health',
        method: HttpMethod.GET,
        intervalSeconds: 60,
        timeoutMs: 30000,
        expectedStatus: 200,
        tags: ['api', 'critical'],
        currentStatus: MonitorStatus.UP,
        alertContacts: {
          create: [
            { alertContactId: emailContact.id },
            { alertContactId: teamsContact.id },
          ],
        },
      },
    }),
    prisma.monitor.create({
      data: {
        projectId: prodProject.id,
        name: 'Main Website',
        url: 'https://www.example.com',
        method: HttpMethod.GET,
        intervalSeconds: 60,
        timeoutMs: 30000,
        expectedStatus: 200,
        keyword: 'Welcome',
        tags: ['frontend', 'critical'],
        currentStatus: MonitorStatus.UP,
        alertContacts: {
          create: [{ alertContactId: emailContact.id }],
        },
      },
    }),
    prisma.monitor.create({
      data: {
        projectId: prodProject.id,
        name: 'Database API',
        url: 'https://db-api.example.com/ping',
        method: HttpMethod.GET,
        intervalSeconds: 120,
        timeoutMs: 30000,
        expectedStatus: 200,
        tags: ['database', 'critical'],
        currentStatus: MonitorStatus.UP,
        alertContacts: {
          create: [{ alertContactId: teamsContact.id }],
        },
      },
    }),
    prisma.monitor.create({
      data: {
        projectId: prodProject.id,
        name: 'Payment Service',
        url: 'https://payments.example.com/status',
        method: HttpMethod.GET,
        intervalSeconds: 60,
        timeoutMs: 30000,
        expectedStatus: 200,
        tags: ['payments', 'critical'],
        currentStatus: MonitorStatus.UP,
        alertContacts: {
          create: [
            { alertContactId: emailContact.id },
            { alertContactId: teamsContact.id },
          ],
        },
      },
    }),

    // Staging monitors
    prisma.monitor.create({
      data: {
        projectId: stagingProject.id,
        name: 'Staging API',
        url: 'https://staging-api.example.com/health',
        method: HttpMethod.GET,
        intervalSeconds: 300,
        timeoutMs: 30000,
        expectedStatus: 200,
        tags: ['api'],
        currentStatus: MonitorStatus.UP,
      },
    }),
    prisma.monitor.create({
      data: {
        projectId: stagingProject.id,
        name: 'Staging Web',
        url: 'https://staging.example.com',
        method: HttpMethod.GET,
        intervalSeconds: 300,
        timeoutMs: 30000,
        expectedStatus: 200,
        tags: ['frontend'],
        currentStatus: MonitorStatus.UP,
      },
    }),

    // Development monitors
    prisma.monitor.create({
      data: {
        projectId: devProject.id,
        name: 'Dev API',
        url: 'https://dev-api.example.com/health',
        method: HttpMethod.GET,
        intervalSeconds: 600,
        timeoutMs: 30000,
        expectedStatus: 200,
        tags: ['api'],
        currentStatus: MonitorStatus.UP,
      },
    }),
    prisma.monitor.create({
      data: {
        projectId: devProject.id,
        name: 'Dev Web',
        url: 'https://dev.example.com',
        method: HttpMethod.GET,
        intervalSeconds: 600,
        timeoutMs: 30000,
        expectedStatus: 200,
        tags: ['frontend'],
        currentStatus: MonitorStatus.DOWN,
        consecutiveFailures: 3,
      },
    }),
    prisma.monitor.create({
      data: {
        projectId: devProject.id,
        name: 'Test Service',
        url: 'https://test.example.com/ping',
        method: HttpMethod.GET,
        intervalSeconds: 900,
        timeoutMs: 30000,
        expectedStatus: 200,
        tags: ['test'],
        currentStatus: MonitorStatus.DEGRADED,
        consecutiveFailures: 1,
      },
    }),
    prisma.monitor.create({
      data: {
        projectId: devProject.id,
        name: 'Demo Monitor (Paused)',
        url: 'https://demo.example.com',
        method: HttpMethod.GET,
        intervalSeconds: 60,
        timeoutMs: 30000,
        expectedStatus: 200,
        tags: ['demo'],
        isActive: false,
        currentStatus: MonitorStatus.PAUSED,
      },
    }),
  ]);

  console.log('✅ Created 10 monitors across projects');

  // ========================================
  // CHECK RESULTS
  // ========================================
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  // Create check results for the first monitor (successful checks)
  await prisma.checkResult.createMany({
    data: [
      {
        monitorId: monitors[0].id,
        checkedAt: twoHoursAgo,
        success: true,
        responseTimeMs: 245,
        statusCode: 200,
      },
      {
        monitorId: monitors[0].id,
        checkedAt: oneHourAgo,
        success: true,
        responseTimeMs: 198,
        statusCode: 200,
      },
      {
        monitorId: monitors[0].id,
        checkedAt: now,
        success: true,
        responseTimeMs: 212,
        statusCode: 200,
      },
    ],
  });

  // Create check results for monitor with failures
  await prisma.checkResult.createMany({
    data: [
      {
        monitorId: monitors[7].id, // Dev Web (DOWN)
        checkedAt: twoHoursAgo,
        success: false,
        statusCode: 500,
        errorCategory: 'HTTP_5XX',
        errorMessage: 'Internal Server Error',
        rcaDetails: {
          category: 'HTTP_5XX',
          message: 'Server returned 500 Internal Server Error',
          totalDurationMs: 1234,
        },
      },
      {
        monitorId: monitors[7].id,
        checkedAt: oneHourAgo,
        success: false,
        statusCode: 500,
        errorCategory: 'HTTP_5XX',
        errorMessage: 'Internal Server Error',
      },
      {
        monitorId: monitors[7].id,
        checkedAt: now,
        success: false,
        statusCode: 500,
        errorCategory: 'HTTP_5XX',
        errorMessage: 'Internal Server Error',
      },
    ],
  });

  console.log('✅ Created sample check results');

  // ========================================
  // INCIDENTS
  // ========================================
  const incident = await prisma.incident.create({
    data: {
      monitorId: monitors[7].id,
      status: IncidentStatus.OPEN,
      startedAt: twoHoursAgo,
      errorCategory: 'HTTP_5XX',
      errorMessage: 'Server returned 500 Internal Server Error',
      rcaDetails: {
        category: 'HTTP_5XX',
        message: 'Server returned 500 Internal Server Error',
        timestamp: twoHoursAgo.toISOString(),
        phases: {
          http: {
            durationMs: 1234,
            statusCode: 500,
            statusText: 'Internal Server Error',
            success: false,
            error: 'Server error',
          },
        },
        totalDurationMs: 1234,
      },
    },
  });

  console.log('✅ Created sample incident');

  // ========================================
  // ACTIVITY LOGS
  // ========================================
  await prisma.activityLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: adminUser.id,
        details: { ipAddress: '192.168.1.1' },
        ipAddress: '192.168.1.1',
        createdAt: now,
      },
      {
        userId: adminUser.id,
        action: 'PROJECT_CREATED',
        entityType: 'Project',
        entityId: prodProject.id,
        details: { projectName: prodProject.name },
        ipAddress: '192.168.1.1',
        createdAt: twoHoursAgo,
      },
      {
        userId: user1.id,
        action: 'MONITOR_CREATED',
        entityType: 'Monitor',
        entityId: monitors[0].id,
        details: { monitorName: monitors[0].name },
        ipAddress: '192.168.1.2',
        createdAt: oneHourAgo,
      },
    ],
  });

  console.log('✅ Created activity logs');

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log('   - 3 Users (1 admin, 2 regular)');
  console.log('   - 3 Projects (Production, Staging, Development)');
  console.log('   - 10 Monitors (various statuses)');
  console.log('   - 2 Alert Contacts (Email, Teams)');
  console.log('   - Sample check results and incidents');
  console.log('');
  console.log('🔐 Login credentials:');
  console.log('   Email: admin@pulse.local');
  console.log('   Password: password');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
