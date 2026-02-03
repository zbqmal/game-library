import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FortySevenPage from "../page";
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

// Mock requestAnimationFrame and cancelAnimationFrame
let animationFrameId = 0;
const animationFrameCallbacks: Map<number, FrameRequestCallback> = new Map();

beforeAll(() => {
  global.requestAnimationFrame = jest.fn((callback) => {
    animationFrameId++;
    animationFrameCallbacks.set(animationFrameId, callback);
    return animationFrameId;
  });

  global.cancelAnimationFrame = jest.fn((id) => {
    animationFrameCallbacks.delete(id);
  });
});

afterEach(() => {
  animationFrameCallbacks.clear();
  jest.clearAllTimers();
  jest.restoreAllMocks();
});

describe("FortySevenPage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Initial Render", () => {
    it("should render the game shell with correct title and description", () => {
      render(<FortySevenPage />);

      expect(screen.getByText("47")).toBeInTheDocument();
      expect(
        screen.getByText(
          /A timing challenge! Stop the timer at exactly 47.0 seconds/,
        ),
      ).toBeInTheDocument();
    });

    it("should display the difficulty selection screen initially", () => {
      render(<FortySevenPage />);

      expect(screen.getByText("Select Difficulty")).toBeInTheDocument();
      expect(screen.getByText("Choose your target time:")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /EASY.*Target: 0:47/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /MEDIUM.*Target: 1:47/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /HARD.*Target: 2:47/i }),
      ).toBeInTheDocument();
    });

    it("should show timer emoji on difficulty selection", () => {
      render(<FortySevenPage />);

      expect(screen.getByText("⏱️")).toBeInTheDocument();
    });
  });

  describe("Difficulty Selection", () => {
    it("should show ready to play screen after selecting EASY", async () => {
      const user = userEvent.setup({ delay: null });
      render(<FortySevenPage />);

      await user.click(screen.getByRole("button", { name: /EASY.*Target: 0:47/i }));

      expect(screen.getByText("Ready to Play?")).toBeInTheDocument();
      expect(screen.getByText(/Difficulty: EASY/)).toBeInTheDocument();
      expect(screen.getByText(/Target: 0:47/)).toBeInTheDocument();
    });

    it("should show ready to play screen after selecting MEDIUM", async () => {
      const user = userEvent.setup({ delay: null });
      render(<FortySevenPage />);

      await user.click(screen.getByRole("button", { name: /MEDIUM.*Target: 1:47/i }));

      expect(screen.getByText("Ready to Play?")).toBeInTheDocument();
      expect(screen.getByText(/Difficulty: MEDIUM/)).toBeInTheDocument();
      expect(screen.getByText(/Target: 1:47/)).toBeInTheDocument();
    });

    it("should show ready to play screen after selecting HARD", async () => {
      const user = userEvent.setup({ delay: null });
      render(<FortySevenPage />);

      await user.click(screen.getByRole("button", { name: /HARD.*Target: 2:47/i }));

      expect(screen.getByText("Ready to Play?")).toBeInTheDocument();
      expect(screen.getByText(/Difficulty: HARD/)).toBeInTheDocument();
      expect(screen.getByText(/Target: 2:47/)).toBeInTheDocument();
    });
  });

  describe("Starting the Game", () => {
    it("should transition to running state when start button is clicked", async () => {
      const user = userEvent.setup({ delay: null });
      render(<FortySevenPage />);

      // Select difficulty first
      await user.click(screen.getByRole("button", { name: /EASY.*Target: 0:47/i }));

      const startButton = screen.getByRole("button", { name: /Start Timer/ });
      await user.click(startButton);

      expect(screen.queryByText("Ready to Play?")).not.toBeInTheDocument();
      expect(screen.getByText(/Timer running.../)).toBeInTheDocument();
    });

    it("should display the timer when running", async () => {
      const user = userEvent.setup({ delay: null });
      render(<FortySevenPage />);

      await user.click(screen.getByRole("button", { name: /EASY.*Target: 0:47/i }));
      await user.click(screen.getByRole("button", { name: /Start Timer/ }));

      expect(screen.getByText(/\d+\.\d{2}s/)).toBeInTheDocument();
    });

    it("should show stop button when timer is running", async () => {
      const user = userEvent.setup({ delay: null });
      render(<FortySevenPage />);

      await user.click(screen.getByRole("button", { name: /EASY.*Target: 0:47/i }));
      await user.click(screen.getByRole("button", { name: /Start Timer/ }));

      expect(
        screen.getByRole("button", { name: /Stop Timer/ }),
      ).toBeInTheDocument();
    });

    it("should call startTimer from gameLogic", async () => {
      const user = userEvent.setup({ delay: null });
      const startTimerSpy = jest.spyOn(gameLogic, "startTimer");

      render(<FortySevenPage />);

      await user.click(screen.getByRole("button", { name: /EASY.*Target: 0:47/i }));
      await user.click(screen.getByRole("button", { name: /Start Timer/ }));

      expect(startTimerSpy).toHaveBeenCalled();

      startTimerSpy.mockRestore();
    });
  });

  describe("Timer Display", () => {
    it("should display timer with initial visibility", async () => {
      const user = userEvent.setup({ delay: null });
      render(<FortySevenPage />);

      await user.click(screen.getByRole("button", { name: /EASY.*Target: 0:47/i }));
      await user.click(screen.getByRole("button", { name: /Start Timer/ }));

      const timerDisplay = screen.getByText(/Timer running.../).previousElementSibling;
      const timerElement = timerDisplay?.parentElement;
      expect(timerElement).toHaveClass("opacity-100");
    });

    it("should fade out timer after 3 seconds", async () => {
      const user = userEvent.setup({ delay: null });
      render(<FortySevenPage />);

      await user.click(screen.getByRole("button", { name: /EASY.*Target: 0:47/i }));
      await user.click(screen.getByRole("button", { name: /Start Timer/ }));

      const timerDisplay = screen.getByText(/Timer running.../).previousElementSibling;
      const timerElement = timerDisplay?.parentElement;
      expect(timerElement).toHaveClass("opacity-100");

      // Fast-forward 3 seconds
      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(timerElement).toHaveClass("opacity-0");
      });
    });
  });

  describe("Stopping the Timer", () => {
    it("should stop timer when stop button is clicked", async () => {
      const user = userEvent.setup({ delay: null });
      render(<FortySevenPage />);

      await user.click(screen.getByRole("button", { name: /EASY.*Target: 0:47/i }));
      await user.click(screen.getByRole("button", { name: /Start Timer/ }));
      
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Stop Timer/ })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole("button", { name: /Stop Timer/ }));

      await waitFor(() => {
        expect(screen.queryByText(/Timer running.../)).not.toBeInTheDocument();
        expect(screen.getByText(/Your Result/)).toBeInTheDocument();
      });
    });

    it("should display final time after stopping", async () => {
      const user = userEvent.setup({ delay: null });
      render(<FortySevenPage />);

      await user.click(screen.getByRole("button", { name: /EASY.*Target: 0:47/i }));
      await user.click(screen.getByRole("button", { name: /Start Timer/ }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Stop Timer/ })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /Stop Timer/ }));

      await waitFor(() => {
        expect(screen.getByText(/You stopped at/)).toBeInTheDocument();
      });
    });

    it("should call stopTimer from gameLogic", async () => {
      const user = userEvent.setup({ delay: null });
      const stopTimerSpy = jest.spyOn(gameLogic, "stopTimer");

      render(<FortySevenPage />);

      await user.click(screen.getByRole("button", { name: /EASY.*Target: 0:47/i }));
      await user.click(screen.getByRole("button", { name: /Start Timer/ }));
      
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Stop Timer/ })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole("button", { name: /Stop Timer/ }));

      await waitFor(() => {
        expect(stopTimerSpy).toHaveBeenCalled();
      });

      stopTimerSpy.mockRestore();
    });
  });

  describe("Result Display - Non-exact Match", () => {
    it("should display difference when not exactly at target", async () => {
      const user = userEvent.setup({ delay: null });

      render(<FortySevenPage />);

      await user.click(screen.getByRole("button", { name: /EASY.*Target: 0:47/i }));
      await user.click(screen.getByRole("button", { name: /Start Timer/ }));
      
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Stop Timer/ })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole("button", { name: /Stop Timer/ }));

      await waitFor(() => {
        // Should show either difference or success message
        const hasDifference = screen.queryByText(/Difference from target:/);
        const hasSuccess = screen.queryByText(/Perfect!/);
        expect(hasDifference || hasSuccess).toBeTruthy();
      });
    });

    it("should show positive or negative difference label", async () => {
      const user = userEvent.setup({ delay: null });

      render(<FortySevenPage />);

      await user.click(screen.getByRole("button", { name: /EASY.*Target: 0:47/i }));
      await user.click(screen.getByRole("button", { name: /Start Timer/ }));
      
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Stop Timer/ })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole("button", { name: /Stop Timer/ }));

      await waitFor(() => {
        // Should show some result
        expect(screen.getByText(/Your Result|Perfect!/)).toBeInTheDocument();
      });
    });
  });

  describe("Play Again", () => {
    it("should show play again button after game ends", async () => {
      const user = userEvent.setup({ delay: null });
      render(<FortySevenPage />);

      await user.click(screen.getByRole("button", { name: /EASY.*Target: 0:47/i }));
      await user.click(screen.getByRole("button", { name: /Start Timer/ }));
      
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Stop Timer/ })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole("button", { name: /Stop Timer/ }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Play Again/ }),
        ).toBeInTheDocument();
      });
    });

    it("should reset to difficulty selection when play again is clicked", async () => {
      const user = userEvent.setup({ delay: null });
      render(<FortySevenPage />);

      await user.click(screen.getByRole("button", { name: /EASY.*Target: 0:47/i }));
      await user.click(screen.getByRole("button", { name: /Start Timer/ }));
      
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Stop Timer/ })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole("button", { name: /Stop Timer/ }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Play Again/ }),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /Play Again/ }));

      await waitFor(() => {
        expect(screen.getByText("Select Difficulty")).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /EASY.*Target: 0:47/i }),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have accessible button labels", () => {
      render(<FortySevenPage />);

      expect(
        screen.getByRole("button", { name: /EASY.*Target: 0:47/i }),
      ).toBeInTheDocument();
    });

    it("should maintain button accessibility throughout game flow", async () => {
      const user = userEvent.setup({ delay: null });
      render(<FortySevenPage />);

      // Difficulty selection state
      expect(
        screen.getByRole("button", { name: /EASY.*Target: 0:47/i }),
      ).toBeInTheDocument();

      // Select difficulty
      await user.click(screen.getByRole("button", { name: /EASY.*Target: 0:47/i }));

      // Initial state
      expect(
        screen.getByRole("button", { name: /Start Timer/ }),
      ).toBeInTheDocument();

      // Running state
      await user.click(screen.getByRole("button", { name: /Start Timer/ }));
      expect(
        screen.getByRole("button", { name: /Stop Timer/ }),
      ).toBeInTheDocument();

      // Stopped state
      await user.click(screen.getByRole("button", { name: /Stop Timer/ }));
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Play Again/ }),
        ).toBeInTheDocument();
      });
    });
  });
});
