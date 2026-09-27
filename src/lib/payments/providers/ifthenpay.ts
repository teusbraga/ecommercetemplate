import type { PaymentProviderAdapter, CreatePaymentInput, PaymentResult, WebhookEvent } from '../types';

export const ifthenpayProvider: PaymentProviderAdapter = {
  name: 'ifthenpay',

  async createPayment(_input: CreatePaymentInput): Promise<PaymentResult> {
    throw new Error('IfThenPay provider pendente de implementação no fork.');
  },

  async getPayment(_providerPaymentId: string): Promise<PaymentResult> {
    throw new Error('IfThenPay provider pendente de implementação no fork.');
  },

  verifyWebhook(_rawBody: string, _headers: Record<string, string>): boolean {
    return false;
  },

  parseWebhook(_rawBody: string): WebhookEvent {
    throw new Error('IfThenPay webhook parser pendente de implementação no fork.');
  },
};
