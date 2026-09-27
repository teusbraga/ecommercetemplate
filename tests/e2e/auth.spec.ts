import { test, expect } from '@playwright/test';

test.describe('Autenticação e Proteção de Rotas', () => {
  test('redireciona rota /admin para /login com return_to', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/.*login\?return_to=(%2Fadmin|\/admin)/);
    await expect(page.getByText('Acessar sua Conta')).toBeVisible();
    await expect(page.getByText('Continuar com o Google')).toBeVisible();
  });

  test('redireciona rota /account para /login com return_to', async ({ page }) => {
    await page.goto('/account');
    await expect(page).toHaveURL(/.*login\?return_to=(%2Faccount|\/account)/);
    await expect(page.getByText('Acessar sua Conta')).toBeVisible();
  });

  test('alterna entre tela de login e cadastro', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Acessar sua Conta')).toBeVisible();

    await page.getByRole('button', { name: 'Criar conta' }).click();
    await expect(page.getByText('Criar Nova Conta')).toBeVisible();
    await expect(page.getByPlaceholder('Seu nome')).toBeVisible();

    await page.getByRole('button', { name: 'Fazer login' }).click();
    await expect(page.getByText('Acessar sua Conta')).toBeVisible();
  });
});
