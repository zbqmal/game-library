import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import LoadingSpinner from "../LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders spinner with default size", () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();
  });

  it("renders spinner with custom text", () => {
    render(<LoadingSpinner text="Loading data..." />);
    expect(screen.getByText("Loading data...")).toBeInTheDocument();
  });

  it("renders small spinner", () => {
    render(<LoadingSpinner size="sm" />);
    const spinner = screen.getByRole("status");
    expect(spinner).toHaveClass("h-6", "w-6");
  });

  it("renders medium spinner by default", () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole("status");
    expect(spinner).toHaveClass("h-12", "w-12");
  });

  it("renders large spinner", () => {
    render(<LoadingSpinner size="lg" />);
    const spinner = screen.getByRole("status");
    expect(spinner).toHaveClass("h-16", "w-16");
  });

  it("has correct aria-label", () => {
    render(<LoadingSpinner text="Processing" />);
    const spinner = screen.getByRole("status");
    expect(spinner).toHaveAttribute("aria-label", "Processing");
  });

  it("has default aria-label when no text provided", () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole("status");
    expect(spinner).toHaveAttribute("aria-label", "Loading");
  });
});
