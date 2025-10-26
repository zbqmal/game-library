import React from "react";
import styles from "./styles/UpAndDownControls.module.css";
import { GuessInput } from "./GuessInput";
import { Result } from "../types";

type Props = {
  onGuess: (n: number) => void;
  disabledInput: boolean;
  lastResult?: Result;
  finished: boolean;
  target: number;
};

export const UpAndDownControls: React.FC<Props> = ({
  onGuess,
  disabledInput,
  lastResult,
  finished,
  target,
}) => {
  /**
   * Renders the hint area based on game state
   * @returns
   */
  const renderHint = () => {
    if (finished) {
      if (lastResult === Result.CORRECT) {
        return (
          <span className={`${styles.badge} ${styles.correct}`}>
            You got it!
          </span>
        );
      }
      return (
        <span className={styles.over}>Game over — answer was {target}</span>
      );
    }

    if (lastResult) {
      const directionClass = lastResult === Result.UP ? styles.up : styles.down;
      return (
        <span className={`${styles.badge} ${directionClass}`}>
          {lastResult}
        </span>
      );
    }

    return <span className={styles.note}>Make your guess</span>;
  };

  return (
    <div className={styles.inputArea}>
      <GuessInput onGuess={onGuess} disabled={disabledInput} />
      <div className={styles.hint} data-testid="up-and-down-hint">
        {renderHint()}
      </div>
    </div>
  );
};
