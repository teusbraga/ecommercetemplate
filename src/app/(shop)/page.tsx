import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let products: any[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price_cents, description')
      .eq('is_active', true)
      .limit(6);
    products = data ?? [];
  } catch (e) {
    console.error('Erro ao buscar produtos para a home:', e);
  }

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 20px' }}>
      {/* Hero Section */}
      <section
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          backgroundColor: '#f8fafc',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          marginBottom: 48,
        }}
      >
        <h1 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 12px', color: '#0f172a' }}>
          Loja Online Oficial
        </h1>
        <p style={{ fontSize: 16, color: '#64748b', maxWidth: 560, margin: '0 auto 24px' }}>
          Produtos selecionados com pagamento instantâneo via Pix e cartões. Entrega rápida e segura.
        </p>
        <Link
          href="/products"
          data-testid="hero-cta"
          style={{
            display: 'inline-block',
            padding: '12px 28px',
            backgroundColor: '#0070f3',
            color: '#ffffff',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 15,
          }}
        >
          Explorar Produtos →
        </Link>
      </section>

      {/* Featured Products */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#0f172a' }}>
            Produtos em Destaque
          </h2>
          <Link href="/products" style={{ color: '#0070f3', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
            Ver todos ({products.length})
          </Link>
        </div>

        {products.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              backgroundColor: '#fafafa',
              borderRadius: 8,
              border: '1px dashed #d4d4d8',
              color: '#71717a',
            }}
          >
            <p>Nenhum produto cadastrado no momento.</p>
            <Link href="/products" style={{ color: '#0070f3' }}>
              Ir para catálogo
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: 20,
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            }}
          >
            {products.map((p) => (
              <div
                key={p.id}
                style={{
                  border: '1px solid #e4e4e7',
                  borderRadius: 8,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  backgroundColor: '#ffffff',
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>{p.name}</h3>
                  <p style={{ fontSize: 13, color: '#71717a', margin: '0 0 16px', lineHeight: 1.4 }}>
                    {p.description ?? 'Sem descrição disponível.'}
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: '#09090b' }}>
                    R$ {(p.price_cents / 100).toFixed(2)}
                  </span>
                  <Link
                    href={`/products/${p.slug}`}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      backgroundColor: '#f4f4f5',
                      color: '#18181b',
                      fontSize: 13,
                      fontWeight: 500,
                      textDecoration: 'none',
                    }}
                  >
                    Ver detalhes
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
