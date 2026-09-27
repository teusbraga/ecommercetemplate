'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '@/components/ui/Table';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'orders'>('profile');
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [document, setDocument] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Novo endereço form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '',
    number: '',
    complement: '',
    city: '',
    state: '',
    postal_code: '',
  });

  const supabase = createClient();

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push('/login?return_to=/account');
        return;
      }

      setUser(currentUser);

      // 1. Carrega Profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (prof) {
        setProfile(prof);
        setFullName(prof.full_name ?? '');
        setPhone(prof.phone ?? '');
        setDocument(prof.document ?? '');
      }

      // 2. Carrega Pedidos do usuário
      const { data: userOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      setOrders(userOrders ?? []);

      // 3. Carrega Endereços
      const { data: userAddrs } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      setAddresses(userAddrs ?? []);
    } catch (e) {
      console.error('Erro ao carregar dados da conta:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setFeedbackMsg('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
          document,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setFeedbackMsg('Dados atualizados com sucesso!');
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (err: any) {
      setFeedbackMsg(`Erro ao salvar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);

    try {
      const { error } = await supabase.from('addresses').insert({
        user_id: user.id,
        street: newAddress.street,
        number: newAddress.number,
        complement: newAddress.complement,
        city: newAddress.city,
        state: newAddress.state,
        postal_code: newAddress.postal_code,
        country: 'BR',
      });

      if (error) throw error;

      setShowAddressForm(false);
      setNewAddress({
        street: '',
        number: '',
        complement: '',
        city: '',
        state: '',
        postal_code: '',
      });
      await loadUserData();
    } catch (err: any) {
      alert(`Erro ao adicionar endereço: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (isLoading) {
    return (
      <main style={{ maxWidth: 880, margin: '64px auto', padding: '0 20px', textAlign: 'center', color: '#64748b' }}>
        Carregando informações da sua conta...
      </main>
    );
  }

  const isAdminOrStaff = profile?.role === 'admin' || profile?.role === 'staff' || profile?.role === 'auditor';

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px' }}>
      {/* Header do Usuário */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 28,
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: 24,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Minha Conta
            </h1>
            <Badge variant={isAdminOrStaff ? 'success' : 'default'}>
              {profile?.role === 'admin'
                ? 'Administrador'
                : profile?.role === 'staff'
                ? 'Equipe Staff'
                : profile?.role === 'auditor'
                ? 'Auditor'
                : 'Cliente'}
            </Badge>
          </div>
          <span style={{ fontSize: 14, color: '#64748b' }}>{user?.email}</span>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {isAdminOrStaff && (
            <Link href="/admin" style={{ textDecoration: 'none' }}>
              <Button size="sm" variant="outline">
                ⚙️ Acessar Painel Admin
              </Button>
            </Link>
          )}
          <Button size="sm" variant="danger" onClick={handleLogout}>
            Sair da Conta
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: activeTab === 'profile' ? '#0070f3' : 'transparent',
            color: activeTab === 'profile' ? '#ffffff' : '#64748b',
          }}
        >
          Meus Dados
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: activeTab === 'orders' ? '#0070f3' : 'transparent',
            color: activeTab === 'orders' ? '#ffffff' : '#64748b',
          }}
        >
          Meus Pedidos ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: activeTab === 'addresses' ? '#0070f3' : 'transparent',
            color: activeTab === 'addresses' ? '#ffffff' : '#64748b',
          }}
        >
          Endereços Salvos ({addresses.length})
        </button>
      </div>

      {/* Tab: Perfil */}
      {activeTab === 'profile' && (
        <div style={{ maxWidth: 600, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', color: '#0f172a' }}>
            Dados Cadastrais
          </h2>

          {feedbackMsg && (
            <div
              style={{
                padding: 10,
                borderRadius: 6,
                backgroundColor: feedbackMsg.includes('Erro') ? '#fef2f2' : '#ecfdf5',
                color: feedbackMsg.includes('Erro') ? '#b91c1c' : '#047857',
                marginBottom: 16,
                fontSize: 13,
              }}
            >
              {feedbackMsg}
            </div>
          )}

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="E-mail (Login)"
              disabled
              value={user?.email ?? ''}
              style={{ backgroundColor: '#f8fafc', color: '#64748b' }}
            />

            <Input
              label="Nome Completo"
              placeholder="Seu nome"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Input
                label="CPF ou NIF"
                placeholder="000.000.000-00"
                value={document}
                onChange={(e) => setDocument(e.target.value)}
              />
              <Input
                label="Telefone / Celular"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <Button type="submit" isLoading={isSaving} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
              Salvar Alterações
            </Button>
          </form>
        </div>
      )}

      {/* Tab: Pedidos */}
      {activeTab === 'orders' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', color: '#0f172a' }}>
            Histórico de Pedidos
          </h2>

          {orders.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              <p style={{ margin: '0 0 16px' }}>Você ainda não realizou nenhum pedido com esta conta.</p>
              <Link href="/products" style={{ textDecoration: 'none' }}>
                <Button size="sm">Ver Catálogo</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Pedido</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell style={{ fontWeight: 600 }}>#{o.order_number}</TableCell>
                    <TableCell>{new Date(o.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell style={{ fontWeight: 600 }}>R$ {(o.total_cents / 100).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          o.status === 'paid' || o.status === 'delivered'
                            ? 'success'
                            : o.status === 'pending'
                            ? 'warning'
                            : o.status === 'cancelled'
                            ? 'danger'
                            : 'info'
                        }
                      >
                        {o.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      )}

      {/* Tab: Endereços */}
      {activeTab === 'addresses' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Endereços Cadastrados
            </h2>
            <Button size="sm" onClick={() => setShowAddressForm(!showAddressForm)}>
              {showAddressForm ? 'Cancelar' : '+ Novo Endereço'}
            </Button>
          </div>

          {showAddressForm && (
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>Cadastrar Novo Endereço</h3>
              <form onSubmit={handleAddAddress} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                  <Input
                    label="Rua / Logradouro *"
                    required
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                  />
                  <Input
                    label="Número"
                    value={newAddress.number}
                    onChange={(e) => setNewAddress({ ...newAddress, number: e.target.value })}
                  />
                </div>
                <Input
                  label="Complemento"
                  value={newAddress.complement}
                  onChange={(e) => setNewAddress({ ...newAddress, complement: e.target.value })}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
                  <Input
                    label="Cidade *"
                    required
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  />
                  <Input
                    label="Estado"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                  />
                  <Input
                    label="CEP *"
                    required
                    value={newAddress.postal_code}
                    onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                  />
                </div>
                <Button type="submit" isLoading={isSaving} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                  Salvar Endereço
                </Button>
              </form>
            </div>
          )}

          {addresses.length === 0 && !showAddressForm ? (
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 32, textAlign: 'center', color: '#94a3b8' }}>
              Nenhum endereço salvo ainda.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {addresses.map((a) => (
                <div key={a.id} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 18, fontSize: 14 }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#0f172a' }}>
                    {a.street}, {a.number}
                  </p>
                  {a.complement && <p style={{ margin: '0 0 4px', color: '#64748b' }}>{a.complement}</p>}
                  <p style={{ margin: '0 0 4px', color: '#64748b' }}>
                    {a.city} - {a.state}
                  </p>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: 12 }}>CEP: {a.postal_code}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
