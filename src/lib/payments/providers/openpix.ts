import { createHmac, timingSafeEqual } from 'crypto';
import type {
  PaymentProviderAdapter, CreatePaymentInput, PaymentResult, WebhookEvent,
} from '../types';

const BASE = 'https://api.openpix.com.br/api/v1';

export const openpixProvider: PaymentProviderAdapter = {
  name: 'openpix',

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    const res = await fetch(`${BASE}/charge`, {
      method: 'POST',
      headers: {
        Authorization: process.env.OPENPIX_APP_ID!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        correlationID: input.orderId,
        value: input.amountCents,
        comment: input.description ?? `Pedido #${input.orderNumber}`,
        customer: {
          name: input.customer.name,
          email: input.customer.email,
          taxID: input.customer.document,
        },
      }),
    });
    if (!res.ok) throw new Error(`OpenPix erro: ${res.status}`);
    const data = await res.json();
    const charge = data.charge;

    return {
      providerPaymentId: charge.identifier,
      providerReference: charge.correlationID,
      status: 'pending',
      qrCode: charge.brCode,
      qrCodeImage: charge.qrCodeImage,
      expiresAt: charge.expiresDate ? new Date(charge.expiresDate) : undefined,
      raw: data,
    };
  },

  async getPayment(providerPaymentId: string): Promise<PaymentResult> {
    const res = await fetch(`${BASE}/charge/${providerPaymentId}`, {
      headers: { Authorization: process.env.OPENPIX_APP_ID! },
    });
    if (!res.ok) throw new Error(`OpenPix erro: ${res.status}`);
    const data = await res.json();
    return {
      providerPaymentId: data.charge.identifier,
      status: data.charge.status === 'COMPLETED' ? 'paid' : 'pending',
      raw: data,
    };
  },

  verifyWebhook(rawBody, headers) {
    const signature = headers['x-webhook-signature'];
    if (!signature || !process.env.OPENPIX_WEBHOOK_SECRET) return false;
    const expected = createHmac('sha1', process.env.OPENPIX_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');
    try {
      return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  },

  parseWebhook(rawBody): WebhookEvent {
    const body = JSON.parse(rawBody);
    const charge = body.charge ?? body.pix?.[0];
    const paid = charge?.status === 'COMPLETED';
    return {
      providerEventId: body.event ?? charge?.identifier,
      eventType: body.event ?? 'charge.updated',
      providerPaymentId: charge?.identifier,
      status: paid ? 'paid' : 'pending',
      paidAt: paid ? new Date() : undefined,
      raw: body,
    };
  },
};