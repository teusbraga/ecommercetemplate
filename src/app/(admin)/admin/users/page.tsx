'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '@/components/ui/Table';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch (e) {
      console.error('Erro ao carregar usuários:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    setFeedbackMsg('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Falha ao atualizar papel.');

      setFeedbackMsg(`Permissão de ${data.profile.email} alterada para "${newRole}" com sucesso!`);
      setTimeout(() => setFeedbackMsg(''), 4000);

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    setUpdatingId(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, is_active: !currentStatus }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u))
        );
      }
    } catch (e) {
      console.error('Erro ao alterar status:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 6px', color: '#0f172a' }}>
          Gestão de Usuários & Permissões
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
          Controle quem pode acessar o painel administrativo e editar produtos, estoque e vendas
        </p>
      </div>

      {feedbackMsg && (
        <div
          style={{
            padding: 12,
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#047857',
            borderRadius: 6,
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          ✓ {feedbackMsg}
        </div>
      )}

      {/* Explicação de papéis */}
      <div
        style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
          fontSize: 13,
          color: '#1e40af',
          lineHeight: 1.5,
        }}
      >
        <strong>💡 Controle de Acesso Baseado em Papéis (RBAC):</strong>
        <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
          <li><strong>Admin:</strong> Acesso total ao painel, permissões de usuários, finanças e edição da loja.</li>
          <li><strong>Staff:</strong> Gerencia produtos, estoque e pedidos diários.</li>
          <li><strong>Auditor:</strong> Acesso somente-leitura para conferência de auditoria e balanços.</li>
          <li><strong>Customer:</strong> Cliente padrão da loja (visualiza catálogo e seus próprios pedidos).</li>
        </ul>
      </div>

      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
            Carregando usuários cadastrados...
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
            Nenhum usuário cadastrado até o momento. Cadastre-se na tela de login da loja para criar o primeiro usuário.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Papel Atual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Cadastro</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Alterar Permissão / Ações</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {users.map((u) => {
                const isUpdating = updatingId === u.id;

                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        {u.full_name || 'Sem nome'}
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>{u.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          u.role === 'admin'
                            ? 'success'
                            : u.role === 'staff'
                            ? 'info'
                            : u.role === 'auditor'
                            ? 'warning'
                            : 'default'
                        }
                      >
                        {u.role.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.is_active ? 'success' : 'danger'}>
                        {u.is_active ? 'Ativo' : 'Bloqueado'}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: 13, color: '#64748b' }}>
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                        <select
                          disabled={isUpdating}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          style={{
                            padding: '6px 10px',
                            fontSize: 12,
                            borderRadius: 6,
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="customer">Cliente (Padrão)</option>
                          <option value="staff">Staff (Operacional)</option>
                          <option value="admin">Administrador (Total)</option>
                          <option value="auditor">Auditor (Leitura)</option>
                        </select>

                        <button
                          disabled={isUpdating}
                          onClick={() => handleStatusToggle(u.id, u.is_active)}
                          style={{
                            padding: '6px 10px',
                            fontSize: 12,
                            borderRadius: 6,
                            border: '1px solid #cbd5e1',
                            backgroundColor: u.is_active ? '#fef2f2' : '#ecfdf5',
                            color: u.is_active ? '#b91c1c' : '#047857',
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                        >
                          {u.is_active ? 'Bloquear' : 'Ativar'}
                        </button>
                      </div>
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
