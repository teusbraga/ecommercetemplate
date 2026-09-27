import type { PaymentProviderAdapter, CreatePaymentInput, PaymentResult, WebhookEvent } from '../types';

export const manualProvider: PaymentProviderAdapter = {
  name: 'manual',

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    return {
      providerPaymentId: `manual_${input.orderId}_${Date.now()}`,
      status: 'pending',
      raw: { note: 'Pagamento manual / dinheiro / balcão' },
    };
  },

  async getPayment(providerPaymentId: string): Promise<PaymentResult> {
    return {
      providerPaymentId,
      status: 'pending',
      raw: {},
    };
  },

  verifyWebhook(_rawBody: string, _headers: Record<string, string>): boolean {
    return true;
  },

  parseWebhook(_rawBody: string): WebhookEvent {
    return {
      providerEventId: `manual_evt_${Date.now()}`,
      eventType: 'payment.manual',
      providerPaymentId: '',
      status: 'pending',
      raw: {},
    };
  },
};
