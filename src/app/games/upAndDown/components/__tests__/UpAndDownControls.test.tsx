import React from "react";
import { render, screen } from "@testing-library/react";
import { UpAndDownControls } from "../UpAndDownControls";
import { Result } from "../../types";

describe("UpAndDownControls", () => {
  test("shows prompt when no lastResult and not finished", () => {
    render(
      <UpAndDownControls
        onGuess={() => {}}
        disabledInput={false}
        lastResult={undefined}
        finished={false}
        target={42}
      />
    );
    expect(screen.getByTestId("up-and-down-hint")).toHaveTextContent(
      /Make your guess/i
    );
  });

  test("shows UP badge when lastResult present", () => {
    render(
      <UpAndDownControls
        onGuess={() => {}}
        disabledInput={false}
        lastResult={Result.UP}
        finished={false}
        target={42}
      />
    );
    expect(screen.getByTestId("up-and-down-hint")).toHaveTextContent(/UP/);
  });

  test("shows DOWN badge when lastResult present", () => {
    render(
      <UpAndDownControls
        onGuess={() => {}}
        disabledInput={false}
        lastResult={Result.DOWN}
        finished={false}
        target={42}
      />
    );
    expect(screen.getByTestId("up-and-down-hint")).toHaveTextContent(/DOWN/);
  });

  test("shows finished messages with correct result", () => {
    render(
      <UpAndDownControls
        onGuess={() => {}}
        disabledInput={true}
        lastResult={Result.CORRECT}
        finished={true}
        target={50}
      />
    );
    expect(screen.getByTestId("up-and-down-hint")).toHaveTextContent(
      /You got it!/i
    );
  });

  test("shows finished messages with failed result", () => {
    render(
      <UpAndDownControls
        onGuess={() => {}}
        disabledInput={true}
        lastResult={Result.UP}
        finished={true}
        target={77}
      />
    );
    expect(screen.getByTestId("up-and-down-hint")).toHaveTextContent(
      /Game over — answer was 77/i
    );
  });
});
