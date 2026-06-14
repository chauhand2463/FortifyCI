import type { CreateWebhookDto, WebhookResponse, WebhookDeliveryResponse } from '../domain/webhook.types';
export declare class WebhookService {
    create(dto: CreateWebhookDto, userId: string): Promise<WebhookResponse>;
    findAll(): Promise<WebhookResponse[]>;
    findById(id: string): Promise<{
        webhook: WebhookResponse;
        deliveries: WebhookDeliveryResponse[];
    }>;
    update(id: string, dto: Partial<CreateWebhookDto>, userId: string): Promise<WebhookResponse>;
    delete(id: string, userId: string): Promise<void>;
    sendTest(id: string): Promise<{
        success: boolean;
        httpStatus: number | null;
    }>;
    deliverEvent(event: string, data: Record<string, unknown>): Promise<void>;
    private deliverWithRetry;
    private mapResponse;
}
export declare const webhookService: WebhookService;
//# sourceMappingURL=webhook.service.d.ts.map