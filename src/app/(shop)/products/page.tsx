'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/Modal';

type Product = { id: string; name: string; slug: string; price_cents: number };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('products').select('id,name,slug,price_cents').eq('is_active', true)
      .then(({ data, error }) => {
        if (error) console.error('Erro ao buscar produtos:', error);
        setProducts(data ?? []);
      });
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>Produtos</h1>
      <ul data-testid="product-list" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', listStyle: 'none', padding: 0 }}>
        {products.map((p) => (
          <li key={p.id} style={{ border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
            <h3 style={{ margin: '0 0 8px' }}>{p.name}</h3>
            <p>R$ {(p.price_cents / 100).toFixed(2)}</p>
            <button data-testid={`product-view-${p.slug}`} onClick={() => setSelected(p)}>Ver</button>
          </li>
        ))}
      </ul>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ''} testId="product-modal">
        {selected && (
          <>
            <p>Preço: R$ {(selected.price_cents / 100).toFixed(2)}</p>
            <button data-testid="add-to-cart">Adicionar ao carrinho</button>
          </>
        )}
      </Modal>
    </main>
  );
}