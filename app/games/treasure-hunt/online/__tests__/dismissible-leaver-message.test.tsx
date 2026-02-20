import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import DismissibleLeaverMessage from "../DismissibleLeaverMessage";

const defaultSubtitle = "Game was reset to lobby. Host can start a new game.";

describe("DismissibleLeaverMessage", () => {
  it("renders the message and dismiss button", () => {
    render(
      <DismissibleLeaverMessage
        message="Player2 left the game"
        subtitle={defaultSubtitle}
      />,
    );

    expect(screen.getByText(/Player2 left the game/)).toBeInTheDocument();
    expect(screen.getByText(/Game was reset to lobby/)).toBeInTheDocument();

    const dismissButton = screen.getByRole("button", {
      name: /dismiss message/i,
    });
    expect(dismissButton).toBeInTheDocument();
  });

  it("hides the banner after dismiss", () => {
    render(
      <DismissibleLeaverMessage
        message="Player2 left the game"
        subtitle={defaultSubtitle}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /dismiss message/i }));

    expect(screen.queryByText(/Player2 left the game/)).not.toBeInTheDocument();
  });

  it("shows a new message after a dismissal", () => {
    const { rerender } = render(
      <DismissibleLeaverMessage
        message="Player2 left the game"
        subtitle={defaultSubtitle}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /dismiss message/i }));

    rerender(
      <DismissibleLeaverMessage
        message="Player3 left the game"
        subtitle={defaultSubtitle}
      />,
    );

    expect(screen.getByText(/Player3 left the game/)).toBeInTheDocument();
  });

  it("renders nothing when message is missing", () => {
    const { container } = render(
      <DismissibleLeaverMessage message={null} subtitle={defaultSubtitle} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders without subtitle when not provided", () => {
    render(<DismissibleLeaverMessage message="Player2 left the game" />);

    expect(screen.getByText(/Player2 left the game/)).toBeInTheDocument();
    expect(
      screen.queryByText(/Game was reset to lobby/),
    ).not.toBeInTheDocument();
  });
});
