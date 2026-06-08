import { getPrisma } from '@shared/database/prisma';
import { getLogger } from '@shared/utils/logger';
import crypto from 'crypto';

const logger = getLogger();

export interface SbomPackage {
  name: string;
  version: string;
  supplier?: string;
  licenses?: string[];
  purl?: string;
  type?: string;
  checksum?: string;
}

export async function generateSpdxSbom(imageId: string): Promise<{
  content: Record<string, unknown>;
  packageCount: number;
  version: string;
}> {
  const prisma = getPrisma();
  const image = await prisma.image.findUnique({ where: { id: imageId } });
  if (!image) throw new Error(`Image ${imageId} not found`);

  const imageRef = `${image.registry}/${image.repository}:${image.tag}`;
  const sbomId = crypto.randomUUID();
  const documentNamespace = `https://fortifyci.local/spdxdocs/${image.name}-${image.tag}-${Date.now()}`;

  const packages: Record<string, unknown>[] = [
    {
      SPDXID: `SPDXRef-${image.name.replace(/[^a-zA-Z0-9]/g, '-')}-${image.tag}`,
      name: imageRef,
      versionInfo: image.tag,
      supplier: 'NOASSERTION',
      downloadLocation: `https://${image.registry}/v2/${image.repository}/manifests/${image.tag}`,
      filesAnalyzed: false,
      licenseConcluded: 'NOASSERTION',
      licenseDeclared: 'NOASSERTION',
      copyrightText: 'NOASSERTION',
      externalRefs: [
        {
          referenceCategory: 'PACKAGE-MANAGER',
          referenceType: 'purl',
          referenceLocator: `pkg:oci/${image.repository}@${image.tag}`,
        },
      ],
    },
  ];

  const scans = await prisma.scan.findMany({
    where: { imageId, status: 'COMPLETED' },
    include: { vulnerabilities: { select: { packageName: true, packageVersion: true, packageType: true } } },
    orderBy: { createdAt: 'desc' },
    take: 1,
  });

  if (scans.length > 0) {
    const seen = new Set<string>();
    for (const v of scans[0]!.vulnerabilities) {
      const key = `${v.packageName}@${v.packageVersion}`;
      if (!seen.has(key)) {
        seen.add(key);
        packages.push({
          SPDXID: `SPDXRef-Package-${v.packageName.replace(/[^a-zA-Z0-9]/g, '-')}-${v.packageVersion}`,
          name: v.packageName,
          versionInfo: v.packageVersion,
          supplier: 'NOASSERTION',
          downloadLocation: 'NOASSERTION',
          filesAnalyzed: false,
          licenseConcluded: 'NOASSERTION',
          licenseDeclared: 'NOASSERTION',
          copyrightText: 'NOASSERTION',
        });
      }
    }
  }

  const content = {
    spdxVersion: 'SPDX-2.3',
    dataLicense: 'CC0-1.0',
    SPDXID: 'SPDXRef-DOCUMENT',
    name: `${imageRef} SBOM`,
    documentNamespace,
    creationInfo: {
      created: new Date().toISOString(),
      creators: ['Tool: FortifyCI-1.0', 'Tool: Trivy'],
      licenseListVersion: '3.23',
    },
    packages,
    relationships: [
      {
        spdxElementId: 'SPDXRef-DOCUMENT',
        relationshipType: 'DESCRIBES',
        relatedSpdxElement: packages[0]!.SPDXID as string,
      },
    ],
  };

  logger.info({ imageId, packageCount: packages.length }, 'SPDX SBOM generated');
  return {
    content,
    packageCount: packages.length,
    version: 'SPDX-2.3',
  };
}

export async function generateCycloneDxSbom(imageId: string): Promise<{
  content: Record<string, unknown>;
  packageCount: number;
  version: string;
}> {
  const prisma = getPrisma();
  const image = await prisma.image.findUnique({ where: { id: imageId } });
  if (!image) throw new Error(`Image ${imageId} not found`);

  const imageRef = `${image.registry}/${image.repository}:${image.tag}`;

  const components: Record<string, unknown>[] = [
    {
      name: imageRef,
      version: image.tag,
      type: 'container',
      'bom-ref': crypto.randomUUID(),
      supplier: { name: image.registry },
      properties: [
        { name: 'fortifyci:imageId', value: image.id },
        { name: 'fortifyci:registry', value: image.registry },
        { name: 'fortifyci:digest', value: image.digest || '' },
      ],
    },
  ];

  const scans = await prisma.scan.findMany({
    where: { imageId, status: 'COMPLETED' },
    include: { vulnerabilities: { select: { packageName: true, packageVersion: true, packageType: true } } },
    orderBy: { createdAt: 'desc' },
    take: 1,
  });

  if (scans.length > 0) {
    const seen = new Set<string>();
    for (const v of scans[0]!.vulnerabilities) {
      const key = `${v.packageName}@${v.packageVersion}`;
      if (!seen.has(key)) {
        seen.add(key);
        components.push({
          name: v.packageName,
          version: v.packageVersion,
          type: v.packageType || 'library',
          'bom-ref': crypto.randomUUID(),
        });
      }
    }
  }

  const serialNumber = `urn:uuid:${crypto.randomUUID()}`;
  const content = {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    serialNumber,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: [{ vendor: 'FortifyCI', name: 'fortifyci', version: '1.0.0' }],
      component: components[0],
    },
    components,
  };

  logger.info({ imageId, componentCount: components.length }, 'CycloneDX SBOM generated');
  return {
    content,
    packageCount: components.length,
    version: '1.5',
  };
}
