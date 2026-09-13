import { test, expect } from '@playwright/test';

test.describe('Focus Sanctuary E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#focus');
  });

  test('switches timer presets and toggles timer state', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /focus timer/i })).toBeVisible();

    await page.getByRole('button', { name: '5 Min Break', exact: true }).click();
    await expect(page.getByText('05:00')).toBeVisible();

    const startBtn = page.getByRole('button', { name: /start focus/i });
    await startBtn.click();
    await expect(page.getByRole('button', { name: 'Pause focus timer' })).toBeVisible();
  });
});

