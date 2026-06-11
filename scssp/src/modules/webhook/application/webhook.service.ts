import * as crypto from 'crypto';
import { getPrisma } from '@shared/database/prisma';
import { getEnv } from '@shared/config/env';
import { auditService } from '@modules/audit/application/audit.service';
import { NotFoundError, ValidationError } from '@shared/errors';
import type { CreateWebhookDto, WebhookResponse, WebhookDeliveryResponse } from '../domain/webhook.types';

function encrypt(text: string): string {
  const env = getEnv();
  const cipher = crypto.createCipheriv('aes-256-gcm', env.ENCRYPTION_KEY.slice(0, 32), crypto.randomBytes(16));
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encrypted: string): string {
  const env = getEnv();
  const decipher = crypto.createDecipheriv('aes-256-gcm', env.ENCRYPTION_KEY.slice(0, 32), crypto.randomBytes(16));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export class WebhookService {
  async create(dto: CreateWebhookDto, userId: string): Promise<WebhookResponse> {
    const prisma = getPrisma();
    const webhook = await prisma.webhook.create({
      data: {
        name: dto.name,
        url: dto.url,
        secret: encrypt(dto.secret),
        events: dto.events,
      },
    });

    await auditService.record({
      action: 'WEBHOOK_CREATED',
      entity: 'Webhook',
      entityId: webhook.id,
      description: `Webhook created: ${dto.name}`,
      userId,
    });

    return this.mapResponse(webhook);
  }

  async findAll(): Promise<WebhookResponse[]> {
    const prisma = getPrisma();
    const webhooks = await prisma.webhook.findMany({ orderBy: { createdAt: 'desc' } });
    return webhooks.map((w) => this.mapResponse(w));
  }

  async findById(id: string): Promise<{ webhook: WebhookResponse; deliveries: WebhookDeliveryResponse[] }> {
    const prisma = getPrisma();
    const webhook = await prisma.webhook.findUnique({
      where: { id },
      include: { deliveries: { orderBy: { deliveredAt: 'desc' }, take: 50 } },
    });
    if (!webhook) throw new NotFoundError('Webhook', id);
    return {
      webhook: this.mapResponse(webhook),
      deliveries: webhook.deliveries.map((d) => ({
        id: d.id,
        event: d.event,
        httpStatus: d.httpStatus,
        responseBody: d.responseBody,
        success: d.success,
        attemptCount: d.attemptCount,
        deliveredAt: d.deliveredAt.toISOString(),
      })),
    };
  }

  async update(id: string, dto: Partial<CreateWebhookDto>, userId: string): Promise<WebhookResponse> {
    const prisma = getPrisma();
    const existing = await prisma.webhook.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Webhook', id);

    const data: Record<string, unknown> = {};
    if (dto.name) data.name = dto.name;
    if (dto.url) data.url = dto.url;
    if (dto.secret) data.secret = encrypt(dto.secret);
    if (dto.events) data.events = dto.events;

    const webhook = await prisma.webhook.update({ where: { id }, data });

    await auditService.record({
      action: 'WEBHOOK_UPDATED',
      entity: 'Webhook',
      entityId: id,
      description: `Webhook updated: ${webhook.name}`,
      userId,
    });

    return this.mapResponse(webhook);
  }

  async delete(id: string, userId: string): Promise<void> {
    const prisma = getPrisma();
    const webhook = await prisma.webhook.findUnique({ where: { id } });
    if (!webhook) throw new NotFoundError('Webhook', id);

    await prisma.webhook.delete({ where: { id } });

    await auditService.record({
      action: 'WEBHOOK_DELETED',
      entity: 'Webhook',
      entityId: id,
      description: `Webhook deleted: ${webhook.name}`,
      userId,
    });
  }

  async sendTest(id: string): Promise<{ success: boolean; httpStatus: number | null }> {
    const prisma = getPrisma();
    const webhook = await prisma.webhook.findUnique({ where: { id } });
    if (!webhook) throw new NotFoundError('Webhook', id);

    const payload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      fortifyci_version: '2.0.0',
      data: { message: 'This is a test webhook delivery from FortifyCI' },
    };

    try {
      const signature = crypto.createHmac('sha256', decrypt(webhook.secret)).update(JSON.stringify(payload)).digest('hex');

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-FortifyCI-Signature': `sha256=${signature}`,
        },
        body: JSON.stringify(payload),
      });

      await prisma.webhookDelivery.create({
        data: {
          webhookId: id,
          event: 'test',
          payload,
          httpStatus: response.status,
          responseBody: (await response.text()).slice(0, 500),
          success: response.ok,
          attemptCount: 1,
        },
      });

      await prisma.webhook.update({ where: { id }, data: { lastFiredAt: new Date() } });

      return { success: response.ok, httpStatus: response.status };
    } catch (error: any) {
      await prisma.webhookDelivery.create({
        data: {
          webhookId: id,
          event: 'test',
          payload,
          httpStatus: null,
          responseBody: error.message?.slice(0, 500) || 'Delivery failed',
          success: false,
          attemptCount: 1,
        },
      });

      return { success: false, httpStatus: null };
    }
  }

  async deliverEvent(event: string, data: Record<string, unknown>): Promise<void> {
    const prisma = getPrisma();
    const webhooks = await prisma.webhook.findMany({
      where: { isActive: true, events: { has: event } },
    });

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      fortifyci_version: '2.0.0',
      data,
    };

    for (const webhook of webhooks) {
      this.deliverWithRetry(webhook, event, payload).catch(() => {});
    }
  }

  private async deliverWithRetry(webhook: any, event: string, payload: any, attempt: number = 1): Promise<void> {
    const prisma = getPrisma();
    const maxAttempts = 3;
    const backoff = [5000, 25000, 125000];

    try {
      const signature = crypto.createHmac('sha256', decrypt(webhook.secret)).update(JSON.stringify(payload)).digest('hex');

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-FortifyCI-Signature': `sha256=${signature}`,
        },
        body: JSON.stringify(payload),
      });

      await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event,
          payload,
          httpStatus: response.status,
          responseBody: (await response.text()).slice(0, 500),
          success: response.ok,
          attemptCount: attempt,
        },
      });

      if (response.ok) {
        await prisma.webhook.update({ where: { id: webhook.id }, data: { lastFiredAt: new Date() } });
      } else if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, backoff[attempt - 1]));
        return this.deliverWithRetry(webhook, event, payload, attempt + 1);
      }
    } catch {
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, backoff[attempt - 1]));
        return this.deliverWithRetry(webhook, event, payload, attempt + 1);
      }

      await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event,
          payload,
          httpStatus: null,
          responseBody: 'Max retries exceeded',
          success: false,
          attemptCount: attempt,
        },
      });
    }
  }

  private mapResponse(w: any): WebhookResponse {
    return {
      id: w.id,
      name: w.name,
      url: w.url,
      events: w.events,
      isActive: w.isActive,
      lastFiredAt: w.lastFiredAt?.toISOString() || null,
      createdAt: w.createdAt?.toISOString() || '',
      updatedAt: w.updatedAt?.toISOString() || '',
    };
  }
}

export const webhookService = new WebhookService();
