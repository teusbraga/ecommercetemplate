'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '@/components/ui/Table';

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadOrder = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: ord } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (ord) {
        setOrder(ord);

        const { data: ordItems } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', id);
        setItems(ordItems ?? []);

        const { data: ordPayments } = await supabase
          .from('payments')
          .select('*')
          .eq('order_id', id);
        setPayments(ordPayments ?? []);
      }
    } catch (e) {
      console.error('Erro ao carregar detalhes do pedido:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await loadOrder();
      }
    } catch (e) {
      console.error('Erro ao atualizar status:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: 40, color: '#64748b' }}>Carregando detalhes do pedido...</div>;
  }

  if (!order) {
    return (
      <div>
        <p>Pedido não encontrado.</p>
        <Link href="/admin/orders" style={{ color: '#0070f3' }}>
          ← Voltar para lista de pedidos
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/admin/orders" style={{ color: '#0070f3', textDecoration: 'none', fontSize: 13 }}>
          ← Voltar para lista de pedidos
        </Link>
      </div>

      {/* Header do Pedido */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: 24,
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Pedido #{order.order_number}
            </h1>
            <Badge
              variant={
                order.status === 'paid' || order.status === 'delivered'
                  ? 'success'
                  : order.status === 'pending'
                  ? 'warning'
                  : order.status === 'cancelled'
                  ? 'danger'
                  : 'info'
              }
            >
              {order.status}
            </Badge>
          </div>
          <span style={{ fontSize: 13, color: '#64748b' }}>
            Realizado em: {new Date(order.created_at).toLocaleString('pt-BR')}
          </span>
        </div>

        {/* Ações de Status */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {order.status === 'paid' && (
            <Button
              size="sm"
              variant="outline"
              isLoading={isUpdating}
              onClick={() => updateStatus('processing')}
            >
              Marcar Em Separação
            </Button>
          )}

          {['paid', 'processing'].includes(order.status) && (
            <Button
              size="sm"
              isLoading={isUpdating}
              onClick={() => updateStatus('shipped')}
            >
              Marcar como Enviado
            </Button>
          )}

          {order.status === 'shipped' && (
            <Button
              size="sm"
              variant="secondary"
              isLoading={isUpdating}
              onClick={() => updateStatus('delivered')}
            >
              Confirmar Entrega
            </Button>
          )}

          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <Button
              size="sm"
              variant="danger"
              isLoading={isUpdating}
              onClick={() => updateStatus('cancelled')}
            >
              Cancelar Pedido
            </Button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 24 }}>
        {/* Endereço de Entrega */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', color: '#0f172a' }}>
            📍 Endereço de Entrega
          </h3>
          {order.shipping_address ? (
            <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
              <p style={{ margin: 0 }}>
                {order.shipping_address.street}
                {order.shipping_address.number ? `, ${order.shipping_address.number}` : ''}
              </p>
              {order.shipping_address.complement && (
                <p style={{ margin: 0 }}>{order.shipping_address.complement}</p>
              )}
              <p style={{ margin: 0 }}>
                {order.shipping_address.city} - {order.shipping_address.state}
              </p>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: 12 }}>
                CEP: {order.shipping_address.postalCode}
              </p>
            </div>
          ) : (
            <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>Sem endereço informado.</p>
          )}
        </div>

        {/* Detalhes do Pagamento */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', color: '#0f172a' }}>
            💳 Pagamento
          </h3>
          {payments.length > 0 ? (
            payments.map((p) => (
              <div key={p.id} style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
                <p style={{ margin: 0 }}>
                  <strong>Método:</strong> {p.method.toUpperCase()} ({p.provider})
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Valor:</strong> R$ {(p.amount_cents / 100).toFixed(2)}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Status:</strong> {p.status}
                </p>
                {p.paid_at && (
                  <p style={{ margin: 0, fontSize: 12, color: '#047857' }}>
                    Pago em: {new Date(p.paid_at).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>Sem registros de pagamento.</p>
          )}
        </div>
      </div>

      {/* Itens do Pedido */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', color: '#0f172a' }}>
          Itens Comprados ({items.length})
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Qtd</TableHead>
              <TableHead>Preço Unit.</TableHead>
              <TableHead style={{ textAlign: 'right' }}>Total</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell style={{ fontWeight: 500 }}>
                  {it.product_name}
                  {it.variant_name && (
                    <span style={{ display: 'block', fontSize: 12, color: '#64748b' }}>
                      {it.variant_name}
                    </span>
                  )}
                </TableCell>
                <TableCell style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>
                  {it.sku}
                </TableCell>
                <TableCell>{it.quantity}</TableCell>
                <TableCell>R$ {(it.unit_price_cents / 100).toFixed(2)}</TableCell>
                <TableCell style={{ textAlign: 'right', fontWeight: 600 }}>
                  R$ {(it.total_cents / 100).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, paddingRight: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 14, color: '#64748b', display: 'block', marginBottom: 4 }}>
              Valor Total do Pedido
            </span>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
              R$ {(order.total_cents / 100).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
