import type { PaymentProviderAdapter, PaymentProviderName } from './types';
import { stripeProvider } from './providers/stripe';
import { openpixProvider } from './providers/openpix';
import { asaasProvider } from './providers/asaas';
import { ifthenpayProvider } from './providers/ifthenpay';
import { mercadoPagoProvider } from './providers/mercadopago';
import { manualProvider } from './providers/manual';

const registry: Record<PaymentProviderName, PaymentProviderAdapter> = {
  stripe: stripeProvider,
  openpix: openpixProvider,
  asaas: asaasProvider,
  ifthenpay: ifthenpayProvider,
  mercadopago: mercadoPagoProvider,
  manual: manualProvider,
};

export function getPaymentProvider(name: PaymentProviderName): PaymentProviderAdapter {
  const p = registry[name];
  if (!p) throw new Error(`Payment provider não suportado: ${name}`);
  return p;
}

export * from './types';