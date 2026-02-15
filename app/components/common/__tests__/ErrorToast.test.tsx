import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ErrorToast from "../ErrorToast";

describe("ErrorToast", () => {
  it("renders error message", () => {
    const onDismiss = jest.fn();
    render(<ErrorToast message="Test error" onDismiss={onDismiss} />);
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("calls onDismiss when close button clicked", () => {
    const onDismiss = jest.fn();
    render(<ErrorToast message="Test error" onDismiss={onDismiss} />);
    const dismissButton = screen.getByLabelText("Dismiss error");
    fireEvent.click(dismissButton);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("auto-dismisses after duration", async () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    render(
      <ErrorToast
        message="Test error"
        onDismiss={onDismiss}
        duration={1000}
      />
    );

    expect(onDismiss).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    jest.useRealTimers();
  });

  it("does not auto-dismiss when autoDismiss is false", async () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    render(
      <ErrorToast
        message="Test error"
        onDismiss={onDismiss}
        autoDismiss={false}
        duration={1000}
      />
    );

    jest.advanceTimersByTime(2000);

    expect(onDismiss).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("renders with warning icon", () => {
    const onDismiss = jest.fn();
    render(<ErrorToast message="Test error" onDismiss={onDismiss} />);
    expect(screen.getByText("⚠️")).toBeInTheDocument();
  });
});
