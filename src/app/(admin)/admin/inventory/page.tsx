'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '@/components/ui/Table';

export default function AdminInventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal de ajuste
  const [adjustTarget, setAdjustTarget] = useState<any>(null);
  const [adjustDelta, setAdjustDelta] = useState('0');
  const [adjustType, setAdjustType] = useState('adjustment');
  const [adjustReason, setAdjustReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      // 1. Itens de estoque com dados do produto e variante
      const { data: invItems } = await supabase
        .from('inventory_items')
        .select(`
          id,
          variant_id,
          quantity,
          reserved_quantity,
          low_stock_threshold,
          updated_at,
          product_variants (
            sku,
            name,
            products (name)
          )
        `)
        .order('quantity', { ascending: true });

      setItems(invItems ?? []);

      // 2. Movimentos recentes
      const { data: movs } = await supabase
        .from('inventory_movements')
        .select(`
          id,
          type,
          quantity,
          previous_quantity,
          new_quantity,
          reason,
          created_at,
          product_variants (
            sku,
            name,
            products (name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setMovements(movs ?? []);
    } catch (e) {
      console.error('Erro ao carregar estoque:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const delta = parseInt(adjustDelta, 10);
    if (isNaN(delta) || delta === 0) {
      setErrorMsg('Informe um valor de delta válido diferente de zero.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant_id: adjustTarget.variant_id,
          delta,
          type: adjustType,
          reason: adjustReason || 'Ajuste manual de estoque',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Falha ao ajustar estoque.');

      setAdjustTarget(null);
      setAdjustDelta('0');
      setAdjustReason('');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Erro ao processar ajuste.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 6px', color: '#0f172a' }}>
          Controle de Estoque & Auditoria
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
          Acompanhe saldo físico, reservas ativas e trilha completa de movimentações
        </p>
      </div>

      {/* Tabela de Itens em Estoque */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', color: '#0f172a' }}>
          Itens em Estoque
        </h2>

        {isLoading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>Carregando dados de estoque...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
            Nenhum item com estoque registrado. Cadastre produtos para inicializar o estoque.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto / Variante</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Físico</TableHead>
                <TableHead>Reservado</TableHead>
                <TableHead>Disponível</TableHead>
                <TableHead>Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {items.map((it) => {
                const available = it.quantity - it.reserved_quantity;
                const isLow = it.quantity <= it.low_stock_threshold;
                const prodName = it.product_variants?.products?.name ?? 'Produto';
                const varName = it.product_variants?.name;

                return (
                  <TableRow key={it.id}>
                    <TableCell style={{ fontWeight: 600 }}>
                      {prodName} {varName ? `(${varName})` : ''}
                    </TableCell>
                    <TableCell style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>
                      {it.product_variants?.sku ?? '-'}
                    </TableCell>
                    <TableCell style={{ fontWeight: 600 }}>{it.quantity}</TableCell>
                    <TableCell style={{ color: it.reserved_quantity > 0 ? '#d97706' : '#64748b' }}>
                      {it.reserved_quantity}
                    </TableCell>
                    <TableCell style={{ fontWeight: 700, color: available <= 0 ? '#b91c1c' : '#047857' }}>
                      {available}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isLow ? 'danger' : 'success'}>
                        {isLow ? `Baixo (<= ${it.low_stock_threshold})` : 'Normal'}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setAdjustTarget(it);
                          setAdjustDelta('0');
                          setErrorMsg('');
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#0070f3',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        Ajustar Estoque
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </tbody>
          </Table>
        )}
      </div>

      {/* Histórico Recente de Movimentações */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', color: '#0f172a' }}>
          Histórico Recente de Movimentações (Trilha Auditável)
        </h2>

        {movements.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
            Nenhuma movimentação registrada até o momento.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data / Hora</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Delta</TableHead>
                <TableHead>Saldo (Antes → Depois)</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {movements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell style={{ fontSize: 12, color: '#64748b' }}>
                    {new Date(m.created_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell style={{ fontWeight: 500 }}>
                    {m.product_variants?.products?.name ?? 'Item'} ({m.product_variants?.sku})
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.quantity > 0 ? 'success' : 'default'}>
                      {m.type}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontWeight: 700, color: m.quantity > 0 ? '#047857' : '#b91c1c' }}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </TableCell>
                  <TableCell style={{ fontSize: 13, color: '#64748b' }}>
                    {m.previous_quantity} → {m.new_quantity}
                  </TableCell>
                  <TableCell style={{ fontSize: 13 }}>{m.reason ?? '-'}</TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* Modal de Ajuste de Estoque */}
      <Modal
        open={!!adjustTarget}
        onClose={() => setAdjustTarget(null)}
        title="Ajuste Manual de Estoque"
        testId="stock-adjust-modal"
      >
        {adjustTarget && (
          <form onSubmit={handleAdjustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, fontSize: 14, color: '#475569' }}>
              Item: <strong>{adjustTarget.product_variants?.products?.name}</strong> ({adjustTarget.product_variants?.sku})
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
              Saldo físico atual: <strong>{adjustTarget.quantity}</strong> unidades
            </p>

            {errorMsg && (
              <div style={{ padding: 10, backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: 6, fontSize: 13 }}>
                {errorMsg}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#3f3f46' }}>
                Tipo de Movimentação
              </label>
              <select
                value={adjustType}
                onChange={(e) => setAdjustType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 6,
                  border: '1px solid #d4d4d8',
                  outline: 'none',
                }}
              >
                <option value="adjustment">Ajuste / Balanço Físico</option>
                <option value="in">Entrada / Reposição (+)</option>
                <option value="out">Saída / Avaria (-)</option>
                <option value="return">Devolução de Cliente (+)</option>
              </select>
            </div>

            <Input
              label="Delta (quantidade a adicionar ou subtrair, ex: +10 ou -3) *"
              placeholder="Ex: 5 ou -2"
              type="number"
              required
              value={adjustDelta}
              onChange={(e) => setAdjustDelta(e.target.value)}
            />

            <Input
              label="Motivo / Justificativa do Ajuste *"
              placeholder="Ex: Contagem física anual de estoque"
              required
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
              <Button variant="outline" type="button" onClick={() => setAdjustTarget(null)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Confirmar Ajuste
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
