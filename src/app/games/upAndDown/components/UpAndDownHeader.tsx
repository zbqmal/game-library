import React from "react";
import styles from "./styles/UpAndDownGame.module.css";

export const UpAndDownHeader = ({
  attemptsLeft,
  maxAttempts,
  onReset,
}: {
  attemptsLeft: number;
  maxAttempts: number;
  onReset: () => void;
}) => {
  return (
    <header className={styles.header}>
      <h3 className={styles.title}>Play</h3>
      <div className={styles.controls}>
        <button
          className={styles.reset}
          onClick={onReset}
          data-testid="up-and-down-reset-button"
        >
          Reset
        </button>
        <div className={styles.attempts}>
          Attempts: {attemptsLeft}/{maxAttempts}
        </div>
      </div>
    </header>
  );
};
