import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: 40, maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
      <h1>🛒 E-commerce Base</h1>
      <p>Template replicável multi-provider de pagamentos.</p>
      <div style={{ marginTop: 24 }}>
        <Link
          href="/products"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#0070f3',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: 6,
            fontWeight: 500,
          }}
        >
          Ver Catálogo de Produtos →
        </Link>
      </div>
    </main>
  );
}
