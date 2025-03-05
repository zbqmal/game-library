import { render, screen } from "@testing-library/react";
import Home from "../page";
import { games } from "../constants";

describe("Home", () => {
  it("renders the heading", () => {
    render(<Home />);
    expect(screen.getByText("Game Library")).toBeInTheDocument();
  });

  it("renders the list of games", () => {
    render(<Home />);

    games.forEach((game) => {
      expect(screen.getByText(game)).toBeInTheDocument();
    });
  });
});
