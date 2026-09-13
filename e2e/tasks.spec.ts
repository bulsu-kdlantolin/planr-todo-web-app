import { test, expect } from '@playwright/test';

test.describe('Tasks Workspace E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#tasks');
  });

  test('creates a new task via quick-add bar', async ({ page }) => {
    const quickInput = page.getByPlaceholder(/Quick add with natural language/i);
    await quickInput.fill('E2E Test Intentional Feature @urgent');
    await quickInput.press('Enter');

    await expect(page.getByText('E2E Test Intentional Feature').first()).toBeVisible();
    await expect(page.getByText(/urgent/i).first()).toBeVisible();
  });

  test('filters tasks by category tabs', async ({ page }) => {
    await page.getByRole('tab', { name: 'Work' }).click();
    await expect(page.getByRole('tab', { name: 'Work' })).toHaveAttribute('aria-selected', 'true');
  });
});

