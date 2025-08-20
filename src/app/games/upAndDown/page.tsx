"use client";

import { useState } from "react";
import { getRandomInt } from "./utils";
import { GuessInput, UpAndDownDescription } from "./components";

export default function UpAndDown() {
  const [answer, setAnswer] = useState<number>(getRandomInt(1, 100));
  const [guess, setGuess] = useState<number | null>(null);

  /**
   * Checks if the user's guess is valid.
   * @param guess - The number guessed by the user.
   * @returns A boolean indicating whether the guess is valid.
   */
  const isGuessValid = (guess: number | null) => {
    return guess !== null && guess > 0;
  };

  /**
   * Submit button handler to apply user's guess.
   * @param event
   */
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevents page reload

    const formData = new FormData(event.currentTarget);
    const guess = formData.get("guess") as string;

    setGuess(Number(guess));
  };

  /**
   * Generates a hint based on the user's guess compared to the correct answer.
   *
   * @param guess - The number guessed by the user.
   * @returns A string indicating whether the guess should be higher ("UP"), lower ("DOWN"), or if it is correct ("CORRECT!!!").
   */
  const generateHint = (guess: number | null, answer: number) => {
    if (guess === null) return "";
    if (guess > answer) return "DOWN";
    if (guess < answer) return "UP";
    if (guess === answer) return "CORRECT!!!";
    return "";
  };

  return (
    <>
      <UpAndDownDescription />
      <form onSubmit={handleSubmit}>
        <GuessInput />
        <button type="submit">GUESS</button>
      </form>
      {isGuessValid(guess) && (
        <>
          <div>Your last guess: {guess}</div>
          <div>HINT: {generateHint(guess, answer)}</div>
        </>
      )}
    </>
  );
}
