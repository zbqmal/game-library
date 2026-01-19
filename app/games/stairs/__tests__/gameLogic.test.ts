import {
  initializeGame,
  rollDice,
  processDiceRoll,
  selectRandomMiniGame,
  launchMiniGame,
  processMiniGameResult,
  continueGame,
  getFinalScore,
  shouldRecordScore,
} from '../gameLogic';

describe('STAIRS Game Logic', () => {
  describe('initializeGame', () => {
    it('should initialize game with default values', () => {
      const state = initializeGame();
      
      expect(state.currentStairCount).toBe(0);
      expect(state.isAtTop).toBe(false);
      expect(state.canLaunchMiniGame).toBe(false);
      expect(state.miniGameActive).toBe(false);
      expect(state.miniGameType).toBe(null);
      expect(state.miniGameResult).toBe(null);
      expect(state.gamesPlayed).toBe(0);
      expect(state.gamesWon).toBe(0);
      expect(state.highestStairCount).toBe(0);
      expect(state.finalScore).toBe(0);
      expect(state.isGameOver).toBe(false);
      expect(state.lastDiceRoll).toBe(null);
    });
  });

  describe('rollDice', () => {
    it('should return a value between 1 and 6', () => {
      const results = new Set<number>();
      
      // Roll 100 times to ensure all values are possible
      for (let i = 0; i < 100; i++) {
        const roll = rollDice();
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(6);
        results.add(roll);
      }
      
      // Should have rolled multiple different values
      expect(results.size).toBeGreaterThan(1);
    });
  });

  describe('processDiceRoll', () => {
    it('should add dice value to stair count', () => {
      const state = initializeGame();
      const newState = processDiceRoll(state, 3);
      
      expect(newState.currentStairCount).toBe(3);
      expect(newState.lastDiceRoll).toBe(3);
      expect(newState.isAtTop).toBe(false);
      expect(newState.canLaunchMiniGame).toBe(false);
    });

    it('should reach top when stair count >= 5', () => {
      const state = initializeGame();
      const newState = processDiceRoll(state, 5);
      
      expect(newState.currentStairCount).toBe(5);
      expect(newState.isAtTop).toBe(true);
      expect(newState.canLaunchMiniGame).toBe(true);
    });

    it('should accumulate stair count across multiple rolls', () => {
      let state = initializeGame();
      state = processDiceRoll(state, 2);
      expect(state.currentStairCount).toBe(2);
      
      state = processDiceRoll(state, 3);
      expect(state.currentStairCount).toBe(5);
      expect(state.isAtTop).toBe(true);
    });

    it('should not process dice roll when mini-game is active', () => {
      const state = { ...initializeGame(), miniGameActive: true, currentStairCount: 5 };
      const newState = processDiceRoll(state, 3);
      
      expect(newState.currentStairCount).toBe(5);
      expect(newState.lastDiceRoll).toBe(null);
    });

    it('should not process dice roll when game is over', () => {
      const state = { ...initializeGame(), isGameOver: true, currentStairCount: 5 };
      const newState = processDiceRoll(state, 3);
      
      expect(newState.currentStairCount).toBe(5);
    });
  });

  describe('selectRandomMiniGame', () => {
    it('should select one of the available mini-games', () => {
      const validGames = ['rps', 'treasure-hunt', 'paroma', 'swimming-race'];
      
      for (let i = 0; i < 20; i++) {
        const game = selectRandomMiniGame();
        expect(validGames).toContain(game);
      }
    });

    it('should select different games over multiple calls', () => {
      const results = new Set<string>();
      
      for (let i = 0; i < 50; i++) {
        results.add(selectRandomMiniGame());
      }
      
      // Should have selected multiple different games
      expect(results.size).toBeGreaterThan(1);
    });
  });

  describe('launchMiniGame', () => {
    it('should launch a mini-game when at top', () => {
      const state = {
        ...initializeGame(),
        currentStairCount: 5,
        isAtTop: true,
        canLaunchMiniGame: true,
      };
      
      const newState = launchMiniGame(state);
      
      expect(newState.miniGameActive).toBe(true);
      expect(newState.miniGameType).not.toBe(null);
      expect(newState.canLaunchMiniGame).toBe(false);
    });

    it('should not launch mini-game when not at top', () => {
      const state = initializeGame();
      const newState = launchMiniGame(state);
      
      expect(newState.miniGameActive).toBe(false);
      expect(newState.miniGameType).toBe(null);
    });

    it('should not launch mini-game when already active', () => {
      const state = {
        ...initializeGame(),
        miniGameActive: true,
        canLaunchMiniGame: true,
      };
      
      const newState = launchMiniGame(state);
      expect(newState).toBe(state); // Should return same state
    });

    it('should not launch mini-game when game is over', () => {
      const state = {
        ...initializeGame(),
        isGameOver: true,
        canLaunchMiniGame: true,
      };
      
      const newState = launchMiniGame(state);
      expect(newState).toBe(state);
    });
  });

  describe('processMiniGameResult', () => {
    describe('First game scenario', () => {
      it('should end game with score 0 if first game is lost', () => {
        const state = {
          ...initializeGame(),
          miniGameActive: true,
          miniGameType: 'rps' as const,
          currentStairCount: 5,
        };
        
        const newState = processMiniGameResult(state, 'lose');
        
        expect(newState.gamesPlayed).toBe(1);
        expect(newState.gamesWon).toBe(0);
        expect(newState.finalScore).toBe(0);
        expect(newState.isGameOver).toBe(true);
        expect(newState.miniGameActive).toBe(false);
        expect(newState.miniGameResult).toBe('lose');
      });

      it('should continue game if first game is won', () => {
        const state = {
          ...initializeGame(),
          miniGameActive: true,
          miniGameType: 'rps' as const,
          currentStairCount: 7,
        };
        
        const newState = processMiniGameResult(state, 'win');
        
        expect(newState.gamesPlayed).toBe(1);
        expect(newState.gamesWon).toBe(1);
        expect(newState.highestStairCount).toBe(7);
        expect(newState.isGameOver).toBe(false);
        expect(newState.miniGameActive).toBe(false);
        expect(newState.isAtTop).toBe(false);
        expect(newState.miniGameResult).toBe('win');
      });
    });

    describe('Subsequent games', () => {
      it('should update highest stair count when winning', () => {
        const state = {
          ...initializeGame(),
          miniGameActive: true,
          miniGameType: 'rps' as const,
          currentStairCount: 10,
          gamesPlayed: 1,
          gamesWon: 1,
          highestStairCount: 7,
        };
        
        const newState = processMiniGameResult(state, 'win');
        
        expect(newState.gamesPlayed).toBe(2);
        expect(newState.gamesWon).toBe(2);
        expect(newState.highestStairCount).toBe(10);
        expect(newState.isGameOver).toBe(false);
      });

      it('should keep highest stair count if current is lower', () => {
        const state = {
          ...initializeGame(),
          miniGameActive: true,
          miniGameType: 'rps' as const,
          currentStairCount: 6,
          gamesPlayed: 1,
          gamesWon: 1,
          highestStairCount: 10,
        };
        
        const newState = processMiniGameResult(state, 'win');
        
        expect(newState.highestStairCount).toBe(10);
      });

      it('should end game with highest score if lost after winning', () => {
        const state = {
          ...initializeGame(),
          miniGameActive: true,
          miniGameType: 'rps' as const,
          currentStairCount: 8,
          gamesPlayed: 2,
          gamesWon: 2,
          highestStairCount: 10,
        };
        
        const newState = processMiniGameResult(state, 'lose');
        
        expect(newState.gamesPlayed).toBe(3);
        expect(newState.gamesWon).toBe(2);
        expect(newState.finalScore).toBe(10);
        expect(newState.isGameOver).toBe(true);
        expect(newState.miniGameActive).toBe(false);
      });
    });

    it('should not process result when mini-game is not active', () => {
      const state = initializeGame();
      const newState = processMiniGameResult(state, 'win');
      
      expect(newState).toBe(state);
    });
  });

  describe('continueGame', () => {
    it('should reset mini-game result and allow new dice roll', () => {
      const state = {
        ...initializeGame(),
        miniGameResult: 'win' as const,
        miniGameType: 'rps' as const,
        lastDiceRoll: 3,
        gamesWon: 1,
        gamesPlayed: 1,
        highestStairCount: 7,
        currentStairCount: 7,
      };
      
      const newState = continueGame(state);
      
      expect(newState.miniGameResult).toBe(null);
      expect(newState.miniGameType).toBe(null);
      expect(newState.lastDiceRoll).toBe(null);
      expect(newState.gamesWon).toBe(1); // Should keep previous wins
      expect(newState.highestStairCount).toBe(7); // Should keep high score
    });

    it('should not continue when game is over', () => {
      const state = { ...initializeGame(), isGameOver: true };
      const newState = continueGame(state);
      
      expect(newState).toBe(state);
    });

    it('should not continue when mini-game is active', () => {
      const state = { ...initializeGame(), miniGameActive: true };
      const newState = continueGame(state);
      
      expect(newState).toBe(state);
    });
  });

  describe('getFinalScore', () => {
    it('should return the final score', () => {
      const state = { ...initializeGame(), finalScore: 15 };
      expect(getFinalScore(state)).toBe(15);
    });

    it('should return 0 for initial state', () => {
      const state = initializeGame();
      expect(getFinalScore(state)).toBe(0);
    });
  });

  describe('shouldRecordScore', () => {
    it('should return true when game is over and games were played', () => {
      const state = {
        ...initializeGame(),
        isGameOver: true,
        gamesPlayed: 1,
      };
      
      expect(shouldRecordScore(state)).toBe(true);
    });

    it('should return false when game is not over', () => {
      const state = {
        ...initializeGame(),
        isGameOver: false,
        gamesPlayed: 1,
      };
      
      expect(shouldRecordScore(state)).toBe(false);
    });

    it('should return false when no games were played', () => {
      const state = {
        ...initializeGame(),
        isGameOver: true,
        gamesPlayed: 0,
      };
      
      expect(shouldRecordScore(state)).toBe(false);
    });
  });

  describe('Game flow integration', () => {
    it('should handle complete winning game flow', () => {
      let state = initializeGame();
      
      // Roll dice to reach top
      state = processDiceRoll(state, 6);
      expect(state.currentStairCount).toBe(6);
      expect(state.canLaunchMiniGame).toBe(true);
      
      // Launch mini-game
      state = launchMiniGame(state);
      expect(state.miniGameActive).toBe(true);
      
      // Win mini-game
      state = processMiniGameResult(state, 'win');
      expect(state.gamesWon).toBe(1);
      expect(state.highestStairCount).toBe(6);
      expect(state.isGameOver).toBe(false);
      
      // Continue playing
      state = continueGame(state);
      
      // Roll again
      state = processDiceRoll(state, 4);
      expect(state.currentStairCount).toBe(10);
      
      // Launch and win again
      state = launchMiniGame(state);
      state = processMiniGameResult(state, 'win');
      expect(state.highestStairCount).toBe(10);
      
      // Continue and lose
      state = continueGame(state);
      state = processDiceRoll(state, 3);
      state = launchMiniGame(state);
      state = processMiniGameResult(state, 'lose');
      
      expect(state.isGameOver).toBe(true);
      expect(state.finalScore).toBe(10);
      expect(shouldRecordScore(state)).toBe(true);
    });

    it('should handle losing first game scenario', () => {
      let state = initializeGame();
      
      // Roll dice to reach top
      state = processDiceRoll(state, 5);
      
      // Launch and lose first game
      state = launchMiniGame(state);
      state = processMiniGameResult(state, 'lose');
      
      expect(state.isGameOver).toBe(true);
      expect(state.finalScore).toBe(0);
      expect(shouldRecordScore(state)).toBe(true);
    });
  });
});
