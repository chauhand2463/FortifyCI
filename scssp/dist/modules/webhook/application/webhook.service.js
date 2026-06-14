"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookService = exports.WebhookService = void 0;
const crypto = __importStar(require("crypto"));
const prisma_1 = require("@shared/database/prisma");
const env_1 = require("@shared/config/env");
const audit_service_1 = require("@modules/audit/application/audit.service");
const errors_1 = require("@shared/errors");
function encrypt(text) {
    const env = (0, env_1.getEnv)();
    const cipher = crypto.createCipheriv('aes-256-gcm', env.ENCRYPTION_KEY.slice(0, 32), crypto.randomBytes(16));
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}
function decrypt(encrypted) {
    const env = (0, env_1.getEnv)();
    const decipher = crypto.createDecipheriv('aes-256-gcm', env.ENCRYPTION_KEY.slice(0, 32), crypto.randomBytes(16));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
class WebhookService {
    async create(dto, userId) {
        const prisma = (0, prisma_1.getPrisma)();
        const webhook = await prisma.webhook.create({
            data: {
                name: dto.name,
                url: dto.url,
                secret: encrypt(dto.secret),
                events: dto.events,
            },
        });
        await audit_service_1.auditService.record({
            action: 'WEBHOOK_CREATED',
            entity: 'Webhook',
            entityId: webhook.id,
            description: `Webhook created: ${dto.name}`,
            userId,
        });
        return this.mapResponse(webhook);
    }
    async findAll() {
        const prisma = (0, prisma_1.getPrisma)();
        const webhooks = await prisma.webhook.findMany({ orderBy: { createdAt: 'desc' } });
        return webhooks.map((w) => this.mapResponse(w));
    }
    async findById(id) {
        const prisma = (0, prisma_1.getPrisma)();
        const webhook = await prisma.webhook.findUnique({
            where: { id },
            include: { deliveries: { orderBy: { deliveredAt: 'desc' }, take: 50 } },
        });
        if (!webhook)
            throw new errors_1.NotFoundError('Webhook', id);
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
    async update(id, dto, userId) {
        const prisma = (0, prisma_1.getPrisma)();
        const existing = await prisma.webhook.findUnique({ where: { id } });
        if (!existing)
            throw new errors_1.NotFoundError('Webhook', id);
        const data = {};
        if (dto.name)
            data.name = dto.name;
        if (dto.url)
            data.url = dto.url;
        if (dto.secret)
            data.secret = encrypt(dto.secret);
        if (dto.events)
            data.events = dto.events;
        const webhook = await prisma.webhook.update({ where: { id }, data });
        await audit_service_1.auditService.record({
            action: 'WEBHOOK_UPDATED',
            entity: 'Webhook',
            entityId: id,
            description: `Webhook updated: ${webhook.name}`,
            userId,
        });
        return this.mapResponse(webhook);
    }
    async delete(id, userId) {
        const prisma = (0, prisma_1.getPrisma)();
        const webhook = await prisma.webhook.findUnique({ where: { id } });
        if (!webhook)
            throw new errors_1.NotFoundError('Webhook', id);
        await prisma.webhook.delete({ where: { id } });
        await audit_service_1.auditService.record({
            action: 'WEBHOOK_DELETED',
            entity: 'Webhook',
            entityId: id,
            description: `Webhook deleted: ${webhook.name}`,
            userId,
        });
    }
    async sendTest(id) {
        const prisma = (0, prisma_1.getPrisma)();
        const webhook = await prisma.webhook.findUnique({ where: { id } });
        if (!webhook)
            throw new errors_1.NotFoundError('Webhook', id);
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
        }
        catch (error) {
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
    async deliverEvent(event, data) {
        const prisma = (0, prisma_1.getPrisma)();
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
            this.deliverWithRetry(webhook, event, payload).catch(() => { });
        }
    }
    async deliverWithRetry(webhook, event, payload, attempt = 1) {
        const prisma = (0, prisma_1.getPrisma)();
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
            }
            else if (attempt < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, backoff[attempt - 1]));
                return this.deliverWithRetry(webhook, event, payload, attempt + 1);
            }
        }
        catch {
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
    mapResponse(w) {
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
exports.WebhookService = WebhookService;
exports.webhookService = new WebhookService();
//# sourceMappingURL=webhook.service.js.map