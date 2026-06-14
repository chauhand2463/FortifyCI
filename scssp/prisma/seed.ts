import { PrismaClient, RoleName, PermissionName } from '@prisma/client';
import { hash } from '@node-rs/argon2';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

const ALL_PERMISSIONS: { name: PermissionName; description: string }[] = [
  { name: 'USER_CREATE', description: 'Create users' },
  { name: 'USER_READ', description: 'View users' },
  { name: 'USER_UPDATE', description: 'Update users' },
  { name: 'USER_DELETE', description: 'Delete users' },
  { name: 'ROLE_CREATE', description: 'Create roles' },
  { name: 'ROLE_READ', description: 'View roles' },
  { name: 'ROLE_UPDATE', description: 'Update roles' },
  { name: 'ROLE_DELETE', description: 'Delete roles' },
  { name: 'IMAGE_REGISTER', description: 'Register container images' },
  { name: 'IMAGE_READ', description: 'View images' },
  { name: 'IMAGE_DELETE', description: 'Delete images' },
  { name: 'SCAN_CREATE', description: 'Create scans' },
  { name: 'SCAN_READ', description: 'View scans' },
  { name: 'SCAN_CANCEL', description: 'Cancel scans' },
  { name: 'VULNERABILITY_READ', description: 'View vulnerabilities' },
  { name: 'VULNERABILITY_EXPORT', description: 'Export vulnerabilities' },
  { name: 'VULNERABILITY_ASSIGN', description: 'Assign vulnerabilities to users' },
  { name: 'VULNERABILITY_EXCEPTION', description: 'Create/approve CVE exceptions' },
  { name: 'SBOM_CREATE', description: 'Generate SBOMs' },
  { name: 'SBOM_READ', description: 'View SBOMs' },
  { name: 'SBOM_DELETE', description: 'Delete SBOMs' },
  { name: 'REPORT_CREATE', description: 'Create reports' },
  { name: 'REPORT_READ', description: 'View reports' },
  { name: 'REPORT_DOWNLOAD', description: 'Download reports' },
  { name: 'REPORT_DELETE', description: 'Delete reports' },
  { name: 'NOTIFICATION_READ', description: 'View notifications' },
  { name: 'NOTIFICATION_MANAGE', description: 'Manage notifications' },
  { name: 'AUDIT_LOG_READ', description: 'View audit logs' },
  { name: 'AUDIT_LOG_EXPORT', description: 'Export audit logs' },
  { name: 'JOB_READ', description: 'View jobs' },
  { name: 'JOB_CANCEL', description: 'Cancel jobs' },
  { name: 'API_KEY_CREATE', description: 'Create API keys' },
  { name: 'API_KEY_READ', description: 'View API keys' },
  { name: 'API_KEY_DELETE', description: 'Delete API keys' },
  { name: 'WEBHOOK_MANAGE', description: 'Create/edit/delete webhooks' },
  { name: 'POLICY_MANAGE', description: 'Create/edit/delete scan policies' },
  { name: 'LIVE_SCAN_CREATE', description: 'Use the live image gate' },
];

const ROLE_PERMISSIONS: Record<RoleName, PermissionName[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS.map((p) => p.name),
  ADMIN: [
    'USER_CREATE', 'USER_READ', 'USER_UPDATE', 'USER_DELETE',
    'ROLE_READ',
    'IMAGE_REGISTER', 'IMAGE_READ', 'IMAGE_DELETE',
    'SCAN_CREATE', 'SCAN_READ', 'SCAN_CANCEL',
    'VULNERABILITY_READ', 'VULNERABILITY_EXPORT', 'VULNERABILITY_ASSIGN',
    'SBOM_CREATE', 'SBOM_READ', 'SBOM_DELETE',
    'REPORT_CREATE', 'REPORT_READ', 'REPORT_DOWNLOAD', 'REPORT_DELETE',
    'NOTIFICATION_READ', 'NOTIFICATION_MANAGE',
    'AUDIT_LOG_READ',
    'JOB_READ', 'JOB_CANCEL',
    'API_KEY_CREATE', 'API_KEY_READ', 'API_KEY_DELETE',
    'WEBHOOK_MANAGE',
    'POLICY_MANAGE',
    'LIVE_SCAN_CREATE',
  ],
  DEVELOPER: [
    'USER_READ',
    'IMAGE_REGISTER', 'IMAGE_READ',
    'SCAN_CREATE', 'SCAN_READ',
    'VULNERABILITY_READ',
    'SBOM_CREATE', 'SBOM_READ',
    'REPORT_CREATE', 'REPORT_READ', 'REPORT_DOWNLOAD',
    'NOTIFICATION_READ',
    'LIVE_SCAN_CREATE',
  ],
  SECURITY_ANALYST: [
    'USER_READ',
    'IMAGE_READ',
    'SCAN_READ',
    'VULNERABILITY_READ', 'VULNERABILITY_EXPORT', 'VULNERABILITY_ASSIGN', 'VULNERABILITY_EXCEPTION',
    'SBOM_READ',
    'REPORT_CREATE', 'REPORT_READ', 'REPORT_DOWNLOAD',
    'NOTIFICATION_READ', 'NOTIFICATION_MANAGE',
    'AUDIT_LOG_READ', 'AUDIT_LOG_EXPORT',
  ],
  VIEWER: [
    'USER_READ',
    'IMAGE_REGISTER', 'IMAGE_READ',
    'SCAN_CREATE', 'SCAN_READ',
    'VULNERABILITY_READ',
    'SBOM_CREATE', 'SBOM_READ',
    'REPORT_CREATE', 'REPORT_READ', 'REPORT_DOWNLOAD',
    'NOTIFICATION_READ',
  ],
};

async function seed(): Promise<void> {
  console.log('Starting database seed...');

  console.log('Creating permissions...');
  for (const perm of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description },
      create: { name: perm.name, description: perm.description },
    });
  }
  console.log(`  ${ALL_PERMISSIONS.length} permissions created`);

  console.log('Creating roles...');
  for (const [roleName, perms] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName as RoleName },
      update: { description: `${roleName} role with system-defined permissions` },
      create: {
        name: roleName as RoleName,
        description: `${roleName} role with system-defined permissions`,
        isSystem: true,
      },
    });

    const uniquePerms = [...new Set(perms)];
    const permissionRecords = await prisma.permission.findMany({
      where: { name: { in: uniquePerms } },
    });

    for (const perm of permissionRecords) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }

    console.log(`  ${roleName} role created with ${uniquePerms.length} permissions`);
  }

  console.log('Creating default scan policies...');
  const existingStrict = await prisma.scanPolicy.findUnique({ where: { name: 'strict' } });
  if (!existingStrict) {
    await prisma.scanPolicy.create({
      data: {
        name: 'strict',
        description: 'Blocks on any CRITICAL or HIGH vulnerability. Zero tolerance policy.',
        blockOnCritical: true,
        blockOnHigh: true,
        maxHighCount: 0,
        maxMediumCount: 5,
        slaCriticalDays: 3,
        slaHighDays: 7,
        slaMediumDays: 30,
        registryPatterns: ['*'],
        isDefault: false,
      },
    });
    console.log('  strict policy created');
  }

  const existingStandard = await prisma.scanPolicy.findUnique({ where: { name: 'standard' } });
  if (!existingStandard) {
    await prisma.scanPolicy.create({
      data: {
        name: 'standard',
        description: 'Blocks on CRITICAL only. Standard SLA for non-blocking severities.',
        blockOnCritical: true,
        blockOnHigh: false,
        maxHighCount: -1,
        maxMediumCount: -1,
        slaCriticalDays: 7,
        slaHighDays: 30,
        slaMediumDays: 90,
        registryPatterns: ['*'],
        isDefault: true,
      },
    });
    console.log('  standard policy created');
  }

  console.log('Creating admin user...');
  const adminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } })!;

  const adminPassword = await hash('Admin123!@#', {
    algorithm: 2,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  await prisma.user.upsert({
    where: { email: 'admin@fortifyci.local' },
    update: {},
    create: {
      email: 'admin@fortifyci.local',
      username: 'admin',
      passwordHash: adminPassword,
      roleId: adminRole!.id,
      isVerified: true,
    },
  });

  console.log('  Admin user created: admin@fortifyci.local / Admin123!@#');
  console.log('Seed completed successfully');
}

seed()
  .catch((e: unknown) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
