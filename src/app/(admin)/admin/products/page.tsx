'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '@/components/ui/Table';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, sku, price_cents, cost_cents, is_active, created_at')
        .order('created_at', { ascending: false });

      setProducts(data ?? []);
    } catch (e) {
      console.error('Erro ao listar produtos:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !current }),
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, is_active: !current } : p))
        );
      }
    } catch (e) {
      console.error('Erro ao atualizar status do produto:', e);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 6px', color: '#0f172a' }}>
            Gerenciador de Produtos
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
            Cadastre, edite e controle a visibilidade dos produtos na loja
          </p>
        </div>

        <Link href="/admin/products/new" style={{ textDecoration: 'none' }}>
          <Button size="md">+ Cadastrar Produto</Button>
        </Link>
      </div>

      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
            Carregando produtos...
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
            <p style={{ margin: '0 0 16px' }}>Nenhum produto cadastrado até o momento.</p>
            <Link href="/admin/products/new" style={{ textDecoration: 'none' }}>
              <Button size="sm">+ Cadastrar Primeiro Produto</Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Preço Venda</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell style={{ fontWeight: 600 }}>
                    <Link
                      href={`/products/${p.slug}`}
                      target="_blank"
                      style={{ color: '#0f172a', textDecoration: 'none' }}
                    >
                      {p.name} ↗
                    </Link>
                  </TableCell>
                  <TableCell style={{ fontFamily: 'monospace', fontSize: 13, color: '#64748b' }}>
                    {p.sku}
                  </TableCell>
                  <TableCell style={{ fontWeight: 600 }}>
                    R$ {(p.price_cents / 100).toFixed(2)}
                  </TableCell>
                  <TableCell style={{ color: '#64748b' }}>
                    R$ {(p.cost_cents / 100).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.is_active ? 'success' : 'default'}>
                      {p.is_active ? 'Ativo na Loja' : 'Inativo / Oculto'}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => toggleActive(p.id, p.is_active)}
                      style={{
                        padding: '6px 12px',
                        fontSize: 12,
                        borderRadius: 6,
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        color: p.is_active ? '#b91c1c' : '#047857',
                        fontWeight: 500,
                      }}
                    >
                      {p.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}
