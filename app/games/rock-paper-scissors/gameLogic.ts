export type Choice = 'rock' | 'paper' | 'scissors';
export type Outcome = 'win' | 'lose' | 'draw';

export interface GameState {
  playerChoice: Choice | null;
  computerChoice: Choice | null;
  outcome: Outcome | null;
  consecutiveWins: number;
  isGameOver: boolean;
  finalScore: number;
}

export function getComputerChoice(): Choice {
  const choices: Choice[] = ['rock', 'paper', 'scissors'];
  const randomIndex = Math.floor(Math.random() * choices.length);
  return choices[randomIndex];
}

export function determineOutcome(playerChoice: Choice, computerChoice: Choice): Outcome {
  if (playerChoice === computerChoice) {
    return 'draw';
  }

  const winConditions: Record<Choice, Choice> = {
    rock: 'scissors',
    paper: 'rock',
    scissors: 'paper',
  };

  return winConditions[playerChoice] === computerChoice ? 'win' : 'lose';
}

export function initializeGame(): GameState {
  return {
    playerChoice: null,
    computerChoice: null,
    outcome: null,
    consecutiveWins: 0,
    isGameOver: false,
    finalScore: 0,
  };
}

export function processRound(
  state: GameState,
  playerChoice: Choice
): GameState {
  const computerChoice = getComputerChoice();
  const outcome = determineOutcome(playerChoice, computerChoice);

  if (outcome === 'lose') {
    return {
      ...state,
      playerChoice,
      computerChoice,
      outcome,
      isGameOver: true,
      finalScore: state.consecutiveWins,
    };
  }

  if (outcome === 'win') {
    return {
      ...state,
      playerChoice,
      computerChoice,
      outcome,
      consecutiveWins: state.consecutiveWins + 1,
      isGameOver: false,
    };
  }

  // Draw - no change to wins
  return {
    ...state,
    playerChoice,
    computerChoice,
    outcome,
    isGameOver: false,
  };
}
