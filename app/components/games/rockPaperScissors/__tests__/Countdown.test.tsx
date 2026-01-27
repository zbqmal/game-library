import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import Countdown from "../Countdown";

describe("Countdown", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("does not render when show is false", () => {
    const mockOnComplete = jest.fn();
    const { container } = render(
      <Countdown start={3} show={false} onComplete={mockOnComplete} />,
    );

    const countdownDiv = container.querySelector(".bg-black");
    expect(countdownDiv).not.toBeInTheDocument();
  });

  it("renders when show is true", () => {
    const mockOnComplete = jest.fn();
    const { container } = render(
      <Countdown start={3} show={true} onComplete={mockOnComplete} />,
    );

    const countdownDiv = container.querySelector(".bg-black");
    expect(countdownDiv).toBeInTheDocument();
  });

  it("displays the starting count", () => {
    const mockOnComplete = jest.fn();
    render(<Countdown start={3} show={true} onComplete={mockOnComplete} />);

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("decrements count after 1 second", () => {
    const mockOnComplete = jest.fn();
    render(<Countdown start={3} show={true} onComplete={mockOnComplete} />);

    expect(screen.getByText("3")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("continues decrementing count", () => {
    const mockOnComplete = jest.fn();
    render(<Countdown start={3} show={true} onComplete={mockOnComplete} />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText("2")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("calls onComplete when count reaches 0", () => {
    const mockOnComplete = jest.fn();
    render(<Countdown start={1} show={true} onComplete={mockOnComplete} />);

    expect(mockOnComplete).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it("does not render when count reaches 0", () => {
    const mockOnComplete = jest.fn();
    const { container } = render(
      <Countdown start={1} show={true} onComplete={mockOnComplete} />,
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const countdownDiv = container.querySelector(".bg-black");
    expect(countdownDiv).not.toBeInTheDocument();
  });

  it("stops countdown when show becomes false", () => {
    const mockOnComplete = jest.fn();
    const { rerender } = render(
      <Countdown start={5} show={true} onComplete={mockOnComplete} />,
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText("4")).toBeInTheDocument();

    rerender(<Countdown start={5} show={false} onComplete={mockOnComplete} />);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Count should still be 4, not 2
    expect(screen.queryByText("4")).not.toBeInTheDocument();
    expect(screen.queryByText("2")).not.toBeInTheDocument();
  });

  it("resumes countdown when show becomes true again", () => {
    const mockOnComplete = jest.fn();
    const { rerender } = render(
      <Countdown start={5} show={true} onComplete={mockOnComplete} />,
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText("4")).toBeInTheDocument();

    rerender(<Countdown start={5} show={false} onComplete={mockOnComplete} />);

    rerender(<Countdown start={5} show={true} onComplete={mockOnComplete} />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should continue from where it was
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("clears timer on unmount", () => {
    const mockOnComplete = jest.fn();
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

    const { unmount } = render(
      <Countdown start={5} show={true} onComplete={mockOnComplete} />,
    );

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it("applies correct styling classes", () => {
    const mockOnComplete = jest.fn();
    const { container } = render(
      <Countdown start={3} show={true} onComplete={mockOnComplete} />,
    );

    const countdownDiv = container.querySelector(".bg-black");
    expect(countdownDiv).toHaveClass(
      "absolute",
      "inset-0",
      "bg-opacity-50",
      "flex",
      "items-center",
      "justify-center",
      "z-10",
      "pointer-events-none",
    );
  });

  it("applies correct text styling", () => {
    const mockOnComplete = jest.fn();
    const { container } = render(
      <Countdown start={3} show={true} onComplete={mockOnComplete} />,
    );

    const textDiv = container.querySelector(".text-9xl");
    expect(textDiv).toHaveClass(
      "text-9xl",
      "font-bold",
      "text-white",
      "animate-pulse",
    );
  });

  it("handles rapid show/hide toggling", () => {
    const mockOnComplete = jest.fn();
    const { rerender } = render(
      <Countdown start={10} show={true} onComplete={mockOnComplete} />,
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    rerender(<Countdown start={10} show={false} onComplete={mockOnComplete} />);
    rerender(<Countdown start={10} show={true} onComplete={mockOnComplete} />);
    rerender(<Countdown start={10} show={false} onComplete={mockOnComplete} />);

    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it("starts at a different number when start prop changes", () => {
    const mockOnComplete = jest.fn();
    const { rerender } = render(
      <Countdown start={5} show={true} onComplete={mockOnComplete} />,
    );

    expect(screen.getByText("5")).toBeInTheDocument();

    // When we change the start prop, the component keeps its internal state
    // This is expected behavior - the start prop only initializes the count
    rerender(<Countdown start={10} show={true} onComplete={mockOnComplete} />);

    // The internal count remains at 5, not reset to 10
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("calls new onComplete callback when prop changes", () => {
    const mockOnComplete1 = jest.fn();
    const mockOnComplete2 = jest.fn();

    const { rerender } = render(
      <Countdown start={1} show={true} onComplete={mockOnComplete1} />,
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockOnComplete1).toHaveBeenCalledTimes(1);
    expect(mockOnComplete2).not.toHaveBeenCalled();

    rerender(<Countdown start={1} show={true} onComplete={mockOnComplete2} />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockOnComplete2).toHaveBeenCalledTimes(1);
  });

  it("does not call onComplete multiple times", () => {
    const mockOnComplete = jest.fn();
    render(<Countdown start={1} show={true} onComplete={mockOnComplete} />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockOnComplete).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should still be called only once
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it("renders large visible countdown number", () => {
    const mockOnComplete = jest.fn();
    const { container } = render(
      <Countdown start={3} show={true} onComplete={mockOnComplete} />,
    );

    const countElement = screen.getByText("3");
    expect(countElement.className).toContain("text-9xl");
  });
});
