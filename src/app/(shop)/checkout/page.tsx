'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

interface PixResult {
  orderId: string;
  orderNumber: number;
  qrCode?: string;
  qrCodeImage?: string;
  status: string;
  amountCents: number;
}

export default function CheckoutPage() {
  const { items, subtotalCents, clearCart } = useCart();

  // Form states
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    document: '',
    phone: '',
  });

  const [address, setAddress] = useState({
    street: '',
    number: '',
    complement: '',
    city: '',
    state: '',
    postalCode: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pixData, setPixData] = useState<PixResult | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [copied, setCopied] = useState(false);

  // Polling para verificar se o pagamento foi confirmado via webhook
  useEffect(() => {
    if (!pixData || isPaid) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${pixData.orderId}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'paid' || data.paymentStatus === 'paid') {
            setIsPaid(true);
            clearCart();
            clearInterval(interval);
          }
        }
      } catch (e) {
        console.error('Erro no polling de status:', e);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [pixData, isPaid, clearCart]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customer.name.trim() || !customer.email.trim()) {
      setErrorMsg('Por favor preencha nome e email.');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Seu carrinho está vazio.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer,
          shippingAddress: address,
          items,
          method: paymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Falha ao processar checkout');
      }

      setPixData(data);
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Erro ao processar pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyPixCode = () => {
    if (pixData?.qrCode) {
      navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // 1. Tela de Sucesso após pagamento confirmado
  if (isPaid && pixData) {
    return (
      <main style={{ maxWidth: 640, margin: '64px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <Badge variant="success">Pagamento Confirmado</Badge>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '16px 0 8px', color: '#09090b' }}>
          Obrigado pela compra!
        </h1>
        <p style={{ color: '#52525b', fontSize: 15, margin: '0 0 24px' }}>
          Seu pedido <strong>#{pixData.orderNumber}</strong> foi pago e já está sendo preparado para envio.
        </p>

        <div style={{ backgroundColor: '#f4f4f5', borderRadius: 8, padding: 20, marginBottom: 32, textAlign: 'left' }}>
          <p style={{ margin: '0 0 8px', fontSize: 14 }}><strong>Valor pago:</strong> R$ {(pixData.amountCents / 100).toFixed(2)}</p>
          <p style={{ margin: '0 0 8px', fontSize: 14 }}><strong>E-mail de confirmação:</strong> {customer.email}</p>
          <p style={{ margin: 0, fontSize: 14 }}><strong>Status:</strong> Pronto para envio</p>
        </div>

        <Link href="/products" style={{ textDecoration: 'none' }}>
          <Button size="lg">Continuar Comprando</Button>
        </Link>
      </main>
    );
  }

  // 2. Tela de Pagamento Pix (QR Code + Copia e Cola)
  if (pixData) {
    return (
      <main style={{ maxWidth: 640, margin: '40px auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Badge variant="warning">Aguardando Pagamento Pix</Badge>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: '12px 0 6px', color: '#09090b' }}>
            Pedido #{pixData.orderNumber}
          </h1>
          <p style={{ color: '#71717a', fontSize: 14, margin: 0 }}>
            Total a pagar: <strong>R$ {(pixData.amountCents / 100).toFixed(2)}</strong>
          </p>
        </div>

        <div
          style={{
            border: '1px solid #e4e4e7',
            borderRadius: 12,
            padding: 24,
            backgroundColor: '#ffffff',
            textAlign: 'center',
          }}
        >
          <div style={{ margin: '16px auto', display: 'flex', justifyContent: 'center' }}>
            {pixData.qrCodeImage ? (
              <img
                src={pixData.qrCodeImage}
                alt="QR Code Pix"
                style={{ width: 220, height: 220, borderRadius: 8 }}
              />
            ) : (
              <div
                style={{
                  width: 220,
                  height: 220,
                  border: '2px dashed #0070f3',
                  borderRadius: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f8fafc',
                  padding: 16,
                  boxSizing: 'border-box',
                }}
              >
                <span style={{ fontSize: 36, marginBottom: 8 }}>📱</span>
                <span style={{ fontSize: 12, color: '#0070f3', fontWeight: 600 }}>
                  Pix Copia e Cola Pronto
                </span>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: '#52525b', margin: '0 0 12px' }}>
              Copie a chave Pix abaixo e pague no app do seu banco:
            </p>
            <textarea
              readOnly
              value={pixData.qrCode ?? ''}
              rows={3}
              style={{
                width: '100%',
                padding: 10,
                fontSize: 12,
                borderRadius: 6,
                border: '1px solid #d4d4d8',
                backgroundColor: '#f4f4f5',
                color: '#18181b',
                boxSizing: 'border-box',
                fontFamily: 'monospace',
                resize: 'none',
              }}
            />
          </div>

          <Button
            size="md"
            onClick={copyPixCode}
            style={{ width: '100%', marginBottom: 16 }}
          >
            {copied ? '✓ Código Pix Copiado!' : '📋 Copiar Código Pix'}
          </Button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 13,
              color: '#71717a',
            }}
          >
            <Spinner size={14} />
            <span>Aguardando confirmação do pagamento...</span>
          </div>
        </div>
      </main>
    );
  }

  // 3. Formulário de Checkout
  if (items.length === 0) {
    return (
      <main style={{ maxWidth: 640, margin: '64px auto', padding: '0 20px', textAlign: 'center' }}>
        <h2>Seu carrinho está vazio</h2>
        <p style={{ color: '#71717a' }}>Adicione produtos antes de finalizar o pedido.</p>
        <Link href="/products" style={{ color: '#0070f3' }}>
          ← Ir para produtos
        </Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 20px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 24px', color: '#09090b' }}>
        Finalizar Pedido
      </h1>

      {errorMsg && (
        <div
          style={{
            padding: 12,
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: 6,
            marginBottom: 20,
            fontSize: 14,
          }}
        >
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, alignItems: 'start' }}>
          {/* Coluna 1: Dados do Cliente e Endereço */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Identificação */}
            <div style={{ border: '1px solid #e4e4e7', borderRadius: 8, padding: 20, backgroundColor: '#ffffff' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', color: '#09090b' }}>
                1. Seus Dados
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Input
                  label="Nome completo *"
                  required
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  testId="checkout-name"
                />
                <Input
                  label="E-mail *"
                  type="email"
                  required
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  testId="checkout-email"
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Input
                    label="CPF / NIF"
                    value={customer.document}
                    onChange={(e) => setCustomer({ ...customer, document: e.target.value })}
                    testId="checkout-doc"
                  />
                  <Input
                    label="Telefone / WhatsApp"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    testId="checkout-phone"
                  />
                </div>
              </div>
            </div>

            {/* Endereço de Entrega */}
            <div style={{ border: '1px solid #e4e4e7', borderRadius: 8, padding: 20, backgroundColor: '#ffffff' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', color: '#09090b' }}>
                2. Endereço de Entrega
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                  <Input
                    label="Rua / Logradouro"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  />
                  <Input
                    label="Número"
                    value={address.number}
                    onChange={(e) => setAddress({ ...address, number: e.target.value })}
                  />
                </div>
                <Input
                  label="Complemento (Apto, bloco)"
                  value={address.complement}
                  onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
                  <Input
                    label="Cidade"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  />
                  <Input
                    label="Estado"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  />
                  <Input
                    label="CEP"
                    value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Método de Pagamento */}
            <div style={{ border: '1px solid #e4e4e7', borderRadius: 8, padding: 20, backgroundColor: '#ffffff' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', color: '#09090b' }}>
                3. Forma de Pagamento
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    borderRadius: 6,
                    border: `1px solid ${paymentMethod === 'pix' ? '#0070f3' : '#e4e4e7'}`,
                    backgroundColor: paymentMethod === 'pix' ? '#f0f9ff' : '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="method"
                    value="pix"
                    checked={paymentMethod === 'pix'}
                    onChange={() => setPaymentMethod('pix')}
                  />
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>⚡ Pix (Instantâneo)</span>
                    <span style={{ display: 'block', fontSize: 12, color: '#64748b' }}>
                      Liberação imediata do pedido com QR Code
                    </span>
                  </div>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    borderRadius: 6,
                    border: `1px solid ${paymentMethod === 'credit_card' ? '#0070f3' : '#e4e4e7'}`,
                    backgroundColor: paymentMethod === 'credit_card' ? '#f0f9ff' : '#ffffff',
                    cursor: 'pointer',
                    opacity: 0.8,
                  }}
                >
                  <input
                    type="radio"
                    name="method"
                    value="credit_card"
                    checked={paymentMethod === 'credit_card'}
                    onChange={() => setPaymentMethod('credit_card')}
                  />
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>💳 Cartão de Crédito</span>
                    <span style={{ display: 'block', fontSize: 12, color: '#64748b' }}>
                      Até 12x sem juros (via Stripe / Mercado Pago)
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Coluna 2: Resumo do Pedido */}
          <div
            style={{
              border: '1px solid #e4e4e7',
              borderRadius: 8,
              padding: 24,
              backgroundColor: '#fafafa',
              position: 'sticky',
              top: 80,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 16px', color: '#09090b' }}>
              Resumo do Pedido
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {items.map((i) => (
                <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: '#52525b' }}>
                    {i.quantity}x {i.name} {i.variantName ? `(${i.variantName})` : ''}
                  </span>
                  <span style={{ fontWeight: 500 }}>
                    R$ {((i.priceCents * i.quantity) / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e4e4e7', margin: '16px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14, color: '#52525b' }}>
              <span>Subtotal</span>
              <span>R$ {(subtotalCents / 100).toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 14, color: '#52525b' }}>
              <span>Frete</span>
              <span style={{ color: '#047857', fontWeight: 500 }}>Grátis</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, fontSize: 18, fontWeight: 700, color: '#09090b' }}>
              <span>Total</span>
              <span>R$ {(subtotalCents / 100).toFixed(2)}</span>
            </div>

            <Button
              type="submit"
              size="lg"
              isLoading={isSubmitting}
              testId="submit-checkout"
              style={{ width: '100%' }}
            >
              Confirmar e Gerar Pix →
            </Button>
          </div>
        </div>
      </form>
    </main>
  );
}
