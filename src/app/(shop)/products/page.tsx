'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/Modal';
import { useCart } from '@/lib/cart';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Product = {
  id: string;
  name: string;
  slug: string;
  price_cents: number;
  description?: string | null;
  currency?: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('products')
          .select('id, name, slug, price_cents, description, currency')
          .eq('is_active', true);

        if (error) console.error('Erro ao buscar produtos:', error);
        setProducts(data ?? []);
      } catch (err) {
        console.error('Erro inesperado:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const query = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
    );
  }, [products, search]);

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      priceCents: product.price_cents,
      quantity: 1,
    });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ marginBottom: 28, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 6px', color: '#09090b' }}>
            Catálogo de Produtos
          </h1>
          <p style={{ margin: 0, color: '#71717a', fontSize: 14 }}>
            Explore nossos produtos disponíveis para entrega imediata
          </p>
        </div>

        <div style={{ width: 280 }}>
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            testId="search-input"
          />
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#71717a' }}>
          Carregando catálogo...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div
          style={{
            padding: 48,
            textAlign: 'center',
            backgroundColor: '#fafafa',
            borderRadius: 8,
            border: '1px dashed #d4d4d8',
            color: '#71717a',
          }}
        >
          {search ? 'Nenhum produto encontrado para a busca.' : 'Nenhum produto cadastrado.'}
        </div>
      ) : (
        <ul
          data-testid="product-list"
          style={{
            display: 'grid',
            gap: 20,
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            listStyle: 'none',
            padding: 0,
            margin: 0,
          }}
        >
          {filteredProducts.map((p) => (
            <li
              key={p.id}
              style={{
                border: '1px solid #e4e4e7',
                padding: 16,
                borderRadius: 8,
                backgroundColor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: '#09090b' }}>
                  {p.name}
                </h3>
                {p.description && (
                  <p style={{ fontSize: 13, color: '#71717a', margin: '0 0 12px', lineHeight: 1.4 }}>
                    {p.description}
                  </p>
                )}
              </div>

              <div>
                <p style={{ fontWeight: 700, fontSize: 16, color: '#09090b', margin: '0 0 12px' }}>
                  R$ {(p.price_cents / 100).toFixed(2)}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    data-testid={`product-view-${p.slug}`}
                    onClick={() => {
                      setSelected(p);
                      setAddedFeedback(false);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      backgroundColor: '#f4f4f5',
                      border: '1px solid #e4e4e7',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Ver
                  </button>
                  <Link
                    href={`/products/${p.slug}`}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'transparent',
                      border: '1px solid #d4d4d8',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 500,
                      textDecoration: 'none',
                      color: '#18181b',
                    }}
                  >
                    Página
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal compatível com teste Playwright / Selenium */}
      <Modal
        open={!!selected}
        onClose={() => {
          setSelected(null);
          setAddedFeedback(false);
        }}
        title={selected?.name ?? ''}
        testId="product-modal"
      >
        {selected && (
          <div>
            <p style={{ fontSize: 15, margin: '0 0 16px', color: '#18181b' }}>
              Preço: R$ {(selected.price_cents / 100).toFixed(2)}
            </p>
            {selected.description && (
              <p style={{ fontSize: 13, color: '#71717a', margin: '0 0 20px', lineHeight: 1.5 }}>
                {selected.description}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Button
                testId="add-to-cart"
                onClick={() => handleAddToCart(selected)}
              >
                {addedFeedback ? '✓ Adicionado ao carrinho!' : 'Adicionar ao carrinho'}
              </Button>

              <Link
                href={`/products/${selected.slug}`}
                onClick={() => setSelected(null)}
                style={{
                  textAlign: 'center',
                  fontSize: 13,
                  color: '#0070f3',
                  textDecoration: 'none',
                }}
              >
                Ver página completa do produto →
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}