import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchBar from "../SearchBar";
import { translationEngine } from "@/app/translation-engine";

describe("SearchBar", () => {
  beforeEach(() => {
    localStorage.clear();
    translationEngine.changeLanguage("en");
  });

  it("renders with placeholder text", () => {
    const mockOnSearch = jest.fn();
    render(<SearchBar onSearch={mockOnSearch} placeholder="Search games..." />);

    const input = screen.getByPlaceholderText("Search games...");
    expect(input).toBeInTheDocument();
  });

  it("calls onSearch with debounced value", async () => {
    const mockOnSearch = jest.fn();
    const user = userEvent.setup();

    render(<SearchBar onSearch={mockOnSearch} debounceMs={100} />);

    const input = screen.getByRole("textbox", { name: /search games/i });

    // Type "test"
    await user.type(input, "test");

    // Should not be called immediately
    expect(mockOnSearch).not.toHaveBeenCalledWith("test");

    // Wait for debounce
    await waitFor(
      () => {
        expect(mockOnSearch).toHaveBeenCalledWith("test");
      },
      { timeout: 200 },
    );
  });

  it("shows clear button when text is entered", async () => {
    const mockOnSearch = jest.fn();
    const user = userEvent.setup();

    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByRole("textbox", { name: /search games/i });

    // Initially no clear button
    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();

    // Type something
    await user.type(input, "test");

    // Clear button should appear
    expect(screen.getByLabelText("Clear search")).toBeInTheDocument();
  });

  it("clears input when clear button is clicked", async () => {
    const mockOnSearch = jest.fn();
    const user = userEvent.setup();

    render(<SearchBar onSearch={mockOnSearch} debounceMs={50} />);

    const input = screen.getByRole("textbox", { name: /search games/i });

    // Type something
    await user.type(input, "test");
    expect(input).toHaveValue("test");

    // Click clear button
    const clearButton = screen.getByLabelText("Clear search");
    await user.click(clearButton);

    // Input should be cleared
    expect(input).toHaveValue("");

    // Should eventually call onSearch with empty string
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith("");
    });
  });

  it("displays current search query", async () => {
    const mockOnSearch = jest.fn();
    const user = userEvent.setup();

    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByRole("textbox", { name: /search games/i });

    // Type something
    await user.type(input, "puzzle");

    // Should show what we're searching for
    expect(screen.getByText(/Searching for:/)).toBeInTheDocument();
    expect(screen.getByText("puzzle")).toBeInTheDocument();
  });

  it("renders Spanish placeholder and labels when language is Spanish", () => {
    translationEngine.changeLanguage("es");
    render(<SearchBar onSearch={jest.fn()} />);

    expect(screen.getByPlaceholderText("Buscar juegos...")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /buscar juegos/i }),
    ).toBeInTheDocument();
  });
});
