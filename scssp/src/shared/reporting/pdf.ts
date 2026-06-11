import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import { getEnv } from '@shared/config/env';
import { getPrisma } from '@shared/database/prisma';
import { getLogger } from '@shared/utils/logger';
import { ensureBucket, uploadFile } from '@shared/storage/minio';
import fs from 'fs';
import os from 'os';
import path from 'path';

const logger = getLogger();

export async function generatePdfReport(
  title: string,
  scanId: string | null,
  imageId: string | null,
  parameters?: Record<string, unknown>,
): Promise<{ filePath: string; fileSize: number }> {
  const prisma = getPrisma();
  const env = getEnv();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fortifyci-'));
  const reportId = crypto.randomUUID();
  const tmpPath = path.join(tmpDir, `${reportId}.pdf`);

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title: title,
      Creator: 'FortifyCI',
      Producer: 'FortifyCI Report Generator',
    },
  });

  const stream = fs.createWriteStream(tmpPath);
  doc.pipe(stream);

  doc.fontSize(24).font('Helvetica-Bold').text('FortifyCI', { align: 'center' });
  doc.fontSize(16).font('Helvetica').text('Security Scan Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).fillColor('#666').text(`Generated: ${new Date().toISOString()}`, { align: 'center' });
  doc.moveDown(2);

  doc.fontSize(14).font('Helvetica-Bold').fillColor('#333').text(title);
  doc.moveDown();

  const scan = scanId
    ? await prisma.scan.findUnique({
        where: { id: scanId },
        include: { image: true, vulnerabilities: true },
      })
    : await prisma.scan.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { image: true, vulnerabilities: true },
      });

  if (scan) {
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#333').text('Scan Information');
      doc.fontSize(10).font('Helvetica').fillColor('#555');
      doc.text(`Image: ${scan.imageRef}`);
      doc.text(`Status: ${scan.status}`);
      doc.text(`Scan Type: ${scan.scanType}`);
      doc.text(`Started: ${scan.startedAt?.toISOString() || 'N/A'}`);
      doc.text(`Completed: ${scan.completedAt?.toISOString() || 'N/A'}`);
      doc.moveDown();

      const severityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 };
      for (const v of scan.vulnerabilities) {
        severityCounts[v.severity as keyof typeof severityCounts]++;
      }

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#333').text('Vulnerability Summary');
      doc.moveDown(0.5);

      const tableTop = doc.y;
      const colWidths = [200, 80];
      const headers = ['Severity', 'Count'];
      const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'];
      const severityColors: Record<string, string> = {
        CRITICAL: '#d93025', HIGH: '#ea8600', MEDIUM: '#e8a700', LOW: '#5f6368', UNKNOWN: '#999',
      };

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#333');
      let xPos = 50;
      for (let i = 0; i < headers.length; i++) {
        doc.text(headers[i]!, xPos, doc.y, { width: colWidths[i]!, align: 'left' });
        xPos += colWidths[i]!;
      }
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(50 + colWidths[0]! + colWidths[1]!, doc.y).stroke('#ccc');

      for (const sev of severityOrder) {
        const count = severityCounts[sev as keyof typeof severityCounts]!;
        if (count === 0) continue;
        doc.fontSize(10).font('Helvetica').fillColor(severityColors[sev as keyof typeof severityColors] || '#333');
        xPos = 50;
        doc.text(sev, xPos, doc.y + 2, { width: colWidths[0]!, align: 'left' });
        xPos += colWidths[0]!;
        doc.text(String(count), xPos, doc.y - 10, { width: colWidths[1]!, align: 'left' });
        doc.moveDown(0.3);
      }

      doc.moveDown();
      const total = Object.values(severityCounts).reduce((a, b) => a + b, 0);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#333');
      doc.text(`Total Vulnerabilities: ${total}`, 50, doc.y + 5);
      doc.moveDown(2);

      if (scan.vulnerabilities.length > 0) {
        if (doc.y > 700) doc.addPage();
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#333').text('Vulnerability Details');
        doc.moveDown(0.5);

        for (const v of scan.vulnerabilities.slice(0, 50)) {
          if (doc.y > 720) doc.addPage();
          doc.fontSize(9).font('Helvetica-Bold').fillColor('#333');
          doc.text(`${v.vulnerabilityId} - ${v.packageName}@${v.packageVersion}`);
          doc.fontSize(8).font('Helvetica').fillColor('#666');
          doc.text(`Severity: ${v.severity} | CVSS: ${v.cvssScore || 'N/A'} | Fixed: ${v.fixedVersion || 'N/A'}`);
          if (v.title) doc.text(v.title);
          doc.moveDown(0.3);
          doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#eee');
          doc.moveDown(0.3);
        }
      }
  }

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', async () => {
      try {
        await ensureBucket();
        const objectName = `reports/${reportId}.pdf`;
        const buffer = fs.readFileSync(tmpPath);
        await uploadFile(objectName, buffer, buffer.length, 'application/pdf');
        fs.rmSync(tmpDir, { recursive: true, force: true });
        logger.info({ objectName, fileSize: buffer.length }, 'PDF report uploaded to MinIO');
        resolve({ filePath: objectName, fileSize: buffer.length });
      } catch (err) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        reject(err);
      }
    });
    stream.on('error', (err) => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      reject(err);
    });
  });
}
