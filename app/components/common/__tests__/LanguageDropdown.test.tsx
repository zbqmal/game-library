import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LanguageDropdown from "../LanguageDropdown";
import { translationEngine } from "@/app/translation-engine";

describe("LanguageDropdown", () => {
  beforeEach(() => {
    localStorage.clear();
    translationEngine.changeLanguage("en");
  });

  it("should render language dropdown", () => {
    render(<LanguageDropdown />);

    const select = screen.getByRole("combobox", { name: /language/i });
    expect(select).toBeInTheDocument();
  });

  it("should display English as default selected language", () => {
    render(<LanguageDropdown />);

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("en");
  });

  it("should display all three language options", () => {
    render(<LanguageDropdown />);

    expect(
      screen.getByRole("option", { name: /english/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /spanish/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /korean/i })).toBeInTheDocument();
  });

  it("should change language when option is selected", () => {
    render(<LanguageDropdown />);

    const select = screen.getByRole("combobox") as HTMLSelectElement;

    fireEvent.change(select, { target: { value: "es" } });

    expect(select.value).toBe("es");
    expect(translationEngine.getActiveLanguage()).toBe("es");
  });

  it("should switch to Korean when selected", () => {
    render(<LanguageDropdown />);

    const select = screen.getByRole("combobox") as HTMLSelectElement;

    fireEvent.change(select, { target: { value: "ko" } });

    expect(select.value).toBe("ko");
    expect(translationEngine.getActiveLanguage()).toBe("ko");
  });

  it("should apply correct styling classes", () => {
    render(<LanguageDropdown />);

    const select = screen.getByRole("combobox");
    expect(select).toHaveClass("bg-white/10");
    expect(select).toHaveClass("backdrop-blur-sm");
    expect(select).toHaveClass("text-white");
    expect(select).toHaveClass("border-white/20");
  });

  it("should have accessible label", () => {
    render(<LanguageDropdown />);

    const select = screen.getByRole("combobox");
    const label = screen.getByLabelText(/language/i);

    expect(label).toBe(select);
  });

  it("should update displayed options when language changes", () => {
    const { rerender } = render(<LanguageDropdown />);

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "es" } });

    rerender(<LanguageDropdown />);

    // After changing to Spanish, verify Spanish option exists
    expect(
      screen.getByRole("option", { name: "🇪🇸 Español" }),
    ).toBeInTheDocument();
  });

  it("should persist language selection in localStorage", () => {
    render(<LanguageDropdown />);

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "ko" } });

    expect(localStorage.getItem("game_library_language_preference")).toBe("ko");
  });
});
