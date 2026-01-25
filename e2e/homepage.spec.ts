import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should show games grid and search', async ({ page }) => {
    await page.goto('/');

    // Check that core games are visible
    await expect(page.getByText('Up And Down')).toBeVisible();
    await expect(page.getByText('Rock-Paper-Scissors')).toBeVisible();

    // Check that search bar is present
    const searchInput = page.getByPlaceholder(/search games/i);
    await expect(searchInput).toBeVisible();
  });

  test('should filter games when searching', async ({ page }) => {
    await page.goto('/');

    // Get the search input
    const searchInput = page.getByPlaceholder(/search games/i);

    // Search for "number"
    await searchInput.fill('number');

    // Wait for debounce
    await page.waitForTimeout(300);

    // Only Up And Down should be visible
    await expect(page.getByText('Up And Down')).toBeVisible();
    
    // Other games should not be visible
    await expect(page.getByText('Rock-Paper-Scissors')).not.toBeVisible();
  });

  test('should show empty state when no games match search', async ({ page }) => {
    await page.goto('/');

    const searchInput = page.getByPlaceholder(/search games/i);
    
    // Search for something that doesn't exist
    await searchInput.fill('zzzzzzz');
    
    // Wait for debounce
    await page.waitForTimeout(300);

    // Should show empty state
    await expect(page.getByText(/no games found/i)).toBeVisible();
  });

  test('should clear search when clear button is clicked', async ({ page }) => {
    await page.goto('/');

    const searchInput = page.getByPlaceholder(/search games/i);
    
    // Type in search
    await searchInput.fill('number');
    
    // Click clear button
    await page.getByLabel('Clear search').click();
    
    // Input should be empty
    await expect(searchInput).toHaveValue('');
    
    // Wait for debounce
    await page.waitForTimeout(300);
    
    // All games should be visible again
    await expect(page.getByText('Up And Down')).toBeVisible();
    await expect(page.getByText('Rock-Paper-Scissors')).toBeVisible();
  });

  test('should navigate to game page when clicking a tile', async ({ page }) => {
    await page.goto('/');

    // Click on Up And Down game
    await page.getByText('Up And Down').first().click();

    // Should navigate to the game route
    await expect(page).toHaveURL('/games/up-and-down');
  });

  test('game tiles should have scoreboard badges', async ({ page }) => {
    await page.goto('/');

    // All our games have scoreboards, so check for the badge
    const scoreboardBadges = page.getByText('Scoreboard');
    await expect(scoreboardBadges.first()).toBeVisible();
  });

  test('should be keyboard accessible', async ({ page }) => {
    await page.goto('/');

    // Tab to search input
    await page.keyboard.press('Tab');
    
    // Type in search for rock
    await page.keyboard.type('rock');
    
    // Wait for debounce
    await page.waitForTimeout(300);
    
    // Only Rock-Paper-Scissors should be visible
    await expect(page.getByText('Rock-Paper-Scissors')).toBeVisible();
    await expect(page.getByText('Up And Down')).not.toBeVisible();
    
    // Tab to game tile and press Enter
    await page.keyboard.press('Tab'); // Move to clear button
    await page.keyboard.press('Tab'); // Move to first game tile
    await page.keyboard.press('Enter');
    
    // Should navigate
    await expect(page).toHaveURL('/games/rock-paper-scissors');
  });
});
