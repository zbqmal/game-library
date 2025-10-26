import React, { useState } from "react";
import styles from "./styles/GuessInput.module.css";

export const GuessInput = ({
  onGuess,
  disabled,
}: {
  onGuess: (n: number) => void;
  disabled?: boolean;
}) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles the submission of a guess.
   */
  const submitGuess = () => {
    const guess = parseInt(value, 10);
    if (Number.isNaN(guess)) {
      setError("Enter a number between 1 and 100");
      return;
    }
    if (guess < 1 || guess > 100) {
      setError("Number must be between 1 and 100");
      return;
    }
    setError(null);
    onGuess(guess);
    setValue("");
  };

  /**
   * Handles key press events in the input field.
   * @param e - The keyboard event.
   */
  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submitGuess();
  };

  return (
    <div className={styles.wrap}>
      <label className={styles.label}>
        Your guess
        <input
          className={styles.input}
          type="number"
          min={1}
          max={100}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          disabled={disabled}
          aria-label="guess-input"
          data-testid="up-and-down-guess-input"
        />
      </label>
      <div className={styles.actions}>
        <button
          className={styles.submit}
          onClick={submitGuess}
          disabled={disabled}
          data-testid="up-and-down-guess-button"
        >
          Guess
        </button>
      </div>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
};
