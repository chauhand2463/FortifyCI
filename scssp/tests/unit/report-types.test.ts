import { describe, it, expect } from 'vitest';
import { createReportSchema, reportQuerySchema } from '@modules/report/domain/report.types';

describe('Report Types - createReportSchema', () => {
  it('should accept valid minimal payload', () => {
    const result = createReportSchema.safeParse({ title: 'Test Report' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Test Report');
      expect(result.data.format).toBe('PDF');
    }
  });

  it('should accept CSV format', () => {
    const result = createReportSchema.safeParse({ title: 'CSV Export', format: 'CSV' });
    expect(result.success).toBe(true);
  });

  it('should accept JSON format', () => {
    const result = createReportSchema.safeParse({ title: 'JSON Export', format: 'JSON' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid format', () => {
    const result = createReportSchema.safeParse({ title: 'Bad', format: 'XML' });
    expect(result.success).toBe(false);
  });

  it('should reject empty title', () => {
    const result = createReportSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('should accept optional scanId as UUID', () => {
    const result = createReportSchema.safeParse({
      title: 'Test',
      scanId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('should reject non-UUID scanId', () => {
    const result = createReportSchema.safeParse({
      title: 'Test',
      scanId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('should accept parameters with severityFilter', () => {
    const result = createReportSchema.safeParse({
      title: 'Filtered Report',
      parameters: {
        severityFilter: ['CRITICAL', 'HIGH'],
        includeVulnerabilities: true,
      },
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid severity values', () => {
    const result = createReportSchema.safeParse({
      title: 'Bad Filter',
      parameters: { severityFilter: ['INVALID'] },
    });
    expect(result.success).toBe(false);
  });

  it('should accept parameters with dateRange', () => {
    const result = createReportSchema.safeParse({
      title: 'Date Range',
      parameters: {
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-12-31T23:59:59Z',
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it('should reject title longer than 255 characters', () => {
    const result = createReportSchema.safeParse({ title: 'A'.repeat(256) });
    expect(result.success).toBe(false);
  });
});

describe('Report Types - reportQuerySchema', () => {
  it('should apply defaults', () => {
    const result = reportQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.format).toBeUndefined();
      expect(result.data.status).toBeUndefined();
    }
  });

  it('should coerce page and limit to numbers', () => {
    const result = reportQuerySchema.safeParse({ page: '2', limit: '10' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(10);
    }
  });

  it('should accept format filter', () => {
    const result = reportQuerySchema.safeParse({ format: 'PDF' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid format filter', () => {
    const result = reportQuerySchema.safeParse({ format: 'DOCX' });
    expect(result.success).toBe(false);
  });
});
