'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function NewProductPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    sku: '',
    price: '',
    cost: '',
    initialStock: '10',
    description: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const skuPrefix = name
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 4)
      .toUpperCase();

    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug === '' || prev.slug === prev.name.toLowerCase() ? slug : prev.slug,
      sku: prev.sku === '' ? `${skuPrefix || 'PROD'}-${Math.floor(100 + Math.random() * 900)}` : prev.sku,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name || !formData.slug || !formData.sku || !formData.price) {
      setErrorMsg('Preencha os campos obrigatórios (*).');
      return;
    }

    const priceCents = Math.round(parseFloat(formData.price.replace(',', '.')) * 100);
    const costCents = formData.cost
      ? Math.round(parseFloat(formData.cost.replace(',', '.')) * 100)
      : 0;

    if (isNaN(priceCents) || priceCents < 0) {
      setErrorMsg('Preço de venda inválido.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          sku: formData.sku,
          price_cents: priceCents,
          cost_cents: costCents,
          description: formData.description,
          initial_stock: parseInt(formData.initialStock, 10) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Falha ao cadastrar produto.');

      router.push('/admin/products');
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Erro inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/admin/products" style={{ color: '#0070f3', textDecoration: 'none', fontSize: 13 }}>
          ← Voltar para lista de produtos
        </Link>
      </div>

      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', color: '#0f172a' }}>
          Cadastrar Novo Produto
        </h1>
        <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 14 }}>
          Preencha os detalhes para disponibilizar o item no catálogo da loja
        </p>

        {errorMsg && (
          <div
            style={{
              padding: 12,
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              borderRadius: 6,
              marginBottom: 20,
              fontSize: 14,
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Input
            label="Nome do Produto *"
            placeholder="Ex: Camiseta Básica Algodão"
            required
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input
              label="Slug (URL amigável) *"
              placeholder="camiseta-basica-algodao"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            />
            <Input
              label="Código SKU *"
              placeholder="CAM-001"
              required
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Input
              label="Preço de Venda (R$) *"
              placeholder="89.90"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
            <Input
              label="Preço de Custo (R$)"
              placeholder="35.00"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
            />
            <Input
              label="Estoque Inicial"
              type="number"
              min="0"
              value={formData.initialStock}
              onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#3f3f46', marginBottom: 6 }}>
              Descrição do Produto
            </label>
            <textarea
              rows={4}
              placeholder="Descreva detalhes, tecidos, tamanhos e especificações..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: 14,
                borderRadius: 6,
                border: '1px solid #d4d4d8',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
            <Link href="/admin/products" style={{ textDecoration: 'none' }}>
              <Button variant="outline" type="button">Cancelar</Button>
            </Link>
            <Button type="submit" isLoading={isSubmitting}>
              Salvar e Publicar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
