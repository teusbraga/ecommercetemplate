'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: '📊 Dashboard' },
    { href: '/admin/products', label: '📦 Produtos' },
    { href: '/admin/orders', label: '📑 Pedidos' },
    { href: '/admin/inventory', label: '📈 Estoque' },
    { href: '/admin/cash', label: '💰 Caixa' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          {/* Brand */}
          <div style={{ padding: '24px 20px', borderBottom: '1px solid #1e293b' }}>
            <Link
              href="/admin"
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#ffffff',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>⚙️</span> Painel Admin
            </Link>
            <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginTop: 4 }}>
              Loja Template v1.0
            </span>
          </div>

          {/* Navigation Links */}
          <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 500,
                    textDecoration: 'none',
                    color: active ? '#ffffff' : '#94a3b8',
                    backgroundColor: active ? '#1e293b' : 'transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom link to Shop */}
        <div style={{ padding: '20px 16px', borderTop: '1px solid #1e293b' }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: '#38bdf8',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            ← Voltar para a Loja
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Navbar */}
        <header
          style={{
            height: 60,
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
          }}
        >
          <div style={{ fontSize: 14, color: '#64748b' }}>
            Ambiente de Gestão da Loja
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                fontSize: 12,
                backgroundColor: '#ecfdf5',
                color: '#047857',
                padding: '4px 10px',
                borderRadius: 9999,
                fontWeight: 600,
              }}
            >
              ● Sistema Online
            </span>
          </div>
        </header>

        {/* Page Content Container */}
        <main style={{ flex: 1, padding: '32px 28px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
