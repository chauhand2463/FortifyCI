export interface CreateWebhookDto {
  name: string;
  url: string;
  secret: string;
  events: string[];
}

export interface WebhookResponse {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastFiredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDeliveryResponse {
  id: string;
  event: string;
  httpStatus: number | null;
  responseBody: string | null;
  success: boolean;
  attemptCount: number;
  deliveredAt: string;
}
