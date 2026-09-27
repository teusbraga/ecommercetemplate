'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('return_to') ?? '/account';

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setIsGoogleLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnTo)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Falha ao autenticar com o Google.');
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          router.push(returnTo);
          router.refresh();
        } else {
          setSuccessMsg('Conta criada com sucesso! Verifique seu e-mail para confirmar seu cadastro se necessário, ou faça login.');
          setMode('login');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          router.push(returnTo);
          router.refresh();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Falha na autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 420,
        margin: '48px auto',
        padding: '32px 24px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px', color: '#0f172a' }}>
          {mode === 'login' ? 'Acessar sua Conta' : 'Criar Nova Conta'}
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
          {mode === 'login'
            ? 'Entre com suas credenciais ou Google para gerenciar pedidos'
            : 'Preencha os dados abaixo para se cadastrar'}
        </p>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: 12,
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: 6,
            marginBottom: 20,
            fontSize: 13,
          }}
        >
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: 12,
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#047857',
            borderRadius: 6,
            marginBottom: 20,
            fontSize: 13,
          }}
        >
          {successMsg}
        </div>
      )}

      {/* Botão Google OAuth */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading || isLoading}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: '11px 16px',
          backgroundColor: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 600,
          color: '#334155',
          cursor: isGoogleLoading ? 'not-allowed' : 'pointer',
          marginBottom: 20,
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
        {isGoogleLoading ? 'Conectando ao Google...' : 'Continuar com o Google'}
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          textAlign: 'center',
          color: '#94a3b8',
          fontSize: 12,
          margin: '20px 0',
        }}
      >
        <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
        <span style={{ padding: '0 12px' }}>ou com e-mail e senha</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {mode === 'signup' && (
          <Input
            label="Nome completo *"
            placeholder="Seu nome"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        )}

        <Input
          label="E-mail *"
          type="email"
          placeholder="seu@email.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Senha *"
          type="password"
          placeholder="••••••••"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button type="submit" size="md" isLoading={isLoading} style={{ width: '100%', marginTop: 6 }}>
          {mode === 'login' ? 'Entrar' : 'Cadastrar-se'}
        </Button>
      </form>

      <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
        {mode === 'login' ? (
          <>
            Não possui uma conta?{' '}
            <button
              onClick={() => {
                setMode('signup');
                setErrorMsg('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#0070f3',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Criar conta
            </button>
          </>
        ) : (
          <>
            Já tem uma conta?{' '}
            <button
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#0070f3',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Fazer login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <Suspense fallback={<div>Carregando tela de login...</div>}>
        <LoginFormContent />
      </Suspense>
    </main>
  );
}
