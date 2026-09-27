'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { CartProvider, useCart } from '@/lib/cart';
import { createClient } from '@/lib/supabase/client';

function ShopHeader() {
  const { totalItems } = useCart();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();

    const checkUser = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        setUser(currentUser);

        if (currentUser) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', currentUser.id)
            .single();

          setProfile(prof);
        } else {
          setProfile(null);
        }
      } catch (e) {
        // Ignora caso erro de rede ou não autenticado
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const isAdminOrStaff = profile?.role === 'admin' || profile?.role === 'staff' || profile?.role === 'auditor';

  return (
    <header
      style={{
        borderBottom: '1px solid #e4e4e7',
        backgroundColor: '#ffffff',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link
            href="/"
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#09090b',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            🛒 <span>Loja Base</span>
          </Link>

          <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link
              href="/products"
              data-testid="nav-products"
              style={{
                fontSize: 14,
                color: '#52525b',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Produtos
            </Link>

            {isAdminOrStaff && (
              <Link
                href="/admin"
                data-testid="nav-admin"
                style={{
                  fontSize: 14,
                  color: '#0070f3',
                  textDecoration: 'none',
                  fontWeight: 600,
                  backgroundColor: '#eff6ff',
                  padding: '4px 10px',
                  borderRadius: 6,
                }}
              >
                ⚙️ Painel Admin
              </Link>
            )}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Link Conta / Login */}
          {user ? (
            <Link
              href="/account"
              style={{
                fontSize: 14,
                color: '#18181b',
                textDecoration: 'none',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 6,
              }}
            >
              <span>👤</span>
              <span>{profile?.full_name?.split(' ')[0] || 'Minha Conta'}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              style={{
                fontSize: 14,
                color: '#52525b',
                textDecoration: 'none',
                fontWeight: 500,
                padding: '8px 12px',
              }}
            >
              Entrar
            </Link>
          )}

          {/* Carrinho */}
          <Link
            href="/cart"
            data-testid="cart-link"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: 6,
              backgroundColor: '#f4f4f5',
              color: '#18181b',
              fontSize: 14,
              fontWeight: 500,
              textDecoration: 'none',
              border: '1px solid #e4e4e7',
            }}
          >
            <span>🛍️ Carrinho</span>
            {totalItems > 0 && (
              <span
                data-testid="cart-badge-count"
                style={{
                  backgroundColor: '#0070f3',
                  color: '#ffffff',
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 9999,
                  padding: '2px 7px',
                  minWidth: 16,
                  textAlign: 'center',
                }}
              >
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

function ShopFooter() {
  return (
    <footer
      style={{
        borderTop: '1px solid #e4e4e7',
        backgroundColor: '#fafafa',
        marginTop: 64,
        padding: '32px 20px',
        textAlign: 'center',
        color: '#71717a',
        fontSize: 13,
      }}
    >
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <p style={{ margin: 0 }}>
          E-commerce Base — Template Replicável Multi-provider
        </p>
      </div>
    </footer>
  );
}

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <ShopHeader />
        <div style={{ flex: 1 }}>{children}</div>
        <ShopFooter />
      </div>
    </CartProvider>
  );
}
