import React from "react";
import { render, screen } from "@testing-library/react";
import { UpAndDownDescription } from "../UpAndDownDescription";

describe("UpAndDownDescription", () => {
  describe("Rendering", () => {
    test("renders title, description and badges", () => {
      render(<UpAndDownDescription />);
      expect(
        screen.getByRole("heading", { name: /up & down/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/A random number between 1 and 100/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/UP/)).toBeInTheDocument();
      expect(screen.getByText(/DOWN/)).toBeInTheDocument();
      expect(screen.getByText(/CORRECT/)).toBeInTheDocument();
    });
  });
});
