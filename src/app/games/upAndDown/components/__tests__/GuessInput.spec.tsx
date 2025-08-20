import { render, screen } from "@testing-library/react";
import { GuessInput } from "../GuessInput";

describe("GuessInput", () => {
  it("renders the input", () => {
    render(<GuessInput />);

    const input = screen.getByPlaceholderText("Enter your guess..");
    expect(input).toBeInTheDocument();
  });
});
