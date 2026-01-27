import React from "react";
import { render, screen } from "@testing-library/react";
import GameShell from "../GameShell";

describe("GameShell", () => {
  it("renders the title", () => {
    render(
      <GameShell title="Test Game" description="Test description">
        <div>Game content</div>
      </GameShell>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: /Test Game/i }),
    ).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(
      <GameShell title="Test Game" description="This is a test description">
        <div>Game content</div>
      </GameShell>,
    );

    expect(screen.getByText(/This is a test description/i)).toBeInTheDocument();
  });

  it("renders children content", () => {
    render(
      <GameShell title="Test Game" description="Test description">
        <div>Game content here</div>
      </GameShell>,
    );

    expect(screen.getByText(/Game content here/i)).toBeInTheDocument();
  });

  it("renders back to games link with correct href", () => {
    render(
      <GameShell title="Test Game" description="Test description">
        <div>Game content</div>
      </GameShell>,
    );

    const backLink = screen.getByRole("link", { name: /Back to Games/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("renders scoreboard when provided", () => {
    render(
      <GameShell
        title="Test Game"
        description="Test description"
        scoreboard={<div>Scoreboard content</div>}
      >
        <div>Game content</div>
      </GameShell>,
    );

    expect(screen.getByText(/Scoreboard content/i)).toBeInTheDocument();
  });

  it("does not render scoreboard when not provided", () => {
    render(
      <GameShell title="Test Game" description="Test description">
        <div>Game content</div>
      </GameShell>,
    );

    expect(screen.queryByText(/Scoreboard content/i)).not.toBeInTheDocument();
  });

  it("applies correct grid layout when scoreboard is provided", () => {
    const { container } = render(
      <GameShell
        title="Test Game"
        description="Test description"
        scoreboard={<div>Scoreboard</div>}
      >
        <div>Game content</div>
      </GameShell>,
    );

    const gameAreaDiv = container.querySelector(".lg\\:col-span-2");
    expect(gameAreaDiv).toBeInTheDocument();
  });

  it("applies correct grid layout when scoreboard is not provided", () => {
    const { container } = render(
      <GameShell title="Test Game" description="Test description">
        <div>Game content</div>
      </GameShell>,
    );

    const gameAreaDiv = container.querySelector(".lg\\:col-span-3");
    expect(gameAreaDiv).toBeInTheDocument();
  });

  it("renders back button svg icon", () => {
    const { container } = render(
      <GameShell title="Test Game" description="Test description">
        <div>Game content</div>
      </GameShell>,
    );

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
  });

  it("wraps game content in white background box", () => {
    const { container } = render(
      <GameShell title="Test Game" description="Test description">
        <div>Game content</div>
      </GameShell>,
    );

    const whiteBox = container.querySelector(".bg-white");
    expect(whiteBox).toBeInTheDocument();
    expect(whiteBox).toHaveClass("rounded-lg", "shadow-lg", "p-6");
  });
});
