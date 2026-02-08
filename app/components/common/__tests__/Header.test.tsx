import React from "react";
import { render, screen } from "@testing-library/react";
import Header from "../Header";
import { translationEngine } from "@/app/translation-engine";

describe("Header", () => {
  beforeEach(() => {
    localStorage.clear();
    translationEngine.changeLanguage('en');
  });

  it("renders the header element", () => {
    const { container } = render(<Header />);

    const header = container.querySelector("header");
    expect(header).toBeInTheDocument();
  });

  it("renders the title text with emoji", () => {
    render(<Header />);

    expect(screen.getByText(/🎮 Game Library/i)).toBeInTheDocument();
  });

  it("renders the title as an h1 heading", () => {
    render(<Header />);

    const heading = screen.getByRole("heading", {
      level: 1,
      name: /Game Library/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it("applies gradient background styling", () => {
    const { container } = render(<Header />);

    const header = container.querySelector("header");
    expect(header).toHaveClass(
      "bg-gradient-to-r",
      "from-purple-600",
      "to-blue-600",
    );
  });

  it("applies text styling classes", () => {
    const { container } = render(<Header />);

    const header = container.querySelector("header");
    expect(header).toHaveClass("text-white", "shadow-lg");
  });

  it("centers the content", () => {
    render(<Header />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveClass("text-center");
  });

  it("applies responsive font sizing", () => {
    render(<Header />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveClass("text-3xl", "md:text-4xl");
  });

  it("applies bold font weight", () => {
    render(<Header />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveClass("font-bold");
  });

  it("has full width header", () => {
    const { container } = render(<Header />);

    const header = container.querySelector("header");
    expect(header).toHaveClass("w-full");
  });

  it("has proper padding and container layout", () => {
    const { container } = render(<Header />);

    const container_div = container.querySelector(".container");
    expect(container_div).toHaveClass("mx-auto", "px-4", "py-6");
  });

  it("renders language dropdown", () => {
    render(<Header />);
    
    const languageDropdown = screen.getByRole("combobox");
    expect(languageDropdown).toBeInTheDocument();
  });

  it("displays Spanish title when language is Spanish", () => {
    translationEngine.changeLanguage('es');
    const { rerender } = render(<Header />);
    rerender(<Header />);
    
    expect(screen.getByText(/🎮 Biblioteca de Juegos/i)).toBeInTheDocument();
  });

  it("displays Korean title when language is Korean", () => {
    translationEngine.changeLanguage('ko');
    const { rerender } = render(<Header />);
    rerender(<Header />);
    
    expect(screen.getByText(/🎮 게임 라이브러리/i)).toBeInTheDocument();
  });
});

