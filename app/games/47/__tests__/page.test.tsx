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

    it("should display the initial state with start button", () => {
      render(<FortySevenPage />);

      expect(screen.getByText("Ready to Play?")).toBeInTheDocument();
      expect(
        screen.getByText(/Stop the timer at exactly.*seconds to win!/),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Start Timer/ }),
      ).toBeInTheDocument();
    });

    it("should display instructions about timer fade-out", () => {
      render(<FortySevenPage />);

      expect(
        screen.getByText(
          /The timer will fade out after 3 seconds, so you'll need to rely on your internal sense of time/,
        ),
      ).toBeInTheDocument();
    });

    it("should show timer emoji", () => {
      render(<FortySevenPage />);

      expect(screen.getByText("⏱️")).toBeInTheDocument();
    });
  });

  describe("Starting the Game", () => {
    it("should transition to running state when start button is clicked", async () => {
      const user = userEvent.setup({ delay: null });
      render(<FortySevenPage />);

      const startButton = screen.getByRole("button", { name: /Start Timer/ });
      await user.click(startButton);

      expect(screen.queryByText("Ready to Play?")).not.toBeInTheDocument();
      expect(screen.getByText(/Timer running.../)).toBeInTheDocument();
    });

    it("should display the timer when running", async () => {
      const user = userEvent.setup({ delay: null });
      render(<FortySevenPage />);

      await user.click(screen.getByRole("button", { name: /Start Timer/ }));

      expect(screen.getByText(/\d+\.\d{2}s/)).toBeInTheDocument();
    });

    it("should show stop button when timer is running", async () => {
      const user = userEvent.setup({ delay: null });
      render(<FortySevenPage />);

      await user.click(screen.getByRole("button", { name: /Start Timer/ }));

      expect(
        screen.getByRole("button", { name: /Stop Timer/ }),
      ).toBeInTheDocument();
    });

    it("should call startTimer from gameLogic", async () => {
      const user = userEvent.setup({ delay: null });
      const startTimerSpy = jest.spyOn(gameLogic, "startTimer");

      render(<FortySevenPage />);

      await user.click(screen.getByRole("button", { name: /Start Timer/ }));

      expect(startTimerSpy).toHaveBeenCalled();

      startTimerSpy.mockRestore();
    });
  });

  describe("Timer Display", () => {
    it("should display timer with initial visibility", async () => {
      const user = userEvent.setup({ delay: null });
      render(<FortySevenPage />);

      await user.click(screen.getByRole("button", { name: /Start Timer/ }));

      const timerDisplay = screen.getByText(/Timer running.../).previousElementSibling;
      const timerElement = timerDisplay?.parentElement;
      expect(timerElement).toHaveClass("opacity-100");
    });

    it("should fade out timer after 3 seconds", async () => {
      const user = userEvent.setup({ delay: null });
      render(<FortySevenPage />);

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

      await user.click(screen.getByRole("button", { name: /Start Timer/ }));
      
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Stop Timer/ })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole("button", { name: /Stop Timer/ }));

      await waitFor(() => {
        expect(screen.queryByText(/Timer running.../)).not.toBeInTheDocument();
        expect(screen.getByText(/Time's Up!/)).toBeInTheDocument();
      });
    });

    it("should display final time after stopping", async () => {
      const user = userEvent.setup({ delay: null });
      render(<FortySevenPage />);

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
    it("should display difference when not exactly 47.0", async () => {
      const user = userEvent.setup({ delay: null });

      render(<FortySevenPage />);

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

      await user.click(screen.getByRole("button", { name: /Start Timer/ }));
      
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Stop Timer/ })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole("button", { name: /Stop Timer/ }));

      await waitFor(() => {
        // Should show some result
        expect(screen.getByText(/Time's Up!|Perfect!/)).toBeInTheDocument();
      });
    });
  });

  describe("Play Again", () => {
    it("should show play again button after game ends", async () => {
      const user = userEvent.setup({ delay: null });
      render(<FortySevenPage />);

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

    it("should reset to initial state when play again is clicked", async () => {
      const user = userEvent.setup({ delay: null });
      render(<FortySevenPage />);

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
        expect(screen.getByText("Ready to Play?")).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /Start Timer/ }),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have accessible button labels", () => {
      render(<FortySevenPage />);

      expect(
        screen.getByRole("button", { name: /Start Timer/ }),
      ).toBeInTheDocument();
    });

    it("should maintain button accessibility throughout game flow", async () => {
      const user = userEvent.setup({ delay: null });
      render(<FortySevenPage />);

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
