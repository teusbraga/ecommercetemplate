import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '@/components/ui/Table';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = createServiceClient();

  // 1. Busca estatísticas de pedidos
  let totalRevenueCents = 0;
  let totalOrdersCount = 0;
  let pendingOrdersCount = 0;
  let recentOrders: any[] = [];

  try {
    const { data: orders } = await supabase
      .from('orders')
      .select('id, order_number, status, total_cents, created_at, shipping_address')
      .order('created_at', { ascending: false });

    if (orders) {
      totalOrdersCount = orders.length;
      totalRevenueCents = orders
        .filter((o) => o.status === 'paid')
        .reduce((acc, o) => acc + o.total_cents, 0);
      pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
      recentOrders = orders.slice(0, 5);
    }
  } catch (e) {
    console.error('Erro ao buscar pedidos no dashboard:', e);
  }

  // 2. Busca estoque baixo
  let lowStockCount = 0;
  try {
    const { data: invItems } = await supabase
      .from('inventory_items')
      .select('quantity, low_stock_threshold');

    if (invItems) {
      lowStockCount = invItems.filter(
        (i) => i.quantity <= i.low_stock_threshold
      ).length;
    }
  } catch (e) {
    console.error('Erro ao buscar estoque:', e);
  }

  // 3. Busca caixa aberto
  let openRegister: any = null;
  try {
    const { data: register } = await supabase
      .from('cash_registers')
      .select('id, status, opened_at, opening_amount_cents')
      .eq('status', 'open')
      .limit(1)
      .single();
    openRegister = register;
  } catch (e) {
    // Nenhum caixa aberto
  }

  const kpis = [
    {
      title: 'Faturamento Total (Pago)',
      value: `R$ ${(totalRevenueCents / 100).toFixed(2)}`,
      desc: 'Vendas confirmadas',
      color: '#047857',
      bg: '#ecfdf5',
    },
    {
      title: 'Pedidos Registrados',
      value: totalOrdersCount,
      desc: `${pendingOrdersCount} aguardando pagamento`,
      color: '#0284c7',
      bg: '#f0f9ff',
    },
    {
      title: 'Itens em Alerta de Estoque',
      value: lowStockCount,
      desc: lowStockCount > 0 ? 'Abaixo do limite mínimo' : 'Estoque regular',
      color: lowStockCount > 0 ? '#b91c1c' : '#475569',
      bg: lowStockCount > 0 ? '#fef2f2' : '#f8fafc',
    },
    {
      title: 'Caixa do Dia',
      value: openRegister ? 'Aberto' : 'Fechado',
      desc: openRegister
        ? `Abertura: R$ ${(openRegister.opening_amount_cents / 100).toFixed(2)}`
        : 'Nenhum caixa ativo',
      color: openRegister ? '#047857' : '#d97706',
      bg: openRegister ? '#ecfdf5' : '#fffbeb',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 6px', color: '#0f172a' }}>
            Visão Geral do Negócio
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
            Métricas de desempenho, pedidos e controle operacional em tempo real
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Link
            href="/admin/products/new"
            style={{
              padding: '9px 16px',
              backgroundColor: '#0070f3',
              color: '#ffffff',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            + Novo Produto
          </Link>
          <Link
            href="/admin/cash"
            style={{
              padding: '9px 16px',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            Operar Caixa
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 18,
          marginBottom: 36,
        }}
      >
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: 20,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b', display: 'block', marginBottom: 8 }}>
              {kpi.title}
            </span>
            <div style={{ fontSize: 26, fontWeight: 700, color: kpi.color, marginBottom: 4 }}>
              {kpi.value}
            </div>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{kpi.desc}</span>
          </div>
        ))}
      </div>

      {/* Últimos Pedidos */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#0f172a' }}>
            Últimos Pedidos
          </h2>
          <Link href="/admin/orders" style={{ fontSize: 13, color: '#0070f3', textDecoration: 'none', fontWeight: 500 }}>
            Ver todos os pedidos →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
            Nenhum pedido realizado ainda.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Pedido</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {recentOrders.map((order) => {
                const badgeVariant =
                  order.status === 'paid'
                    ? 'success'
                    : order.status === 'pending'
                    ? 'warning'
                    : 'danger';

                return (
                  <TableRow key={order.id}>
                    <TableCell style={{ fontWeight: 600 }}>#{order.order_number}</TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>R$ {(order.total_cents / 100).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={badgeVariant}>
                        {order.status === 'paid' ? 'Pago' : order.status === 'pending' ? 'Pendente' : order.status}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        style={{ color: '#0070f3', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}
                      >
                        Detalhes →
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
