'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { Button } from '@/components/ui/Button';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, subtotalCents, totalItems } = useCart();

  if (items.length === 0) {
    return (
      <main style={{ maxWidth: 640, margin: '64px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🛒</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 12px', color: '#09090b' }}>
          Seu carrinho está vazio
        </h1>
        <p style={{ color: '#71717a', fontSize: 15, margin: '0 0 24px' }}>
          Nenhum item adicionado ainda. Explore nosso catálogo e encontre os melhores produtos!
        </p>
        <Link
          href="/products"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#0070f3',
            color: '#ffffff',
            borderRadius: 6,
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          Explorar Produtos →
        </Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: '#09090b' }}>
          Carrinho de Compras ({totalItems} {totalItems === 1 ? 'item' : 'itens'})
        </h1>
        <button
          onClick={clearCart}
          style={{
            background: 'none',
            border: 'none',
            color: '#ef4444',
            fontSize: 13,
            cursor: 'pointer',
            padding: 4,
          }}
        >
          Esvaziar carrinho
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, alignItems: 'start' }}>
        {/* Lista de itens */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {items.map((item) => (
            <div
              key={item.id}
              data-testid={`cart-item-${item.id}`}
              style={{
                border: '1px solid #e4e4e7',
                borderRadius: 8,
                padding: 16,
                backgroundColor: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600 }}>{item.name}</h3>
                {item.variantName && (
                  <span style={{ fontSize: 12, color: '#71717a', display: 'block', marginBottom: 4 }}>
                    Opção: {item.variantName}
                  </span>
                )}
                <span style={{ fontSize: 14, fontWeight: 600, color: '#09090b' }}>
                  R$ {(item.priceCents / 100).toFixed(2)}
                </span>
              </div>

              {/* Quantidade */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d4d4d8', borderRadius: 6 }}>
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    style={{ padding: '4px 10px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  >
                    -
                  </button>
                  <span style={{ padding: '4px 8px', fontSize: 13, fontWeight: 600 }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    style={{ padding: '4px 10px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  aria-label="Remover item"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#a1a1aa',
                    cursor: 'pointer',
                    fontSize: 16,
                    padding: 4,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Resumo do pedido */}
        <div
          style={{
            border: '1px solid #e4e4e7',
            borderRadius: 8,
            padding: 24,
            backgroundColor: '#fafafa',
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 16px', color: '#09090b' }}>
            Resumo do Pedido
          </h2>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14, color: '#52525b' }}>
            <span>Subtotal</span>
            <span data-testid="cart-subtotal">R$ {(subtotalCents / 100).toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 14, color: '#52525b' }}>
            <span>Frete estimado</span>
            <span style={{ color: '#047857', fontWeight: 500 }}>Grátis</span>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e4e4e7', margin: '16px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, fontSize: 18, fontWeight: 700, color: '#09090b' }}>
            <span>Total</span>
            <span data-testid="cart-total">R$ {(subtotalCents / 100).toFixed(2)}</span>
          </div>

          <Link href="/checkout" style={{ textDecoration: 'none' }}>
            <Button size="lg" testId="checkout-btn" style={{ width: '100%' }}>
              Prosseguir para o Checkout →
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
