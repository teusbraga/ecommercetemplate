'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '@/components/ui/Table';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      let query = supabase
        .from('orders')
        .select('id, order_number, status, total_cents, created_at, shipping_address')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data } = await query;
      setOrders(data ?? []);
    } catch (e) {
      console.error('Erro ao listar pedidos:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [filterStatus]);

  const statuses = [
    { key: 'all', label: 'Todos' },
    { key: 'pending', label: 'Pendentes' },
    { key: 'paid', label: 'Pagos' },
    { key: 'processing', label: 'Em Separação' },
    { key: 'shipped', label: 'Enviados' },
    { key: 'delivered', label: 'Entregues' },
    { key: 'cancelled', label: 'Cancelados' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 6px', color: '#0f172a' }}>
          Gestão de Pedidos
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
          Acompanhe o status, pagamentos e expedição dos pedidos de clientes
        </p>
      </div>

      {/* Filtros por status */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {statuses.map((s) => (
          <button
            key={s.key}
            onClick={() => setFilterStatus(s.key)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              border: `1px solid ${filterStatus === s.key ? '#0070f3' : '#cbd5e1'}`,
              backgroundColor: filterStatus === s.key ? '#eff6ff' : '#ffffff',
              color: filterStatus === s.key ? '#0070f3' : '#475569',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
            Carregando pedidos...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
            Nenhum pedido encontrado com este filtro.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Pedido</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Destinatário</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {orders.map((o) => {
                const badgeVariant =
                  o.status === 'paid' || o.status === 'delivered'
                    ? 'success'
                    : o.status === 'pending'
                    ? 'warning'
                    : o.status === 'cancelled'
                    ? 'danger'
                    : 'info';

                return (
                  <TableRow key={o.id}>
                    <TableCell style={{ fontWeight: 600 }}>#{o.order_number}</TableCell>
                    <TableCell>{new Date(o.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      {o.shipping_address?.street
                        ? `${o.shipping_address.street}, ${o.shipping_address.city ?? ''}`
                        : 'Balcão / Não informado'}
                    </TableCell>
                    <TableCell style={{ fontWeight: 600 }}>
                      R$ {(o.total_cents / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badgeVariant}>{o.status}</Badge>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <Link
                        href={`/admin/orders/${o.id}`}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#f1f5f9',
                          borderRadius: 6,
                          textDecoration: 'none',
                          color: '#0f172a',
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        Gerenciar →
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}
