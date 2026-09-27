import { test, expect } from '@playwright/test';

test.describe('Catálogo', () => {
  test('abre modal de produto e adiciona ao carrinho', async ({ page }) => {
    await page.goto('/products');
    await expect(page.getByTestId('product-list')).toBeVisible();

    const firstProduct = page.locator('[data-testid^="product-view-"]').first();
    await firstProduct.click();

    const modal = page.getByTestId('product-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Preço');

    await page.getByTestId('add-to-cart').click();
    await page.getByTestId('modal-close').click();
    await expect(modal).toBeHidden();
  });
});