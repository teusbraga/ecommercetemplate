'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useCart } from '@/lib/cart';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price_cents: number;
  description: string | null;
  currency: string;
}

interface Variant {
  id: string;
  sku: string;
  name: string;
  price_cents: number;
  attributes: Record<string, string>;
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    const supabase = createClient();
    async function loadProduct() {
      try {
        const { data: prodData } = await supabase
          .from('products')
          .select('id, name, slug, sku, price_cents, description, currency')
          .eq('slug', slug)
          .single();

        if (prodData) {
          setProduct(prodData);

          const { data: varData } = await supabase
            .from('product_variants')
            .select('id, sku, name, price_cents, attributes')
            .eq('product_id', prodData.id)
            .eq('is_active', true);

          if (varData && varData.length > 0) {
            setVariants(varData as Variant[]);
            setSelectedVariant(varData[0] as Variant);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar produto:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProduct();
  }, [slug]);

  if (isLoading) {
    return (
      <main style={{ maxWidth: 880, margin: '48px auto', padding: '0 20px', textAlign: 'center', color: '#71717a' }}>
        Carregando detalhes do produto...
      </main>
    );
  }

  if (!product) {
    return (
      <main style={{ maxWidth: 880, margin: '48px auto', padding: '0 20px', textAlign: 'center' }}>
        <h2>Produto não encontrado</h2>
        <p style={{ color: '#71717a' }}>O produto solicitado não existe ou foi desativado.</p>
        <Link href="/products" style={{ color: '#0070f3' }}>
          ← Voltar para catálogo
        </Link>
      </main>
    );
  }

  const currentPriceCents = selectedVariant ? selectedVariant.price_cents : product.price_cents;

  const handleAddToCart = () => {
    addItem({
      id: selectedVariant ? selectedVariant.id : product.id,
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      variantName: selectedVariant?.name,
      priceCents: currentPriceCents,
      quantity,
    });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/products" style={{ fontSize: 14, color: '#0070f3', textDecoration: 'none' }}>
          ← Voltar para todos os produtos
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40, alignItems: 'start' }}>
        {/* Placeholder de imagem */}
        <div
          style={{
            backgroundColor: '#f4f4f5',
            borderRadius: 12,
            aspectRatio: '1/1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            color: '#a1a1aa',
            border: '1px solid #e4e4e7',
          }}
        >
          📦
        </div>

        {/* Informações do Produto */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Badge variant="success">Em estoque</Badge>
            <span style={{ fontSize: 12, color: '#a1a1aa' }}>SKU: {selectedVariant?.sku ?? product.sku}</span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 12px', color: '#09090b' }}>
            {product.name}
          </h1>

          <div style={{ fontSize: 24, fontWeight: 700, color: '#09090b', marginBottom: 20 }}>
            R$ {(currentPriceCents / 100).toFixed(2)}
          </div>

          {product.description && (
            <div style={{ fontSize: 14, color: '#52525b', lineHeight: 1.6, marginBottom: 24 }}>
              {product.description}
            </div>
          )}

          {/* Variantes se houver */}
          {variants.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#3f3f46' }}>
                Opção / Variante:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      border: `1px solid ${selectedVariant?.id === v.id ? '#0070f3' : '#e4e4e7'}`,
                      backgroundColor: selectedVariant?.id === v.id ? '#eff6ff' : '#ffffff',
                      color: selectedVariant?.id === v.id ? '#0070f3' : '#18181b',
                    }}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantidade */}
          <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#3f3f46' }}>
              Quantidade:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d4d4d8', borderRadius: 6 }}>
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                style={{ padding: '6px 12px', border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                -
              </button>
              <span style={{ padding: '6px 12px', fontSize: 14, fontWeight: 600, minWidth: 24, textAlign: 'center' }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                style={{ padding: '6px 12px', border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                +
              </button>
            </div>
          </div>

          <Button
            size="lg"
            testId="detail-add-to-cart"
            onClick={handleAddToCart}
            style={{ width: '100%' }}
          >
            {addedFeedback ? '✓ Adicionado ao carrinho!' : 'Adicionar ao carrinho'}
          </Button>
        </div>
      </div>
    </main>
  );
}
