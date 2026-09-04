import { test, expect } from '@playwright/test';

test.describe('Nebula Mail — 5 Required AI Assistant Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/inbox');
  });

  test('Scenario 1: Compose email from instruction with confirmation card', async ({ page }) => {
    const input = page.locator('input[placeholder="Type natural instruction..."]');
    await input.fill("Send an email to john@example.com with subject Meeting Tomorrow and body Let's meet at 3pm.");
    await input.press('Enter');

    // Visibly opens compose drawer
    await expect(page.locator('text=New Message')).toBeVisible();

    // Renders human confirmation card
    await expect(page.locator('text=Human Confirmation Required')).toBeVisible();
    await expect(page.locator('text=john@example.com')).toBeVisible();

    // Confirm & Send
    await page.click('button:has-text("Confirm & Send")');
    await expect(page.locator('text=Email successfully sent')).toBeVisible();
  });

  test('Scenario 2: Time-based search updates inbox list & smart filter chips', async ({ page }) => {
    const input = page.locator('input[placeholder="Type natural instruction..."]');
    await input.fill('Show me emails from the last 10 days.');
    await input.press('Enter');

    // Timeline step execution visible
    await expect(page.locator('text=AI Action Execution Timeline')).toBeVisible();

    // Smart Filter Chip rendered
    await expect(page.locator('text=After:')).toBeVisible();
  });

  test('Scenario 3: Person/topic search finds & opens Sarah\'s email detail', async ({ page }) => {
    const input = page.locator('input[placeholder="Type natural instruction..."]');
    await input.fill('Find the latest email from Sarah about the project update.');
    await input.press('Enter');

    // Opens email detail view automatically
    await expect(page.locator('text=Q3 Nebula Project Update & Next Steps')).toBeVisible();
  });

  test('Scenario 4: Context-aware reply uses open email ID & confirms', async ({ page }) => {
    // Open Sarah's email first
    await page.click('text=Q3 Nebula Project Update');

    const input = page.locator('input[placeholder="Type natural instruction..."]');
    await input.fill("Reply that I'll handle it tomorrow.");
    await input.press('Enter');

    // Prompts Confirmation card with reply details
    await expect(page.locator('text=Confirm Reply')).toBeVisible();
    await expect(page.locator('text=I\'ll handle it tomorrow.')).toBeVisible();
  });

  test('Scenario 5: Natural language compound filter renders active filter chips', async ({ page }) => {
    const input = page.locator('input[placeholder="Type natural instruction..."]');
    await input.fill('Show only unread emails from this week.');
    await input.press('Enter');

    // Renders active chips
    await expect(page.locator('text=Unread Only')).toBeVisible();
  });
});
