'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '@/components/ui/Table';

export default function AdminCashPage() {
  const [openRegister, setOpenRegister] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [pastRegisters, setPastRegisters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de formulário
  const [openingAmount, setOpeningAmount] = useState('100.00');
  const [openingNotes, setOpeningNotes] = useState('');

  // Movimento modal
  const [movementModal, setMovementModal] = useState<'sangria' | 'suprimento' | null>(null);
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');

  // Fechamento modal
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [countedAmount, setCountedAmount] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      // 1. Busca caixa aberto atual
      const { data: reg } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('status', 'open')
        .limit(1)
        .single();

      setOpenRegister(reg);

      if (reg) {
        // Movimentos do caixa atual
        const { data: movs } = await supabase
          .from('cash_movements')
          .select('*')
          .eq('cash_register_id', reg.id)
          .order('created_at', { ascending: false });

        setMovements(movs ?? []);
      }

      // 2. Histórico de caixas anteriores fechados
      const { data: past } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('status', 'closed')
        .order('closed_at', { ascending: false })
        .limit(10);

      setPastRegisters(past ?? []);
    } catch (e) {
      console.error('Erro ao carregar dados do caixa:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const amountCents = Math.round(parseFloat(openingAmount.replace(',', '.')) * 100);
      const res = await fetch('/api/admin/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'open',
          opening_amount_cents: amountCents,
          notes: openingNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Falha ao abrir caixa.');

      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openRegister || !movementModal) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const amountCents = Math.round(parseFloat(movementAmount.replace(',', '.')) * 100);
      const res = await fetch('/api/admin/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'movement',
          cash_register_id: openRegister.id,
          type: movementModal,
          amount_cents: amountCents,
          reason: movementReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Falha ao registrar movimento.');

      setMovementModal(null);
      setMovementAmount('');
      setMovementReason('');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openRegister) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const countedCents = Math.round(parseFloat(countedAmount.replace(',', '.')) * 100);
      const res = await fetch('/api/admin/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'close',
          cash_register_id: openRegister.id,
          counted_amount_cents: countedCents,
          notes: closeNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Falha ao fechar caixa.');

      setIsCloseModalOpen(false);
      setCountedAmount('');
      setCloseNotes('');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cálculos do caixa aberto
  const totalInCents = movements
    .filter((m) => ['in', 'suprimento'].includes(m.type))
    .reduce((acc, m) => acc + m.amount_cents, 0);

  const totalOutCents = movements
    .filter((m) => ['out', 'sangria'].includes(m.type))
    .reduce((acc, m) => acc + m.amount_cents, 0);

  const expectedBalanceCents = openRegister
    ? openRegister.opening_amount_cents + totalInCents - totalOutCents
    : 0;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 6px', color: '#0f172a' }}>
          Gestão de Caixa Interno
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
          Abertura, conferência de sangrias/suprimentos e fechamento com conciliação auditável
        </p>
      </div>

      {errorMsg && (
        <div style={{ padding: 12, backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: 6, marginBottom: 20 }}>
          {errorMsg}
        </div>
      )}

      {/* Caixa Ativo vs. Caixa Fechado */}
      {openRegister ? (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 24, marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Badge variant="success">● Caixa Aberto</Badge>
              <span style={{ fontSize: 13, color: '#64748b' }}>
                Aberto em: {new Date(openRegister.opened_at).toLocaleString('pt-BR')}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" variant="outline" onClick={() => setMovementModal('suprimento')}>
                + Suprimento (Aporte)
              </Button>
              <Button size="sm" variant="outline" onClick={() => setMovementModal('sangria')}>
                - Sangria (Retirada)
              </Button>
              <Button size="sm" variant="danger" onClick={() => setIsCloseModalOpen(true)}>
                🔒 Fechar Caixa
              </Button>
            </div>
          </div>

          {/* Cards de Saldo do Caixa Aberto */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={{ padding: 16, backgroundColor: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>
                Fundo de Abertura
              </span>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                R$ {(openRegister.opening_amount_cents / 100).toFixed(2)}
              </span>
            </div>

            <div style={{ padding: 16, backgroundColor: '#ecfdf5', borderRadius: 8, border: '1px solid #a7f3d0' }}>
              <span style={{ fontSize: 12, color: '#047857', display: 'block', marginBottom: 4 }}>
                Entradas & Suprimentos (+)
              </span>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#047857' }}>
                R$ {(totalInCents / 100).toFixed(2)}
              </span>
            </div>

            <div style={{ padding: 16, backgroundColor: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
              <span style={{ fontSize: 12, color: '#b91c1c', display: 'block', marginBottom: 4 }}>
                Saídas & Sangrias (-)
              </span>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#b91c1c' }}>
                R$ {(totalOutCents / 100).toFixed(2)}
              </span>
            </div>

            <div style={{ padding: 16, backgroundColor: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
              <span style={{ fontSize: 12, color: '#1d4ed8', display: 'block', marginBottom: 4 }}>
                Saldo Estimado em Caixa
              </span>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#1d4ed8' }}>
                R$ {(expectedBalanceCents / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Movimentações do caixa atual */}
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', color: '#0f172a' }}>
            Movimentações da Sessão Atual ({movements.length})
          </h3>
          {movements.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>Nenhuma sangria ou suprimento registrado nesta sessão.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Motivo / Observação</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell style={{ fontSize: 12, color: '#64748b' }}>
                      {new Date(m.created_at).toLocaleTimeString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={['in', 'suprimento'].includes(m.type) ? 'success' : 'danger'}>
                        {m.type}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontWeight: 600 }}>
                      R$ {(m.amount_cents / 100).toFixed(2)}
                    </TableCell>
                    <TableCell style={{ fontSize: 13 }}>{m.reason ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      ) : (
        /* Formulário de Abertura de Caixa */
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 28, marginBottom: 32, maxWidth: 540 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Badge variant="warning">Caixa Fechado</Badge>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Abrir Sessão de Caixa
            </h2>
          </div>
          <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 20px' }}>
            Informe o valor inicial de fundo de troco para iniciar a operação do dia.
          </p>

          <form onSubmit={handleOpenRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="Fundo de Troco Inicial (R$) *"
              placeholder="100.00"
              required
              value={openingAmount}
              onChange={(e) => setOpeningAmount(e.target.value)}
            />
            <Input
              label="Observações da Abertura"
              placeholder="Ex: Turno da manhã"
              value={openingNotes}
              onChange={(e) => setOpeningNotes(e.target.value)}
            />
            <Button type="submit" isLoading={isSubmitting}>
              Abrir Caixa Agora
            </Button>
          </form>
        </div>
      )}

      {/* Histórico de Caixas Anteriores */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', color: '#0f172a' }}>
          Histórico de Caixas Fechados (Auditoria de Diferenças)
        </h2>

        {pastRegisters.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
            Nenhum caixa fechado registrado no histórico.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Abertura</TableHead>
                <TableHead>Fechamento</TableHead>
                <TableHead>Fundo Inicial</TableHead>
                <TableHead>Valor Esperado</TableHead>
                <TableHead>Valor Contado</TableHead>
                <TableHead>Diferença (Quebra/Sobra)</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {pastRegisters.map((pr) => {
                const diff = pr.difference_cents ?? 0;
                const isDiffZero = diff === 0;
                const isSobra = diff > 0;

                return (
                  <TableRow key={pr.id}>
                    <TableCell style={{ fontSize: 12, color: '#64748b' }}>
                      {new Date(pr.opened_at).toLocaleDateString('pt-BR')} {new Date(pr.opened_at).toLocaleTimeString('pt-BR')}
                    </TableCell>
                    <TableCell style={{ fontSize: 12, color: '#64748b' }}>
                      {pr.closed_at ? new Date(pr.closed_at).toLocaleTimeString('pt-BR') : '-'}
                    </TableCell>
                    <TableCell>R$ {(pr.opening_amount_cents / 100).toFixed(2)}</TableCell>
                    <TableCell>R$ {((pr.expected_amount_cents ?? 0) / 100).toFixed(2)}</TableCell>
                    <TableCell style={{ fontWeight: 600 }}>
                      R$ {((pr.closing_amount_cents ?? 0) / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isDiffZero ? 'success' : isSobra ? 'info' : 'danger'}>
                        {isDiffZero
                          ? 'Perfeito (R$ 0,00)'
                          : `${isSobra ? 'Sobra: +' : 'Falta: '}R$ ${(Math.abs(diff) / 100).toFixed(2)}`}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </tbody>
          </Table>
        )}
      </div>

      {/* Modal de Movimento (Sangria / Suprimento) */}
      <Modal
        open={!!movementModal}
        onClose={() => setMovementModal(null)}
        title={movementModal === 'sangria' ? 'Registrar Sangria (Retirada)' : 'Registrar Suprimento (Aporte)'}
      >
        <form onSubmit={handleCreateMovement} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            {movementModal === 'sangria'
              ? 'Retirada de dinheiro físico do caixa para cofre ou depósito.'
              : 'Adição de dinheiro físico ao caixa durante o expediente.'}
          </p>

          <Input
            label="Valor em Dinheiro (R$) *"
            placeholder="50.00"
            required
            value={movementAmount}
            onChange={(e) => setMovementAmount(e.target.value)}
          />
          <Input
            label="Motivo / Justificativa *"
            placeholder="Ex: Pagamento de fornecedor local ou reforço de troco"
            required
            value={movementReason}
            onChange={(e) => setMovementReason(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
            <Button variant="outline" type="button" onClick={() => setMovementModal(null)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Confirmar Movimento
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Fechamento de Caixa */}
      <Modal
        open={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        title="Fechamento & Conferência de Caixa"
      >
        <form onSubmit={handleCloseRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Conte todas as cédulas e moedas presentes no caixa. O sistema comparará automaticamente com o valor esperado de <strong>R$ {(expectedBalanceCents / 100).toFixed(2)}</strong>.
          </p>

          <Input
            label="Valor Contado em Mãos (R$) *"
            placeholder="0.00"
            required
            value={countedAmount}
            onChange={(e) => setCountedAmount(e.target.value)}
          />

          <Input
            label="Observações Finais"
            placeholder="Ex: Turno encerrado sem divergências"
            value={closeNotes}
            onChange={(e) => setCloseNotes(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
            <Button variant="outline" type="button" onClick={() => setIsCloseModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="danger" isLoading={isSubmitting}>
              Concluir Fechamento
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
