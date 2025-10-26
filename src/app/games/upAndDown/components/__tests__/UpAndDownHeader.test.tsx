import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UpAndDownHeader } from "../UpAndDownHeader";

describe("UpAndDownHeader", () => {
  test("displays attempts and calls reset", async () => {
    const user = userEvent.setup();
    const onReset = jest.fn();
    render(
      <UpAndDownHeader attemptsLeft={3} maxAttempts={5} onReset={onReset} />
    );

    expect(screen.getByText(/Attempts: 3\/5/)).toBeInTheDocument();
    await user.click(screen.getByTestId("up-and-down-reset-button"));
    expect(onReset).toHaveBeenCalled();
  });
});
