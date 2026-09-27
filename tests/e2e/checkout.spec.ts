import { test, expect } from '@playwright/test';

test.describe('Fluxo de Checkout Pix', () => {
  test('valida campos obrigatórios e tela de checkout', async ({ page }) => {
    // 1. Tentar checkout sem itens avisa carrinho vazio
    await page.goto('/checkout');
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible();

    // 2. Adiciona produto pelo catálogo
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid^="product-view-"]').first();
    await firstProduct.click();
    await page.getByTestId('add-to-cart').click();
    await page.getByTestId('modal-close').click();

    // 3. Acessa checkout com produto no carrinho
    await page.goto('/checkout');
    await expect(page.getByTestId('checkout-name')).toBeVisible();
    await expect(page.getByTestId('checkout-email')).toBeVisible();
    await expect(page.getByTestId('submit-checkout')).toBeVisible();

    // 4. Preenche identificação básica
    await page.getByTestId('checkout-name').fill('Cliente Teste');
    await page.getByTestId('checkout-email').fill('teste@ecommerce.local');

    // 5. Envia pedido
    await page.getByTestId('submit-checkout').click();

    // 6. Confirma geração da tela de Pix e status de espera
    await expect(page.getByText('Aguardando Pagamento Pix')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Copiar Código Pix')).toBeVisible();
  });
});
