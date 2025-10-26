import { render, screen, fireEvent } from "@testing-library/react";
import UpAndDown from "../page";
import * as utils from "./../utils";

jest.mock("./../utils", () => ({
  getRandomInt: jest.fn(), // Mock the function
}));

describe("UpAndDown", () => {
  const mockGetRandomInt = utils.getRandomInt as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (utils.getRandomInt as jest.Mock).mockReset();
  });

  it("renders the component correctly", () => {
    render(<UpAndDown />);

    expect(
      screen.getByPlaceholderText("Enter your guess..")
    ).toBeInTheDocument();
    expect(screen.getByText("GUESS")).toBeInTheDocument();
  });

  it("displays 'UP' when the guess is lower than the answer", () => {
    mockGetRandomInt.mockReturnValue(70);

    render(<UpAndDown />);

    const input = screen.getByPlaceholderText(
      "Enter your guess.."
    ) as HTMLInputElement;
    const button = screen.getByText("GUESS");

    fireEvent.change(input, { target: { value: "50" } });
    fireEvent.click(button);

    expect(screen.getByText("Your last guess: 50")).toBeInTheDocument();
    expect(screen.getByText("HINT: UP")).toBeInTheDocument();
  });

  it("displays 'DOWN' when the guess is higher than the answer", () => {
    mockGetRandomInt.mockReturnValue(30);

    render(<UpAndDown />);

    const input = screen.getByPlaceholderText(
      "Enter your guess.."
    ) as HTMLInputElement;
    const button = screen.getByText("GUESS");

    fireEvent.change(input, { target: { value: "50" } });
    fireEvent.click(button);

    expect(screen.getByText("Your last guess: 50")).toBeInTheDocument();
    expect(screen.getByText("HINT: DOWN")).toBeInTheDocument();
  });

  it("displays 'CORRECT!!!' when the guess is exactly the answer", () => {
    mockGetRandomInt.mockReturnValue(50); // Mock answer as 50

    render(<UpAndDown />);

    const input = screen.getByPlaceholderText(
      "Enter your guess.."
    ) as HTMLInputElement;
    const button = screen.getByText("GUESS");

    fireEvent.change(input, { target: { value: "50" } });
    fireEvent.click(button);

    expect(screen.getByText("Your last guess: 50")).toBeInTheDocument();
    expect(screen.getByText("HINT: CORRECT!!!")).toBeInTheDocument();
  });

  test.each([
    { value: null, description: "null" },
    { value: "", description: "an empty string" },
  ])(
    "displays nothing when no guess has been made (input value: $description)",
    ({ value }) => {
      mockGetRandomInt.mockReturnValue(30);

      render(<UpAndDown />);

      const input = screen.getByPlaceholderText(
        "Enter your guess.."
      ) as HTMLInputElement;
      const button = screen.getByText("GUESS");

      fireEvent.change(input, { target: { value } });
      fireEvent.click(button);

      expect(screen.queryByText("Your last guess:")).not.toBeInTheDocument();
      expect(screen.queryByText("HINT:")).not.toBeInTheDocument();
    }
  );

  it("ensures the form does not submit empty values", () => {
    render(<UpAndDown />);

    const button = screen.getByText("GUESS");

    fireEvent.click(button);

    expect(screen.queryByText(/Your last guess:/)).not.toBeInTheDocument();
  });
});
