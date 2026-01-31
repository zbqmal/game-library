import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TwentyQuestionsPage from "../page";
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

describe("TwentyQuestionsPage", () => {
  beforeEach(() => {
    // Clear any mocks before each test
    jest.clearAllMocks();
  });

  describe("Initial Render - Start Screen", () => {
    it("should render the start screen initially", () => {
      render(<TwentyQuestionsPage />);

      expect(screen.getByText("Twenty Questions")).toBeInTheDocument();
      expect(screen.getByText("How to Play")).toBeInTheDocument();
      expect(screen.getByText("Start Game")).toBeInTheDocument();
    });

    it("should display game rules on start screen", () => {
      render(<TwentyQuestionsPage />);

      expect(screen.getByText(/You have 20 total attempts/i)).toBeInTheDocument();
      expect(screen.getByText(/Must be answerable with "Yes" or "No"/i)).toBeInTheDocument();
    });

    it("should have a start game button", () => {
      render(<TwentyQuestionsPage />);

      const startButton = screen.getByRole("button", { name: /start game/i });
      expect(startButton).toBeInTheDocument();
    });
  });

  describe("Game Start", () => {
    it("should initialize game when start button is clicked", () => {
      const initSpy = jest.spyOn(gameLogic, "initializeGame");
      render(<TwentyQuestionsPage />);

      const startButton = screen.getByRole("button", { name: /start game/i });
      fireEvent.click(startButton);

      expect(initSpy).toHaveBeenCalled();
      expect(screen.getByText(/Remaining Attempts/i)).toBeInTheDocument();
    });

    it("should display action selection buttons after starting", () => {
      render(<TwentyQuestionsPage />);

      fireEvent.click(screen.getByRole("button", { name: /start game/i }));

      expect(screen.getByRole("button", { name: /ask question/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /make guess/i })).toBeInTheDocument();
    });

    it("should show initial remaining attempts as 20", () => {
      render(<TwentyQuestionsPage />);

      fireEvent.click(screen.getByRole("button", { name: /start game/i }));

      expect(screen.getByText("20")).toBeInTheDocument();
    });
  });

  describe("Action Selection", () => {
    beforeEach(() => {
      render(<TwentyQuestionsPage />);
      fireEvent.click(screen.getByRole("button", { name: /start game/i }));
    });

    it("should show question input when Ask Question is clicked", () => {
      fireEvent.click(screen.getByRole("button", { name: /ask question/i }));

      const input = screen.getByPlaceholderText(/e.g., Is it alive?/i);
      expect(input).toBeInTheDocument();
    });

    it("should show guess input when Make Guess is clicked", () => {
      fireEvent.click(screen.getByRole("button", { name: /make guess/i }));

      const input = screen.getByPlaceholderText(/e.g., elephant/i);
      expect(input).toBeInTheDocument();
    });

    it("should show submit and cancel buttons after selecting action", () => {
      fireEvent.click(screen.getByRole("button", { name: /ask question/i }));

      expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    it("should clear input and hide form when cancel is clicked", () => {
      fireEvent.click(screen.getByRole("button", { name: /ask question/i }));
      
      const input = screen.getByPlaceholderText(/e.g., Is it alive?/i);
      fireEvent.change(input, { target: { value: "Is it big?" } });
      
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

      expect(screen.getByRole("button", { name: /ask question/i })).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/e.g., Is it alive?/i)).not.toBeInTheDocument();
    });
  });

  describe("Question Processing", () => {
    beforeEach(() => {
      render(<TwentyQuestionsPage />);
      fireEvent.click(screen.getByRole("button", { name: /start game/i }));
    });

    it("should process a valid question", async () => {
      const processSpy = jest.spyOn(gameLogic, "processQuestion");
      
      fireEvent.click(screen.getByRole("button", { name: /ask question/i }));
      
      const input = screen.getByPlaceholderText(/e.g., Is it alive?/i);
      fireEvent.change(input, { target: { value: "Is it alive?" } });
      
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        expect(processSpy).toHaveBeenCalledWith(
          expect.any(Object),
          "Is it alive?"
        );
      });
    });

    it("should display question in history after submission", async () => {
      fireEvent.click(screen.getByRole("button", { name: /ask question/i }));
      
      const input = screen.getByPlaceholderText(/e.g., Is it alive?/i);
      fireEvent.change(input, { target: { value: "Is it big?" } });
      
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        expect(screen.getByText(/Is it big?/i)).toBeInTheDocument();
      });
    });

    it("should clear input after submitting question", async () => {
      fireEvent.click(screen.getByRole("button", { name: /ask question/i }));
      
      const input = screen.getByPlaceholderText(/e.g., Is it alive?/i) as HTMLInputElement;
      fireEvent.change(input, { target: { value: "Is it alive?" } });
      
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        // After submission, form should be hidden
        expect(screen.queryByPlaceholderText(/e.g., Is it alive?/i)).not.toBeInTheDocument();
      });
    });

    it("should update remaining attempts after question", async () => {
      fireEvent.click(screen.getByRole("button", { name: /ask question/i }));
      
      const input = screen.getByPlaceholderText(/e.g., Is it alive?/i);
      fireEvent.change(input, { target: { value: "Is it alive?" } });
      
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        expect(screen.getByText("19")).toBeInTheDocument();
      });
    });
  });

  describe("Guess Processing", () => {
    beforeEach(() => {
      render(<TwentyQuestionsPage />);
      fireEvent.click(screen.getByRole("button", { name: /start game/i }));
    });

    it("should process a guess", async () => {
      const processSpy = jest.spyOn(gameLogic, "processGuess");
      
      fireEvent.click(screen.getByRole("button", { name: /make guess/i }));
      
      const input = screen.getByPlaceholderText(/e.g., elephant/i);
      fireEvent.change(input, { target: { value: "elephant" } });
      
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        expect(processSpy).toHaveBeenCalledWith(
          expect.any(Object),
          "elephant"
        );
      });
    });

    it("should display guess in history after submission", async () => {
      fireEvent.click(screen.getByRole("button", { name: /make guess/i }));
      
      const input = screen.getByPlaceholderText(/e.g., elephant/i);
      fireEvent.change(input, { target: { value: "lion" } });
      
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        expect(screen.getByText(/lion/i)).toBeInTheDocument();
      });
    });
  });

  describe("Game History", () => {
    beforeEach(() => {
      render(<TwentyQuestionsPage />);
      fireEvent.click(screen.getByRole("button", { name: /start game/i }));
    });

    it("should display history section when actions are taken", async () => {
      fireEvent.click(screen.getByRole("button", { name: /ask question/i }));
      
      const input = screen.getByPlaceholderText(/e.g., Is it alive?/i);
      fireEvent.change(input, { target: { value: "Is it alive?" } });
      
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        expect(screen.getByText("History")).toBeInTheDocument();
      });
    });

    it("should show attempt numbers in history", async () => {
      fireEvent.click(screen.getByRole("button", { name: /ask question/i }));
      
      const input = screen.getByPlaceholderText(/e.g., Is it alive?/i);
      fireEvent.change(input, { target: { value: "Is it alive?" } });
      
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        expect(screen.getByText(/#1/i)).toBeInTheDocument();
      });
    });

    it("should distinguish between questions and guesses in history", async () => {
      // Ask a question
      fireEvent.click(screen.getByRole("button", { name: /ask question/i }));
      let input = screen.getByPlaceholderText(/e.g., Is it alive?/i);
      fireEvent.change(input, { target: { value: "Is it big?" } });
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        expect(screen.getByText("Question")).toBeInTheDocument();
      });

      // Make a guess
      fireEvent.click(screen.getByRole("button", { name: /make guess/i }));
      input = screen.getByPlaceholderText(/e.g., elephant/i);
      fireEvent.change(input, { target: { value: "lion" } });
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        expect(screen.getByText("Guess")).toBeInTheDocument();
      });
    });
  });

  describe("Game End - Win", () => {
    it("should display win message when correct guess is made", async () => {
      // Mock initializeGame to return a known answer
      const mockInitialize = jest.spyOn(gameLogic, "initializeGame").mockReturnValue({
        secretAnswer: "elephant",
        remainingAttempts: 20,
        gameStatus: "playing",
        actionHistory: [],
        currentAction: null,
      });

      render(<TwentyQuestionsPage />);
      fireEvent.click(screen.getByRole("button", { name: /start game/i }));

      fireEvent.click(screen.getByRole("button", { name: /make guess/i }));
      
      const input = screen.getByPlaceholderText(/e.g., elephant/i);
      fireEvent.change(input, { target: { value: "elephant" } });
      
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        expect(screen.getByText(/Congratulations!/i)).toBeInTheDocument();
        expect(screen.getByText(/You guessed it! The answer was/i)).toBeInTheDocument();
      });

      mockInitialize.mockRestore();
    });

    it("should show play again button after winning", async () => {
      const mockInitialize = jest.spyOn(gameLogic, "initializeGame").mockReturnValue({
        secretAnswer: "elephant",
        remainingAttempts: 20,
        gameStatus: "playing",
        actionHistory: [],
        currentAction: null,
      });

      render(<TwentyQuestionsPage />);
      fireEvent.click(screen.getByRole("button", { name: /start game/i }));

      fireEvent.click(screen.getByRole("button", { name: /make guess/i }));
      const input = screen.getByPlaceholderText(/e.g., elephant/i);
      fireEvent.change(input, { target: { value: "elephant" } });
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /play again/i })).toBeInTheDocument();
      });

      mockInitialize.mockRestore();
    });
  });

  describe("Game End - Loss", () => {
    it("should show final guess phase after 20 attempts", async () => {
      const mockState = {
        secretAnswer: "elephant",
        remainingAttempts: 1,
        gameStatus: "playing" as const,
        actionHistory: Array(19).fill(null).map((_, i) => ({
          type: "question" as const,
          input: `Question ${i + 1}`,
          response: "No",
          attemptNumber: i + 1,
        })),
        currentAction: null,
      };

      jest.spyOn(gameLogic, "initializeGame").mockReturnValue(mockState);

      render(<TwentyQuestionsPage />);
      fireEvent.click(screen.getByRole("button", { name: /start game/i }));

      // Use the last attempt
      fireEvent.click(screen.getByRole("button", { name: /ask question/i }));
      const input = screen.getByPlaceholderText(/e.g., Is it alive?/i);
      fireEvent.change(input, { target: { value: "Is it small?" } });
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        expect(screen.getByText(/Final Guess Phase!/i)).toBeInTheDocument();
      });
    });

    it("should display loss message after incorrect final guess", async () => {
      const mockState = {
        secretAnswer: "elephant",
        remainingAttempts: 0,
        gameStatus: "finalGuess" as const,
        actionHistory: Array(20).fill(null).map((_, i) => ({
          type: "question" as const,
          input: `Question ${i + 1}`,
          response: "No",
          attemptNumber: i + 1,
        })),
        currentAction: null,
      };

      jest.spyOn(gameLogic, "initializeGame").mockReturnValue(mockState);

      render(<TwentyQuestionsPage />);
      fireEvent.click(screen.getByRole("button", { name: /start game/i }));

      const input = screen.getByPlaceholderText(/What is it?/i);
      fireEvent.change(input, { target: { value: "lion" } });
      fireEvent.click(screen.getByRole("button", { name: /submit final guess/i }));

      await waitFor(() => {
        expect(screen.getByText(/Game Over!/i)).toBeInTheDocument();
        expect(screen.getByText(/The answer was/i)).toBeInTheDocument();
      });
    });
  });

  describe("Play Again", () => {
    it("should reset game when play again is clicked", async () => {
      const mockInitialize = jest.spyOn(gameLogic, "initializeGame").mockReturnValue({
        secretAnswer: "elephant",
        remainingAttempts: 20,
        gameStatus: "playing",
        actionHistory: [],
        currentAction: null,
      });

      render(<TwentyQuestionsPage />);
      fireEvent.click(screen.getByRole("button", { name: /start game/i }));

      // Win the game
      fireEvent.click(screen.getByRole("button", { name: /make guess/i }));
      const input = screen.getByPlaceholderText(/e.g., elephant/i);
      fireEvent.change(input, { target: { value: "elephant" } });
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /play again/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /play again/i }));

      expect(screen.getByText("How to Play")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /start game/i })).toBeInTheDocument();

      mockInitialize.mockRestore();
    });
  });

  describe("Form Validation", () => {
    beforeEach(() => {
      render(<TwentyQuestionsPage />);
      fireEvent.click(screen.getByRole("button", { name: /start game/i }));
    });

    it("should require input before submission", () => {
      fireEvent.click(screen.getByRole("button", { name: /ask question/i }));
      
      const form = screen.getByPlaceholderText(/e.g., Is it alive?/i).closest("form");
      
      // Attempt to submit empty form
      fireEvent.submit(form!);
      
      // Form should have required attribute on input
      const input = screen.getByPlaceholderText(/e.g., Is it alive?/i);
      expect(input).toHaveAttribute("required");
    });
  });
});
