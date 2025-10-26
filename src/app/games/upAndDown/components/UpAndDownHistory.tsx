import React from "react";
import styles from "./styles/UpAndDownGame.module.css";
import { HistoryItem } from "../types";

export const UpAndDownHistory = ({ history }: { history: HistoryItem[] }) => {
  return (
    <aside className={styles.history} data-testid="up-and-down-guess-history">
      <h4 className={styles.historyTitle}>History</h4>
      {history.length === 0 ? (
        <div className={styles.empty}>No guesses yet</div>
      ) : (
        <ul className={styles.histList}>
          {history.map((h, i) => (
            <li key={i} className={styles.histItem}>
              <span className={styles.guess}>{h.guess}</span>
              <span
                className={`${styles.histBadge} ${
                  h.result === "UP"
                    ? styles.up
                    : h.result === "DOWN"
                    ? styles.down
                    : styles.correct
                }`}
              >
                {h.result}
              </span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
};
