"use client";

import { useState } from "react";
import { getRandomInt } from "./utils";
import { GuessInput, UpAndDownDescription } from "./components";

export default function UpAndDown() {
  const [answer, setAnswer] = useState<number>(getRandomInt(1, 100));
  const [guess, setGuess] = useState<number>(0);

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

  return (
    <>
      <UpAndDownDescription />
      <form onSubmit={handleSubmit}>
        <GuessInput />
        <button type="submit">GUESS</button>
      </form>
      {guess > 0 && (
        <>
          <div>Your last guess: {guess}</div>
          <div>
            HINT:{" "}
            {guess > answer ? "DOWN" : guess < answer ? "UP" : "CORRECT!!!"}
          </div>
        </>
      )}
    </>
  );
}
