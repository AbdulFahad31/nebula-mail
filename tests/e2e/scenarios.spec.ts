import { test, expect } from '@playwright/test';

test.describe('Nebula Mail', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/inbox');
  });

  test('Scenario 1: Compose email', async ({ page }) => {
    const input = page.getByPlaceholder('Command assistant...');
    await input.fill('Send an email to john@example.com with subject Meeting Tomorrow and body Let us meet at 3pm.');
    await input.press('Enter');
    await expect(page.locator('text=Authorization required')).toBeVisible();
    await expect(page.getByText('john@example.com', { exact: true })).toBeVisible();
  });

  test('Scenario 2: Time search', async ({ page }) => {
    const input = page.getByPlaceholder('Command assistant...');
    await input.fill('Show me emails from the last 10 days.');
    await input.press('Enter');
    await expect(page.locator('text=After:')).toBeVisible();
  });

  test('Scenario 3: Person topic search', async ({ page }) => {
    const input = page.getByPlaceholder('Command assistant...');
    await input.fill('Find the latest email from Sarah about the project update.');
    await input.press('Enter');
    await expect(page.locator('text=Q3 Nebula Project Update')).toBeVisible();
  });

  test('Scenario 4: Context reply', async ({ page }) => {
    await page.click('text=Q3 Nebula Project Update');
    const input = page.getByPlaceholder('Command assistant...');
    await input.fill('Reply that I will handle it tomorrow.');
    await input.press('Enter');
    await expect(page.locator('text=Authorization required')).toBeVisible();
  });

  test('Scenario 5: Compound filter', async ({ page }) => {
    const input = page.getByPlaceholder('Command assistant...');
    await input.fill('Show only unread emails from this week.');
    await input.press('Enter');
    await expect(page.locator('text=Unread Only')).toBeVisible();
  });

  test('Scenario 6: Attachment support in AI confirmation card', async ({ page }) => {
    const input = page.getByPlaceholder('Command assistant...');
    await input.fill('Send email to alex@example.com with project signoff');
    await input.press('Enter');
    await expect(page.locator('text=Authorization required')).toBeVisible();

    // Verify "Attach file" button is present on confirmation card
    const attachBtn = page.getByRole('button', { name: /Attach file|Attach more files/i });
    await expect(attachBtn).toBeVisible();

    // Attach sample file using file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'project_signoff_doc.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF Content for signoff'),
    });

    // Verify attachment chip is rendered on the confirmation card
    await expect(page.getByText('project_signoff_doc.pdf')).toBeVisible();

    // Click Authorize & send
    await page.click('button:has-text("Authorize & send")');

    // Confirm card closes and sent view updates
    await expect(page.locator('text=Authorization required')).not.toBeVisible();
  });
});
