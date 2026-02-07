import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import Scoreboard from "../Scoreboard";
import { scoreboardAdapter, ScoreEntry } from "../../../lib/scoreboard";
import { translationEngine } from "@/app/translation-engine";

jest.mock("../../../lib/scoreboard");

describe("Scoreboard", () => {
  const mockScoreboardAdapter = scoreboardAdapter as jest.Mocked<
    typeof scoreboardAdapter
  >;

  // Use current date to ensure dates display correctly regardless of timezone
  const now = new Date();
  const date1 = new Date(now);
  date1.setDate(date1.getDate() - 3);
  const date2 = new Date(now);
  date2.setDate(date2.getDate() - 2);
  const date3 = new Date(now);
  date3.setDate(date3.getDate() - 1);
  const date4 = new Date(now);

  const mockScores: ScoreEntry[] = [
    { name: "Alice", score: 100, timestamp: date1.getTime() },
    { name: "Bob", score: 90, timestamp: date2.getTime() },
    { name: "Charlie", score: 80, timestamp: date3.getTime() },
    { name: "Diana", score: 70, timestamp: date4.getTime() },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    translationEngine.changeLanguage("en");
    mockScoreboardAdapter.getTopScores.mockResolvedValue(mockScores);
  });

  it("renders the scoreboard with default title", () => {
    render(<Scoreboard gameId="test-game" />);

    expect(screen.getByText("Top 10 Scoreboard")).toBeInTheDocument();
  });

  it("renders Spanish title when language is Spanish", () => {
    translationEngine.changeLanguage("es");
    render(<Scoreboard gameId="test-game" />);

    expect(
      screen.getByText("Tabla de Puntuaciones Top 10"),
    ).toBeInTheDocument();
  });

  it("renders the scoreboard with custom title", () => {
    render(<Scoreboard gameId="test-game" title="My Custom Scores" />);

    expect(screen.getByText("My Custom Scores")).toBeInTheDocument();
  });

  it("loads scores on mount", () => {
    render(<Scoreboard gameId="test-game" />);

    expect(mockScoreboardAdapter.getTopScores).toHaveBeenCalledWith(
      "test-game",
      10,
    );
  });

  it("displays all loaded scores", async () => {
    render(<Scoreboard gameId="test-game" />);

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
    expect(screen.getByText("Diana")).toBeInTheDocument();
  });

  it("displays score values correctly", async () => {
    render(<Scoreboard gameId="test-game" />);

    await waitFor(() => {
      expect(screen.getByText("100")).toBeInTheDocument();
    });

    expect(screen.getByText("90")).toBeInTheDocument();
    expect(screen.getByText("80")).toBeInTheDocument();
    expect(screen.getByText("70")).toBeInTheDocument();
  });

  it("displays rank numbers correctly", async () => {
    render(<Scoreboard gameId="test-game" />);

    await waitFor(() => {
      const rankElements = screen.getAllByText(/^[1-4]$/);
      expect(rankElements).toHaveLength(4);
    });
  });

  it("shows empty state when no scores", async () => {
    mockScoreboardAdapter.getTopScores.mockResolvedValue([]);

    render(<Scoreboard gameId="test-game" />);

    await waitFor(() => {
      expect(screen.getByText("No scores yet!")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Be the first to play and set a record."),
    ).toBeInTheDocument();
  });

  it("applies special styling to first place (gold)", async () => {
    const { container } = render(<Scoreboard gameId="test-game" />);

    await waitFor(() => {
      const firstPlaceDiv = container.querySelector(
        ".from-yellow-100.to-yellow-50.border-yellow-400",
      );
      expect(firstPlaceDiv).toBeInTheDocument();
    });
  });

  it("applies special styling to second place (silver)", async () => {
    const { container } = render(<Scoreboard gameId="test-game" />);

    await waitFor(() => {
      const secondPlaceDiv = container.querySelector(
        ".from-gray-200.to-gray-100.border-gray-400",
      );
      expect(secondPlaceDiv).toBeInTheDocument();
    });
  });

  it("applies special styling to third place (bronze)", async () => {
    const { container } = render(<Scoreboard gameId="test-game" />);

    await waitFor(() => {
      const thirdPlaceDiv = container.querySelector(
        ".from-orange-100.to-orange-50.border-orange-400",
      );
      expect(thirdPlaceDiv).toBeInTheDocument();
    });
  });

  it("formats dates correctly", async () => {
    render(<Scoreboard gameId="test-game" />);

    await waitFor(() => {
      // Check that dates are displayed for each score entry
      const dateElements = screen.getAllByText(/[A-Za-z]{3}\s\d{1,2}/);
      // We should have 4 dates displayed (one for each score)
      expect(dateElements.length).toBeGreaterThanOrEqual(4);
    });
  });

  it("reloads scores when scoreboardUpdated event is fired with matching gameId", async () => {
    const newScores: ScoreEntry[] = [
      { name: "Eve", score: 120, timestamp: Date.now() },
    ];

    render(<Scoreboard gameId="test-game" />);

    await waitFor(() => {
      expect(mockScoreboardAdapter.getTopScores).toHaveBeenCalledTimes(1);
    });

    mockScoreboardAdapter.getTopScores.mockResolvedValue(newScores);

    // Dispatch custom event
    await act(async () => {
      const event = new CustomEvent("scoreboardUpdated", {
        detail: { gameId: "test-game" },
      });
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(mockScoreboardAdapter.getTopScores).toHaveBeenCalledTimes(2);
    });

    expect(screen.getByText("Eve")).toBeInTheDocument();
  });

  it("ignores scoreboardUpdated event with different gameId", async () => {
    render(<Scoreboard gameId="test-game" />);

    await waitFor(() => {
      expect(mockScoreboardAdapter.getTopScores).toHaveBeenCalledTimes(1);
    });

    const callCountBefore =
      mockScoreboardAdapter.getTopScores.mock.calls.length;

    // Dispatch event with different gameId
    await act(async () => {
      const event = new CustomEvent("scoreboardUpdated", {
        detail: { gameId: "different-game" },
      });
      window.dispatchEvent(event);
    });

    // Should still be called only once (no additional calls)
    expect(mockScoreboardAdapter.getTopScores).toHaveBeenCalledTimes(
      callCountBefore,
    );
  });

  it("cleans up event listener on unmount", () => {
    const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");

    const { unmount } = render(<Scoreboard gameId="test-game" />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "scoreboardUpdated",
      expect.any(Function),
    );

    removeEventListenerSpy.mockRestore();
  });

  it("reloads scores when gameId prop changes", () => {
    const { rerender } = render(<Scoreboard gameId="game-1" />);

    expect(mockScoreboardAdapter.getTopScores).toHaveBeenCalledWith(
      "game-1",
      10,
    );

    rerender(<Scoreboard gameId="game-2" />);

    expect(mockScoreboardAdapter.getTopScores).toHaveBeenCalledWith(
      "game-2",
      10,
    );
    expect(mockScoreboardAdapter.getTopScores).toHaveBeenCalledTimes(2);
  });

  it("displays rank badge with correct background colors", async () => {
    const { container } = render(<Scoreboard gameId="test-game" />);

    await waitFor(() => {
      // First place badge should be yellow
      const badges = container.querySelectorAll(".rounded-full.font-bold");
      expect(badges.length).toBeGreaterThan(0);
      expect(badges[0]).toHaveClass("bg-yellow-400", "text-yellow-900");
      expect(badges[1]).toHaveClass("bg-gray-400", "text-gray-900");
      expect(badges[2]).toHaveClass("bg-orange-400", "text-orange-900");
    });
  });

  it("displays scores as 2-column layout (name/date and score)", async () => {
    const { container } = render(<Scoreboard gameId="test-game" />);

    await waitFor(() => {
      const scoreRows = container.querySelectorAll(".justify-between");
      expect(scoreRows.length).toBeGreaterThan(0);
    });
  });

  it("has proper spacing between score entries", async () => {
    const { container } = render(<Scoreboard gameId="test-game" />);

    await waitFor(() => {
      const scoresContainer = container.querySelector(".space-y-2");
      expect(scoresContainer).toBeInTheDocument();
    });
  });
});
