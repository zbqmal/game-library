import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NameInputModal from "../NameInputModal";

describe("NameInputModal", () => {
  const mockOnSave = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not render when visible is false", () => {
    const { container } = render(
      <NameInputModal
        visible={false}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeInTheDocument();
  });

  it("renders when visible is true", () => {
    const { container } = render(
      <NameInputModal
        visible={true}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toBeInTheDocument();
  });

  it("renders the modal title", () => {
    render(
      <NameInputModal
        visible={true}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    expect(screen.getByText("Top 10 Score!")).toBeInTheDocument();
  });

  it("renders the trophy emoji", () => {
    render(
      <NameInputModal
        visible={true}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    expect(screen.getByText("🏆")).toBeInTheDocument();
  });

  it("displays the score when provided", () => {
    render(
      <NameInputModal
        visible={true}
        score={100}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    expect(screen.getByText(/You scored/i)).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("does not display score when not provided", () => {
    render(
      <NameInputModal
        visible={true}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    expect(screen.queryByText(/You scored/i)).not.toBeInTheDocument();
  });

  it("renders the input field with correct id and label", () => {
    render(
      <NameInputModal
        visible={true}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    const input = screen.getByRole("textbox", { name: /Enter your name/i });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("id", "player-name");
  });

  it("renders Save Score button", () => {
    render(
      <NameInputModal
        visible={true}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    expect(
      screen.getByRole("button", { name: /Save Score/i }),
    ).toBeInTheDocument();
  });

  it("renders Skip button", () => {
    render(
      <NameInputModal
        visible={true}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    expect(screen.getByRole("button", { name: /Skip/i })).toBeInTheDocument();
  });

  it("updates input value when user types", async () => {
    const user = userEvent.setup();
    render(
      <NameInputModal
        visible={true}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    const input = screen.getByRole("textbox", {
      name: /Enter your name/i,
    }) as HTMLInputElement;
    await user.type(input, "John");

    expect(input.value).toBe("John");
  });

  it("disables Save Score button when input is empty", () => {
    render(
      <NameInputModal
        visible={true}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    const saveButton = screen.getByRole("button", { name: /Save Score/i });
    expect(saveButton).toBeDisabled();
  });

  it("enables Save Score button when input has text", async () => {
    const user = userEvent.setup();
    render(
      <NameInputModal
        visible={true}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    const input = screen.getByRole("textbox", { name: /Enter your name/i });
    await user.type(input, "John");

    const saveButton = screen.getByRole("button", { name: /Save Score/i });
    expect(saveButton).not.toBeDisabled();
  });

  it("calls onSave with trimmed name on form submission", async () => {
    const user = userEvent.setup();
    render(
      <NameInputModal
        visible={true}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    const input = screen.getByRole("textbox", { name: /Enter your name/i });
    await user.type(input, "  John  ");

    const saveButton = screen.getByRole("button", { name: /Save Score/i });
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith("John");
  });

  it("calls onClose when Skip button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <NameInputModal
        visible={true}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    const skipButton = screen.getByRole("button", { name: /Skip/i });
    await user.click(skipButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("closes modal on Escape key press", async () => {
    const user = userEvent.setup();
    render(
      <NameInputModal
        visible={true}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    const input = screen.getByRole("textbox", { name: /Enter your name/i });
    await user.type(input, "John");
    await user.keyboard("{Escape}");

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("sets default name when defaultName prop is provided", async () => {
    const { rerender } = render(
      <NameInputModal
        visible={true}
        defaultName=""
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    rerender(
      <NameInputModal
        visible={true}
        defaultName="Jane"
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    const input = screen.getByRole("textbox", {
      name: /Enter your name/i,
    }) as HTMLInputElement;
    expect(input.value).toBe("Jane");
  });

  it("enforces maximum length of 20 characters", async () => {
    const user = userEvent.setup();
    render(
      <NameInputModal
        visible={true}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    const input = screen.getByRole("textbox", {
      name: /Enter your name/i,
    }) as HTMLInputElement;
    expect(input).toHaveAttribute("maxLength", "20");
  });

  it("displays character count", async () => {
    const user = userEvent.setup();
    render(
      <NameInputModal
        visible={true}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    const input = screen.getByRole("textbox", { name: /Enter your name/i });
    await user.type(input, "John");

    expect(screen.getByText("4/20 characters")).toBeInTheDocument();
  });

  it("focuses input field when modal becomes visible", async () => {
    const { rerender } = render(
      <NameInputModal
        visible={false}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    rerender(
      <NameInputModal
        visible={true}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    const input = screen.getByRole("textbox", { name: /Enter your name/i });
    await waitFor(() => {
      expect(input).toHaveFocus();
    });
  });

  it("has correct accessibility attributes for dialog", () => {
    const { container } = render(
      <NameInputModal
        visible={true}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "modal-title");
  });

  it("does not submit form with only whitespace", async () => {
    const user = userEvent.setup();
    render(
      <NameInputModal
        visible={true}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    const input = screen.getByRole("textbox", { name: /Enter your name/i });
    await user.type(input, "   ");

    const saveButton = screen.getByRole("button", { name: /Save Score/i });
    expect(saveButton).toBeDisabled();
  });

  it("clears input after successful submission", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <NameInputModal
        visible={true}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    const input = screen.getByRole("textbox", {
      name: /Enter your name/i,
    }) as HTMLInputElement;
    await user.type(input, "John");

    const saveButton = screen.getByRole("button", { name: /Save Score/i });
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith("John");

    // Rerender with same visible state
    rerender(
      <NameInputModal
        visible={true}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    expect(input.value).toBe("");
  });
});
