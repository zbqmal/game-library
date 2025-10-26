import { render, screen } from "@testing-library/react";
import { UpAndDownGame } from "../UpAndDownGame";
import { getRandomInt } from "../../utils";
import userEvent from "@testing-library/user-event";

jest.mock("../../utils", () => {
  return {
    getRandomInt: jest.fn(),
  };
});

describe("UpAndDownGame", () => {
  describe("Rendering", () => {
    test("renders without crashing", () => {
      render(<UpAndDownGame />);

      // header title "Play"
      expect(
        screen.getByRole("heading", { name: /play/i })
      ).toBeInTheDocument();
      // reset button in controls
      expect(
        screen.getByRole("button", { name: /reset/i })
      ).toBeInTheDocument();
      // history section title "History"
      expect(
        screen.getByRole("heading", { name: /history/i })
      ).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    describe("Reset", () => {
      beforeEach(() => {
        (getRandomInt as jest.Mock).mockReturnValueOnce(42).mockReturnValue(66);
      });

      test("reset button resets the game state", async () => {
        const user = userEvent.setup();

        render(<UpAndDownGame />);
        const resetButton = screen.getByRole("button", { name: /reset/i });
        const input = screen.getByLabelText("guess-input") as HTMLInputElement;
        const btn = screen.getByRole("button", { name: /guess/i });

        await user.type(input, "10");
        await user.click(btn);
        expect(
          screen.getByText(new RegExp(`Attempts: ${4}/${5}`))
        ).toBeInTheDocument();

        await user.type(input, "90");
        await user.click(btn);
        expect(
          screen.getByText(new RegExp(`Attempts: ${3}/${5}`))
        ).toBeInTheDocument();

        // Simulate clicking the reset button
        await user.click(resetButton);

        // After reset, check if attempts are reset (assuming initial attempts is MAX_ATTEMPTS)
        expect(
          screen.getByText(new RegExp(`Attempts: ${5}/${5}`))
        ).toBeInTheDocument();
      });
    });

    describe("Guessing", () => {
      beforeEach(() => {
        (getRandomInt as jest.Mock).mockReturnValue(50);
      });

      test("correct guess", async () => {
        const user = userEvent.setup();

        render(<UpAndDownGame />);
        const input = screen.getByLabelText("guess-input") as HTMLInputElement;
        const btn = screen.getByRole("button", { name: /guess/i });

        await user.type(input, "50");
        await user.click(btn);

        expect(screen.getByTestId("up-and-down-hint")).toHaveTextContent(
          "You got it!"
        );
        expect(
          screen.getByTestId("up-and-down-guess-history")
        ).toHaveTextContent(/50.*CORRECT/);
      });

      test("incorrect guesses", async () => {
        const user = userEvent.setup();

        render(<UpAndDownGame />);
        const input = screen.getByLabelText("guess-input") as HTMLInputElement;
        const btn = screen.getByRole("button", { name: /guess/i });

        await user.type(input, "30");
        await user.click(btn);
        expect(screen.getByTestId("up-and-down-hint")).toHaveTextContent(/UP/i);
        expect(
          screen.getByTestId("up-and-down-guess-history")
        ).toHaveTextContent(/30.*UP/);

        await user.clear(input);
        await user.type(input, "70");
        await user.click(btn);
        expect(screen.getByTestId("up-and-down-hint")).toHaveTextContent(
          /DOWN/i
        );
        expect(
          screen.getByTestId("up-and-down-guess-history")
        ).toHaveTextContent(/70.*DOWN/);

        // Ensure only 5 attempts are allowed
        for (let i = 0; i < 3; i++) {
          await user.clear(input);
          await user.type(input, "10");
          await user.click(btn);
        }
        expect(screen.getByTestId("up-and-down-hint")).toHaveTextContent(
          "Game over — answer was 50"
        );
      });
    });
  });
});
