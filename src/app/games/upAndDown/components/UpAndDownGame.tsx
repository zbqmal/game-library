import React, { useEffect, useState } from "react";
import styles from "./styles/UpAndDownGame.module.css";
import { getRandomInt } from "../utils";
import { HistoryItem, Result } from "../types";
import { MAX_ATTEMPTS } from "../constants";
import { UpAndDownHeader } from "./UpAndDownHeader";
import { UpAndDownHistory } from "./UpAndDownHistory";
import { UpAndDownControls } from "./UpAndDownControls";

export const UpAndDownGame = () => {
  const [target, setTarget] = useState<number>(() => getRandomInt(1, 100));
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    // reset if target changes externally in future
  }, [target]);

  /**
   * Resets the game to its initial state.
   */
  const reset = () => {
    setTarget(getRandomInt(1, 100));
    setAttemptsLeft(MAX_ATTEMPTS);
    setHistory([]);
    setFinished(false);
  };

  /**
   * Handles a user's guess.
   * @param value - The number guessed by the user.
   */
  const handleGuess = (value: number) => {
    if (finished || attemptsLeft <= 0) return;

    let result: Result;
    if (value === target) {
      result = Result.CORRECT;
      setFinished(true);
    } else if (value < target) {
      result = Result.UP;
    } else {
      result = Result.DOWN;
    }

    setHistory((h) => [{ guess: value, result }, ...h]);
    setAttemptsLeft((a) => Math.max(0, a - 1));

    // If out of attempts and not correct, finish the game
    if (result !== Result.CORRECT && attemptsLeft - 1 <= 0) {
      setFinished(true);
    }
  };

  const lastResult = history[0]?.result;
  const disableInput = finished || attemptsLeft <= 0;

  return (
    <div className={styles.layout}>
      <section className={styles.panel} aria-label="up-and-down-game">
        <UpAndDownHeader
          attemptsLeft={attemptsLeft}
          maxAttempts={MAX_ATTEMPTS}
          onReset={reset}
        />

        <div className={styles.main}>
          <UpAndDownControls
            onGuess={handleGuess}
            disabledInput={disableInput}
            lastResult={lastResult}
            finished={finished}
            target={target}
          />

          <UpAndDownHistory history={history} />
        </div>
      </section>
    </div>
  );
};
