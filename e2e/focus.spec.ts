import { test, expect } from '@playwright/test';

test.describe('Focus Sanctuary E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#focus');
  });

  test('switches timer presets and toggles timer state', async ({ page }) => {
    await expect(page.getByText('Deep Work Sanctuary')).toBeVisible();

    await page.getByText('Short Break 5m').click();
    await expect(page.getByText('05:00')).toBeVisible();

    const beginBtn = page.getByRole('button', { name: /begin focus/i });
    await beginBtn.click();
    await expect(page.getByRole('button', { name: /pause/i })).toBeVisible();
  });
});
