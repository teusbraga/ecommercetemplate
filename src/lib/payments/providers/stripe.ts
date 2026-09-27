import type { PaymentProviderAdapter, CreatePaymentInput, PaymentResult, WebhookEvent } from '../types';

export const stripeProvider: PaymentProviderAdapter = {
  name: 'stripe',

  async createPayment(_input: CreatePaymentInput): Promise<PaymentResult> {
    throw new Error('Stripe provider pendente de implementação no fork.');
  },

  async getPayment(_providerPaymentId: string): Promise<PaymentResult> {
    throw new Error('Stripe provider pendente de implementação no fork.');
  },

  verifyWebhook(_rawBody: string, _headers: Record<string, string>): boolean {
    return false;
  },

  parseWebhook(_rawBody: string): WebhookEvent {
    throw new Error('Stripe webhook parser pendente de implementação no fork.');
  },
};
