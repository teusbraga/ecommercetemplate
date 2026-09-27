import { test, expect } from '@playwright/test';

test.describe('Fluxo do Carrinho', () => {
  test('adiciona produto ao carrinho e manipula quantidade', async ({ page }) => {
    // 1. Acessa a página do carrinho inicialmente vazia
    await page.goto('/cart');
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible();

    // 2. Navega para catálogo
    await page.goto('/products');
    await expect(page.getByTestId('product-list')).toBeVisible();

    const firstProduct = page.locator('[data-testid^="product-view-"]').first();
    await firstProduct.click();

    const modal = page.getByTestId('product-modal');
    await expect(modal).toBeVisible();

    // 3. Adiciona ao carrinho
    await page.getByTestId('add-to-cart').click();
    await expect(page.getByText('Adicionado ao carrinho!')).toBeVisible();
    await page.getByTestId('modal-close').click();

    // 4. Confirma badge do carrinho atualizado
    const badge = page.getByTestId('cart-badge-count');
    await expect(badge).toHaveText('1');

    // 5. Acessa página do carrinho e checa total
    await page.getByTestId('cart-link').click();
    await expect(page).toHaveURL(/.*cart/);
    await expect(page.getByTestId('cart-total')).toBeVisible();
    await expect(page.getByTestId('checkout-btn')).toBeVisible();
  });
});
