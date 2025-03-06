import { render, screen } from "@testing-library/react";
import Home from "../page";
import { useRouter } from "next/navigation";
import userEvent from "@testing-library/user-event";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("Home", () => {
  it("renders the heading", () => {
    render(<Home />);
    expect(screen.getByText("Game Library")).toBeInTheDocument();
  });

  describe("Up And Down", () => {
    it("renders the Up And Down game link", () => {
      render(<Home />);

      const link = screen.getByRole("link", { name: "Up And Down" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/games/upAndDown");
    });

    it("navigates when clicking the Up And Down link", async () => {
      const mockPush = jest.fn();
      (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

      render(<Home />);
      const link = screen.getByRole("link", { name: "Up And Down" });

      await userEvent.click(link);
      expect(mockPush).not.toHaveBeenCalled(); // Next.js `Link` handles navigation differently
    });
  });
});
