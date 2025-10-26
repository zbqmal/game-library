import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GuessInput } from "../GuessInput";

describe("GuessInput", () => {
  describe("Rendering", () => {
    test("renders input and button", () => {
      render(<GuessInput onGuess={() => {}} />);
      expect(screen.getByTestId("up-and-down-guess-input")).toBeInTheDocument();
      expect(
        screen.getByTestId("up-and-down-guess-button")
      ).toBeInTheDocument();
    });
  });

  describe("Validation", () => {
    test("shows error for non-number and out of range", async () => {
      const user = userEvent.setup();
      render(<GuessInput onGuess={() => {}} />);

      const input = screen.getByTestId(
        "up-and-down-guess-input"
      ) as HTMLInputElement;
      const btn = screen.getByTestId("up-and-down-guess-button");

      await user.type(input, "abc");
      await user.click(btn);
      expect(screen.getByText(/enter a number/i)).toBeInTheDocument();

      await user.clear(input);
      await user.type(input, "200");
      await user.click(btn);
      expect(
        screen.getByText(/must be between 1 and 100/i)
      ).toBeInTheDocument();
    });
  });

  describe("Functionality", () => {
    test("calls onGuess with parsed number and clears input", async () => {
      const user = userEvent.setup();
      const onGuess = jest.fn();
      render(<GuessInput onGuess={onGuess} />);

      const input = screen.getByTestId(
        "up-and-down-guess-input"
      ) as HTMLInputElement;
      const btn = screen.getByTestId("up-and-down-guess-button");

      await user.type(input, "42");
      await user.click(btn);

      expect(onGuess).toHaveBeenCalledWith(42);
      expect(input.value).toBe("");
    });

    test("disabled prevents interaction", async () => {
      const user = userEvent.setup();
      const onGuess = jest.fn();
      render(<GuessInput onGuess={onGuess} disabled />);

      const input = screen.getByTestId(
        "up-and-down-guess-input"
      ) as HTMLInputElement;
      const btn = screen.getByTestId("up-and-down-guess-button");

      expect(input).toBeDisabled();
      expect(btn).toBeDisabled();

      await user.type(input, "10");
      await user.click(btn);
      expect(onGuess).not.toHaveBeenCalled();
    });
  });
});
