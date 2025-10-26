import React from "react";
import { render, screen } from "@testing-library/react";
import { UpAndDownHistory } from "../UpAndDownHistory";
import { HistoryItem, Result } from "../../types";

describe("UpAndDownHistory", () => {
  describe("Rendering", () => {
    test("renders empty state", () => {
      render(<UpAndDownHistory history={[]} />);

      expect(screen.getByTestId("up-and-down-guess-history")).toHaveTextContent(
        /No guesses yet/i
      );
    });

    test("renders history list", () => {
      const history: HistoryItem[] = [
        { guess: 10, result: "UP" as Result },
        { guess: 90, result: "DOWN" as Result },
        { guess: 42, result: "CORRECT" as Result },
      ];
      render(<UpAndDownHistory history={history} />);

      expect(screen.getByTestId("up-and-down-guess-history")).toHaveTextContent(
        "10"
      );
      expect(screen.getByTestId("up-and-down-guess-history")).toHaveTextContent(
        "90"
      );
      expect(screen.getByTestId("up-and-down-guess-history")).toHaveTextContent(
        "42"
      );
    });
  });
});
