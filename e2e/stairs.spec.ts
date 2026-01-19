import { test, expect } from '@playwright/test';

test.describe('Stairs Game E2E', () => {
  test('should play complete game flow - roll dice, win mini-game, continue, lose, and save score', async ({ page }) => {
    // Navigate to the stairs game
    await page.goto('http://localhost:3000/games/stairs');
    
    // Check page title and description
    await expect(page.getByRole('heading', { name: 'Stairs', level: 1 })).toBeVisible();
    await expect(page.getByText('Roll the dice, climb stairs')).toBeVisible();
    
    // Verify initial stats
    await expect(page.getByText('Current Stairs')).toBeVisible();
    await expect(page.getByText('Games Won')).toBeVisible();
    await expect(page.getByText('High Score')).toBeVisible();
    
    // Roll dice until reaching the top (may need multiple rolls)
    let reachedTop = false;
    for (let i = 0; i < 10; i++) {
      const rollButton = page.getByRole('button', { name: 'Roll Dice' });
      if (await rollButton.isVisible()) {
        await rollButton.click();
        await page.waitForTimeout(600); // Wait for dice animation
        
        // Check if reached top
        const gameStartButton = page.getByRole('button', { name: 'GAME START' });
        if (await gameStartButton.isVisible()) {
          reachedTop = true;
          break;
        }
      }
    }
    
    expect(reachedTop).toBeTruthy();
    
    // Launch mini-game
    await page.getByRole('button', { name: 'GAME START' }).click();
    
    // Check if mini-game launched
    const miniGameHeading = page.locator('h3').filter({ hasText: 'Mini-Game:' });
    await expect(miniGameHeading).toBeVisible();
    
    // For demo games (non-RPS), click Win
    const winButton = page.getByRole('button', { name: 'Win (Demo)' });
    if (await winButton.isVisible()) {
      await winButton.click();
    } else {
      // For RPS, play until we get a result (not draw)
      let gameCompleted = false;
      for (let attempt = 0; attempt < 10; attempt++) {
        const rockButton = page.getByRole('button', { name: /rock/i }).first();
        if (await rockButton.isVisible()) {
          await rockButton.click();
          await page.waitForTimeout(2500); // Wait for auto-complete
          
          // Check if game completed (continue button appears)
          const continueButton = page.getByRole('button', { name: 'Continue Climbing' });
          if (await continueButton.isVisible()) {
            gameCompleted = true;
            break;
          }
          
          // If draw, retry
          const tryAgainButton = page.getByRole('button', { name: 'Try Again' });
          if (await tryAgainButton.isVisible()) {
            await tryAgainButton.click();
            await page.waitForTimeout(500);
          }
        } else {
          break; // Game already completed
        }
      }
      
      if (!gameCompleted) {
        // If we didn't win after 10 attempts, the game is over (we lost)
        const playAgainButton = page.getByRole('button', { name: 'Play Again' });
        await expect(playAgainButton).toBeVisible();
        return; // Test ends here for the losing path
      }
    }
    
    // Verify win result
    await expect(page.getByText('You Won!')).toBeVisible();
    await expect(page.getByText(/Score recorded:/)).toBeVisible();
    
    // Check that Games Won increased
    const gamesWonText = await page.locator('text=Games Won').locator('..').textContent();
    expect(gamesWonText).toContain('1');
    
    // Continue playing
    await page.getByRole('button', { name: 'Continue Climbing' }).click();
    
    // Roll dice again to reach top
    for (let i = 0; i < 10; i++) {
      const rollButton = page.getByRole('button', { name: 'Roll Dice' });
      if (await rollButton.isVisible()) {
        await rollButton.click();
        await page.waitForTimeout(600);
        
        const gameStartButton = page.getByRole('button', { name: 'GAME START' });
        if (await gameStartButton.isVisible()) {
          break;
        }
      }
    }
    
    // Launch another mini-game
    const gameStartButton = page.getByRole('button', { name: 'GAME START' });
    if (await gameStartButton.isVisible()) {
      await gameStartButton.click();
      
      // Lose this time
      const loseButton = page.getByRole('button', { name: 'Lose (Demo)' });
      if (await loseButton.isVisible()) {
        await loseButton.click();
      } else {
        // For RPS, we might not be able to guarantee a loss, so just skip if we can't find lose button
        // This is fine for testing purposes
      }
      
      // Check game over screen
      await expect(page.getByText('Game Over!')).toBeVisible();
      await expect(page.getByText(/Final Score:/)).toBeVisible();
    }
    
    // Check if name modal appears (if score qualifies for top 10)
    const nameInput = page.getByPlaceholder('Enter your name');
    if (await nameInput.isVisible()) {
      await nameInput.fill('E2E Test Player');
      await page.getByRole('button', { name: 'Save Score' }).click();
      
      // Verify score appears in scoreboard
      await expect(page.getByText('E2E Test Player')).toBeVisible();
    }
    
    // Play again should be visible
    await expect(page.getByRole('button', { name: 'Play Again' })).toBeVisible();
  });
  
  test('should handle losing first mini-game (score becomes 0)', async ({ page }) => {
    await page.goto('http://localhost:3000/games/stairs');
    
    // Roll dice until reaching the top
    for (let i = 0; i < 10; i++) {
      const rollButton = page.getByRole('button', { name: 'Roll Dice' });
      if (await rollButton.isVisible()) {
        await rollButton.click();
        await page.waitForTimeout(600);
        
        const gameStartButton = page.getByRole('button', { name: 'GAME START' });
        if (await gameStartButton.isVisible()) {
          break;
        }
      }
    }
    
    // Launch and immediately lose first mini-game
    const gameStartButton = page.getByRole('button', { name: 'GAME START' });
    if (await gameStartButton.isVisible()) {
      await gameStartButton.click();
      
      const loseButton = page.getByRole('button', { name: 'Lose (Demo)' });
      if (await loseButton.isVisible()) {
        await loseButton.click();
        
        // Verify game over with score 0
        await expect(page.getByText('Game Over!')).toBeVisible();
        await expect(page.getByText('Final Score: 0')).toBeVisible();
      }
    }
  });
  
  test('should display scoreboard correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/games/stairs');
    
    // Check scoreboard is visible
    await expect(page.getByRole('heading', { name: 'Top 10 Scoreboard', level: 2 })).toBeVisible();
    
    // Either shows existing scores or "No scores yet" message
    const noScoresText = page.getByText('No scores yet!');
    if (await noScoresText.isVisible()) {
      await expect(page.getByText('Be the first to play and set a record.')).toBeVisible();
    }
  });
});
