import type { PaymentProviderAdapter, CreatePaymentInput, PaymentResult, WebhookEvent } from '../types';

export const mercadoPagoProvider: PaymentProviderAdapter = {
  name: 'mercadopago',

  async createPayment(_input: CreatePaymentInput): Promise<PaymentResult> {
    throw new Error('MercadoPago provider pendente de implementação no fork.');
  },

  async getPayment(_providerPaymentId: string): Promise<PaymentResult> {
    throw new Error('MercadoPago provider pendente de implementação no fork.');
  },

  verifyWebhook(_rawBody: string, _headers: Record<string, string>): boolean {
    return false;
  },

  parseWebhook(_rawBody: string): WebhookEvent {
    throw new Error('MercadoPago webhook parser pendente de implementação no fork.');
  },
};
