export type PaymentProviderName =
  | 'stripe' | 'openpix' | 'asaas' | 'ifthenpay' | 'mercadopago' | 'manual';

export type PaymentMethod =
  | 'pix' | 'credit_card' | 'debit_card' | 'boleto' | 'mbway' | 'multibanco' | 'cash';

export type PaymentStatus =
  | 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'cancelled' | 'expired';

export interface Customer {
  name: string;
  email: string;
  document?: string;      // CPF/CNPJ/NIF
  phone?: string;
}

export interface CreatePaymentInput {
  orderId: string;
  orderNumber: number;
  amountCents: number;
  currency: 'BRL' | 'EUR';
  method: PaymentMethod;
  customer: Customer;
  description?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResult {
  providerPaymentId: string;
  providerReference?: string;
  status: PaymentStatus;
  qrCode?: string;        // copia-e-cola Pix
  qrCodeImage?: string;   // base64
  checkoutUrl?: string;   // redirect
  expiresAt?: Date;
  raw: unknown;
}

export interface WebhookEvent {
  providerEventId: string;
  eventType: string;
  providerPaymentId: string;
  status: PaymentStatus;
  paidAt?: Date;
  raw: unknown;
}

export interface PaymentProviderAdapter {
  readonly name: PaymentProviderName;
  createPayment(input: CreatePaymentInput): Promise<PaymentResult>;
  getPayment(providerPaymentId: string): Promise<PaymentResult>;
  refund?(providerPaymentId: string, amountCents?: number): Promise<PaymentResult>;
  verifyWebhook(rawBody: string, headers: Record<string, string>): boolean;
  parseWebhook(rawBody: string): WebhookEvent;
}