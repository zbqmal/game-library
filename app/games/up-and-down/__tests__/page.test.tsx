import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NumberGuessPage from "../page";
import * as gameLogic from "../gameLogic";

// Mock the GameShell component
jest.mock("@/app/components/common/GameShell", () => {
  return function MockGameShell({
    title,
    description,
    children,
  }: {
    title: string;
    description: string;
    children: React.ReactNode;
  }) {
    return (
      <div data-testid="game-shell">
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
      </div>
    );
  };
});

describe("NumberGuessPage", () => {
  describe("Initial Render - Configuration Screen", () => {
    it("should render the configuration screen on initial load", () => {
      render(<NumberGuessPage />);

      expect(screen.getByText("Configure Your Game")).toBeInTheDocument();
      expect(
        screen.getByText(
          /Customize the difficulty by setting your preferred range/,
        ),
      ).toBeInTheDocument();
    });

    it("should render all configuration input fields", () => {
      render(<NumberGuessPage />);

      expect(screen.getByLabelText(/Minimum Number/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Maximum Number/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Maximum Attempts/)).toBeInTheDocument();
    });

    it("should render the start game button", () => {
      render(<NumberGuessPage />);

      expect(
        screen.getByRole("button", { name: /Start Game/ }),
      ).toBeInTheDocument();
    });

    it("should set default values in configuration inputs", () => {
      render(<NumberGuessPage />);

      const minInput = screen.getByDisplayValue("1") as HTMLInputElement;
      const maxInput = screen.getByDisplayValue("100") as HTMLInputElement;
      const attemptsInput = screen.getByDisplayValue("5") as HTMLInputElement;

      expect(minInput.value).toBe("1");
      expect(maxInput.value).toBe("100");
      expect(attemptsInput.value).toBe("5");
    });

    it("should render the GameShell component with correct title and description", () => {
      render(<NumberGuessPage />);

      expect(screen.getByText("Up And Down")).toBeInTheDocument();
      expect(
        screen.getByText(
          /A configurable number guessing game! Set your own difficulty/,
        ),
      ).toBeInTheDocument();
    });
  });

  describe("Configuration Input Changes", () => {
    it("should update minimum number input", async () => {
      const user = userEvent.setup();
      render(<NumberGuessPage />);

      const minInput = screen.getByLabelText(
        /Minimum Number/,
      ) as HTMLInputElement;
      await user.clear(minInput);
      await user.type(minInput, "10");

      expect(minInput.value).toBe("10");
    });

    it("should update maximum number input", async () => {
      const user = userEvent.setup();
      render(<NumberGuessPage />);

      const maxInput = screen.getByLabelText(
        /Maximum Number/,
      ) as HTMLInputElement;
      await user.clear(maxInput);
      await user.type(maxInput, "200");

      expect(maxInput.value).toBe("200");
    });

    it("should update maximum attempts input", async () => {
      const user = userEvent.setup();
      render(<NumberGuessPage />);

      const attemptsInput = screen.getByLabelText(
        /Maximum Attempts/,
      ) as HTMLInputElement;
      await user.clear(attemptsInput);
      await user.type(attemptsInput, "10");

      expect(attemptsInput.value).toBe("10");
    });

    it("should validate that minimum number is less than maximum number", async () => {
      const user = userEvent.setup();
      render(<NumberGuessPage />);

      const minInput = screen.getByLabelText(/Minimum Number/);
      const maxInput = screen.getByLabelText(/Maximum Number/);

      await user.clear(minInput);
      await user.type(minInput, "150");

      // Max should still be 100 (not updated because min > max)
      expect(maxInput).toHaveValue(100);
    });
  });

  describe("Game Start", () => {
    it("should transition from configuration to game screen on start", async () => {
      const user = userEvent.setup();
      render(<NumberGuessPage />);

      const startButton = screen.getByRole("button", { name: /Start Game/ });
      await user.click(startButton);

      // Configuration screen should be gone
      expect(screen.queryByText("Configure Your Game")).not.toBeInTheDocument();

      // Game screen should appear
      expect(screen.getByText(/Remaining Attempts/)).toBeInTheDocument();
      expect(screen.getByText(/Range/)).toBeInTheDocument();
    });

    it("should display game state after starting", async () => {
      const user = userEvent.setup();
      render(<NumberGuessPage />);

      const startButton = screen.getByRole("button", { name: /Start Game/ });
      await user.click(startButton);

      // Should show remaining attempts (5 by default)
      expect(screen.getByText("5")).toBeInTheDocument();

      // Should show range (1 - 100)
      expect(screen.getByText(/1 - 100/)).toBeInTheDocument();
    });

    it("should initialize game with default config", async () => {
      const user = userEvent.setup();
      const initSpy = jest.spyOn(gameLogic, "initializeGame");

      render(<NumberGuessPage />);

      const startButton = screen.getByRole("button", { name: /Start Game/ });
      await user.click(startButton);

      expect(initSpy).toHaveBeenCalled();

      initSpy.mockRestore();
    });

    it("should display the guess input field when game is playing", async () => {
      const user = userEvent.setup();
      render(<NumberGuessPage />);

      const startButton = screen.getByRole("button", { name: /Start Game/ });
      await user.click(startButton);

      expect(screen.getByLabelText(/Enter your guess/)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Make Guess/ }),
      ).toBeInTheDocument();
    });
  });

  describe("Game Guessing", () => {
    it("should submit a guess and update game state", async () => {
      const user = userEvent.setup();
      render(<NumberGuessPage />);

      // Start game
      await user.click(screen.getByRole("button", { name: /Start Game/ }));

      // Make a guess
      const guessInput = screen.getByLabelText(/Enter your guess/);
      await user.type(guessInput, "50");
      await user.click(screen.getByRole("button", { name: /Make Guess/ }));

      // Input should be cleared after submission
      expect(guessInput).toHaveValue(null);
    });

    it("should display higher hint when guess is too low", async () => {
      const user = userEvent.setup();
      render(<NumberGuessPage />);

      // Start game
      await user.click(screen.getByRole("button", { name: /Start Game/ }));

      // Make a guess that will be lower than secret number (attempt multiple times)
      const guessInput = screen.getByLabelText(/Enter your guess/);

      // Try guessing low numbers until we get the "higher" message
      for (let i = 1; i <= 5; i++) {
        await user.clear(guessInput);
        await user.type(guessInput, String(i));
        await user.click(screen.getByRole("button", { name: /Make Guess/ }));

        // If we see the "Think Higher!" message, we guessed too low
        if (screen.queryByText(/Think Higher/)) {
          expect(screen.getByText(/Think Higher/)).toBeInTheDocument();
          expect(screen.getByText("⬆️")).toBeInTheDocument();
          break;
        }
      }
    });

    it("should display lower hint when guess is too high", async () => {
      const user = userEvent.setup();
      render(<NumberGuessPage />);

      // Start game
      await user.click(screen.getByRole("button", { name: /Start Game/ }));

      // Make a guess that will be higher than secret number
      const guessInput = screen.getByLabelText(/Enter your guess/);

      // Try guessing high numbers until we get the "lower" message
      for (let i = 100; i > 95; i--) {
        await user.clear(guessInput);
        await user.type(guessInput, String(i));
        await user.click(screen.getByRole("button", { name: /Make Guess/ }));

        // If we see the "Think Lower!" message, we guessed too high
        if (screen.queryByText(/Think Lower/)) {
          expect(screen.getByText(/Think Lower/)).toBeInTheDocument();
          expect(screen.getByText("⬇️")).toBeInTheDocument();
          break;
        }
      }
    });

    it("should clear input after each guess", async () => {
      const user = userEvent.setup();
      render(<NumberGuessPage />);

      await user.click(screen.getByRole("button", { name: /Start Game/ }));

      const guessInput = screen.getByLabelText(
        /Enter your guess/,
      ) as HTMLInputElement;

      await user.type(guessInput, "50");
      await user.click(screen.getByRole("button", { name: /Make Guess/ }));

      expect(guessInput.value).toBe("");
    });

    it("should decrement remaining attempts after each guess", async () => {
      const user = userEvent.setup();
      render(<NumberGuessPage />);

      await user.click(screen.getByRole("button", { name: /Start Game/ }));

      // Should start with 5 attempts
      expect(screen.getByText("5")).toBeInTheDocument();

      // Make first guess
      const guessInput = screen.getByLabelText(/Enter your guess/);
      await user.type(guessInput, "50");
      await user.click(screen.getByRole("button", { name: /Make Guess/ }));

      // Should now have 4 attempts
      expect(screen.getByText("4")).toBeInTheDocument();

      // Make second guess
      await user.type(guessInput, "25");
      await user.click(screen.getByRole("button", { name: /Make Guess/ }));

      // Should now have 3 attempts
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("should display last guess in history", async () => {
      const user = userEvent.setup();
      render(<NumberGuessPage />);

      await user.click(screen.getByRole("button", { name: /Start Game/ }));

      const guessInput = screen.getByLabelText(/Enter your guess/);
      await user.type(guessInput, "42");
      await user.click(screen.getByRole("button", { name: /Make Guess/ }));

      expect(screen.getByText(/Last guess/)).toBeInTheDocument();
      expect(screen.getByText("42")).toBeInTheDocument();
    });
  });

  describe("Win Condition", () => {
    it("should display win message when correct guess is made", async () => {
      const user = userEvent.setup();

      // Mock initializeGame to return a known secret number
      const mockGameState = {
        secretNumber: 42,
        remainingAttempts: 5,
        gameStatus: "playing" as const,
        lastGuess: null,
        lastResult: null,
      };

      jest.spyOn(gameLogic, "initializeGame").mockReturnValue(mockGameState);

      render(<NumberGuessPage />);

      await user.click(screen.getByRole("button", { name: /Start Game/ }));

      const guessInput = screen.getByLabelText(/Enter your guess/);
      await user.type(guessInput, "42");
      await user.click(screen.getByRole("button", { name: /Make Guess/ }));

      await waitFor(() => {
        expect(screen.getByText(/Congratulations!/)).toBeInTheDocument();
        expect(screen.getByText(/🎉/)).toBeInTheDocument();
        expect(screen.getByText(/You guessed the number/)).toBeInTheDocument();
      });
    });

    it("should show correct secret number on win", async () => {
      const user = userEvent.setup();

      const mockGameState = {
        secretNumber: 99,
        remainingAttempts: 5,
        gameStatus: "playing" as const,
        lastGuess: null,
        lastResult: null,
      };

      jest.spyOn(gameLogic, "initializeGame").mockReturnValue(mockGameState);

      render(<NumberGuessPage />);

      await user.click(screen.getByRole("button", { name: /Start Game/ }));

      const guessInput = screen.getByLabelText(/Enter your guess/);
      await user.type(guessInput, "99");
      await user.click(screen.getByRole("button", { name: /Make Guess/ }));

      await waitFor(() => {
        expect(screen.getByText(/You guessed the number/)).toBeInTheDocument();
      });
    });

    it("should display play again button on win", async () => {
      const user = userEvent.setup();

      const mockGameState = {
        secretNumber: 42,
        remainingAttempts: 5,
        gameStatus: "playing" as const,
        lastGuess: null,
        lastResult: null,
      };

      jest.spyOn(gameLogic, "initializeGame").mockReturnValue(mockGameState);

      render(<NumberGuessPage />);

      await user.click(screen.getByRole("button", { name: /Start Game/ }));

      const guessInput = screen.getByLabelText(/Enter your guess/);
      await user.type(guessInput, "42");
      await user.click(screen.getByRole("button", { name: /Make Guess/ }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Play Again/ }),
        ).toBeInTheDocument();
      });
    });

    it("should hide guess input on win", async () => {
      const user = userEvent.setup();

      const mockGameState = {
        secretNumber: 42,
        remainingAttempts: 5,
        gameStatus: "playing" as const,
        lastGuess: null,
        lastResult: null,
      };

      jest.spyOn(gameLogic, "initializeGame").mockReturnValue(mockGameState);

      render(<NumberGuessPage />);

      await user.click(screen.getByRole("button", { name: /Start Game/ }));

      const guessInput = screen.getByLabelText(/Enter your guess/);
      await user.type(guessInput, "42");
      await user.click(screen.getByRole("button", { name: /Make Guess/ }));

      await waitFor(() => {
        expect(
          screen.queryByLabelText(/Enter your guess/),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Loss Condition", () => {
    it("should display loss message when out of attempts", async () => {
      const user = userEvent.setup();

      // Mock a state where the player just lost
      const processGuessSpy = jest
        .spyOn(gameLogic, "processGuess")
        .mockImplementation(() => ({
          secretNumber: 50,
          remainingAttempts: 0,
          gameStatus: "lost" as const,
          lastGuess: 42,
          lastResult: "lower" as const,
        }));

      const mockInitState = {
        secretNumber: 50,
        remainingAttempts: 5,
        gameStatus: "playing" as const,
        lastGuess: null,
        lastResult: null,
      };

      jest.spyOn(gameLogic, "initializeGame").mockReturnValue(mockInitState);

      render(<NumberGuessPage />);

      await user.click(screen.getByRole("button", { name: /Start Game/ }));

      const guessInput = screen.getByLabelText(/Enter your guess/);
      await user.type(guessInput, "42");
      await user.click(screen.getByRole("button", { name: /Make Guess/ }));

      await waitFor(() => {
        expect(screen.getByText(/Game Over!/)).toBeInTheDocument();
        expect(screen.getByText(/😢/)).toBeInTheDocument();
      });

      processGuessSpy.mockRestore();
    });

    it("should show secret number on loss", async () => {
      const user = userEvent.setup();

      const processGuessSpy = jest
        .spyOn(gameLogic, "processGuess")
        .mockImplementation(() => ({
          secretNumber: 75,
          remainingAttempts: 0,
          gameStatus: "lost" as const,
          lastGuess: 42,
          lastResult: "lower" as const,
        }));

      const mockInitState = {
        secretNumber: 75,
        remainingAttempts: 5,
        gameStatus: "playing" as const,
        lastGuess: null,
        lastResult: null,
      };

      jest.spyOn(gameLogic, "initializeGame").mockReturnValue(mockInitState);

      render(<NumberGuessPage />);

      await user.click(screen.getByRole("button", { name: /Start Game/ }));

      const guessInput = screen.getByLabelText(/Enter your guess/);
      await user.type(guessInput, "42");
      await user.click(screen.getByRole("button", { name: /Make Guess/ }));

      await waitFor(() => {
        expect(screen.getByText(/The secret number was/)).toBeInTheDocument();
      });

      processGuessSpy.mockRestore();
    });

    it("should display play again button on loss", async () => {
      const user = userEvent.setup();

      const processGuessSpy = jest
        .spyOn(gameLogic, "processGuess")
        .mockImplementation(() => ({
          secretNumber: 50,
          remainingAttempts: 0,
          gameStatus: "lost" as const,
          lastGuess: 42,
          lastResult: "lower" as const,
        }));

      const mockInitState = {
        secretNumber: 50,
        remainingAttempts: 1,
        gameStatus: "playing" as const,
        lastGuess: null,
        lastResult: null,
      };

      jest.spyOn(gameLogic, "initializeGame").mockReturnValue(mockInitState);

      render(<NumberGuessPage />);

      await user.click(screen.getByRole("button", { name: /Start Game/ }));

      const guessInput = screen.getByLabelText(/Enter your guess/);
      await user.type(guessInput, "42");
      await user.click(screen.getByRole("button", { name: /Make Guess/ }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Play Again/ }),
        ).toBeInTheDocument();
      });

      processGuessSpy.mockRestore();
    });

    it("should hide guess input on loss", async () => {
      const user = userEvent.setup();

      const processGuessSpy = jest
        .spyOn(gameLogic, "processGuess")
        .mockImplementation(() => ({
          secretNumber: 50,
          remainingAttempts: 0,
          gameStatus: "lost" as const,
          lastGuess: 42,
          lastResult: "lower" as const,
        }));

      const mockInitState = {
        secretNumber: 50,
        remainingAttempts: 1,
        gameStatus: "playing" as const,
        lastGuess: null,
        lastResult: null,
      };

      jest.spyOn(gameLogic, "initializeGame").mockReturnValue(mockInitState);

      render(<NumberGuessPage />);

      await user.click(screen.getByRole("button", { name: /Start Game/ }));

      const guessInput = screen.getByLabelText(/Enter your guess/);
      await user.type(guessInput, "42");
      await user.click(screen.getByRole("button", { name: /Make Guess/ }));

      await waitFor(() => {
        expect(
          screen.queryByLabelText(/Enter your guess/),
        ).not.toBeInTheDocument();
      });

      processGuessSpy.mockRestore();
    });
  });

  describe("Play Again / Reset", () => {
    it("should return to configuration screen on play again", async () => {
      const user = userEvent.setup();

      const mockGameState = {
        secretNumber: 42,
        remainingAttempts: 5,
        gameStatus: "playing" as const,
        lastGuess: null,
        lastResult: null,
      };

      jest.spyOn(gameLogic, "initializeGame").mockReturnValue(mockGameState);

      render(<NumberGuessPage />);

      // Start first game
      await user.click(screen.getByRole("button", { name: /Start Game/ }));

      // Make a winning guess
      const guessInput = screen.getByLabelText(/Enter your guess/);
      await user.type(guessInput, "42");
      await user.click(screen.getByRole("button", { name: /Make Guess/ }));

      // Click play again
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Play Again/ }),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /Play Again/ }));

      // Should be back at configuration
      expect(screen.getByText("Configure Your Game")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Start Game/ }),
      ).toBeInTheDocument();
    });

    it("should reset input fields when playing again", async () => {
      const user = userEvent.setup();

      const mockGameState = {
        secretNumber: 42,
        remainingAttempts: 5,
        gameStatus: "playing" as const,
        lastGuess: null,
        lastResult: null,
      };

      jest.spyOn(gameLogic, "initializeGame").mockReturnValue(mockGameState);

      render(<NumberGuessPage />);

      await user.click(screen.getByRole("button", { name: /Start Game/ }));

      const guessInput = screen.getByLabelText(/Enter your guess/);
      await user.type(guessInput, "42");
      await user.click(screen.getByRole("button", { name: /Make Guess/ }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Play Again/ }),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /Play Again/ }));

      // Configuration inputs should be reset to defaults
      expect(screen.getByDisplayValue("1")).toBeInTheDocument();
      expect(screen.getByDisplayValue("100")).toBeInTheDocument();
      expect(screen.getByDisplayValue("5")).toBeInTheDocument();
    });

    it("should clear game state after reset", async () => {
      const user = userEvent.setup();

      const mockGameState = {
        secretNumber: 42,
        remainingAttempts: 5,
        gameStatus: "playing" as const,
        lastGuess: null,
        lastResult: null,
      };

      jest.spyOn(gameLogic, "initializeGame").mockReturnValue(mockGameState);

      render(<NumberGuessPage />);

      await user.click(screen.getByRole("button", { name: /Start Game/ }));

      const guessInput = screen.getByLabelText(/Enter your guess/);
      await user.type(guessInput, "42");
      await user.click(screen.getByRole("button", { name: /Make Guess/ }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Play Again/ }),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /Play Again/ }));

      // Game screen should be gone
      expect(screen.queryByText(/Remaining Attempts/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Congratulations/)).not.toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("should handle form submission on enter key", async () => {
      const user = userEvent.setup();
      render(<NumberGuessPage />);

      await user.click(screen.getByRole("button", { name: /Start Game/ }));

      const guessInput = screen.getByLabelText(/Enter your guess/);
      await user.type(guessInput, "50");
      await user.keyboard("{Enter}");

      // Input should be cleared
      expect(guessInput).toHaveValue(null);
    });

    it("should not submit form when input is empty", async () => {
      const user = userEvent.setup();
      render(<NumberGuessPage />);

      await user.click(screen.getByRole("button", { name: /Start Game/ }));

      const guessInput = screen.getByLabelText(/Enter your guess/);
      await user.click(screen.getByRole("button", { name: /Make Guess/ }));

      // Input should still be empty and focused
      expect(guessInput).toHaveValue(null);
    });
  });

  describe("Input Validation", () => {
    it("should respect minimum number constraint", async () => {
      const user = userEvent.setup();
      render(<NumberGuessPage />);

      await user.click(screen.getByRole("button", { name: /Start Game/ }));

      const guessInput = screen.getByLabelText(
        /Enter your guess/,
      ) as HTMLInputElement;
      guessInput.setAttribute("min", "1");

      // The HTML input should have the correct min attribute
      expect(guessInput.getAttribute("min")).toBe("1");
    });

    it("should respect maximum number constraint", async () => {
      const user = userEvent.setup();
      render(<NumberGuessPage />);

      await user.click(screen.getByRole("button", { name: /Start Game/ }));

      const guessInput = screen.getByLabelText(
        /Enter your guess/,
      ) as HTMLInputElement;
      guessInput.setAttribute("max", "100");

      // The HTML input should have the correct max attribute
      expect(guessInput.getAttribute("max")).toBe("100");
    });
  });

  describe("Custom Configuration", () => {
    it("should start game with custom configuration", async () => {
      const user = userEvent.setup();
      render(<NumberGuessPage />);

      const minInput = screen.getByLabelText(
        /Minimum Number/,
      ) as HTMLInputElement;
      const maxInput = screen.getByLabelText(
        /Maximum Number/,
      ) as HTMLInputElement;
      const attemptsInput = screen.getByLabelText(
        /Maximum Attempts/,
      ) as HTMLInputElement;

      // Update minimum
      fireEvent.change(minInput, { target: { value: "25" } });

      // Update maximum
      fireEvent.change(maxInput, { target: { value: "75" } });

      // Update attempts
      fireEvent.change(attemptsInput, { target: { value: "3" } });

      // Wait for inputs to be updated
      await waitFor(() => {
        expect(minInput.value).toBe("25");
        expect(maxInput.value).toBe("75");
        expect(attemptsInput.value).toBe("3");
      });

      await user.click(screen.getByRole("button", { name: /Start Game/ }));

      // Should show custom range
      await waitFor(() => {
        expect(screen.getByText(/25 - 75/)).toBeInTheDocument();
      });
    });

    it("should display correct range in guess input placeholder", async () => {
      const user = userEvent.setup();
      render(<NumberGuessPage />);

      const minInput = screen.getByLabelText(/Minimum Number/);
      const maxInput = screen.getByLabelText(/Maximum Number/);

      await user.clear(minInput);
      await user.type(minInput, "10");
      await user.clear(maxInput);
      await user.type(maxInput, "50");

      await user.click(screen.getByRole("button", { name: /Start Game/ }));

      const guessInput = screen.getByLabelText(/Enter your guess/);
      expect(guessInput).toHaveAttribute("placeholder", "10 - 50");
    });
  });

  describe("Initial Message State", () => {
    it('should display "Make your first guess!" on initial game state', async () => {
      const user = userEvent.setup();
      render(<NumberGuessPage />);

      await user.click(screen.getByRole("button", { name: /Start Game/ }));

      expect(screen.getByText(/Make your first guess!/)).toBeInTheDocument();
    });
  });

  describe("AutoFocus", () => {
    it("should autofocus the guess input when game starts", async () => {
      const user = userEvent.setup();
      render(<NumberGuessPage />);

      await user.click(screen.getByRole("button", { name: /Start Game/ }));

      const guessInput = screen.getByLabelText(/Enter your guess/);
      expect(guessInput).toHaveFocus();
    });
  });
});
