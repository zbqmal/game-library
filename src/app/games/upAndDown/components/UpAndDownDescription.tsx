import styles from "./styles/UpAndDownDescription.module.css";

export const UpAndDownDescription = () => {
  return (
    <section className={styles.card} aria-label="up-and-down-description">
      <h2 className={styles.title}>Up &amp; Down — Guessing Game</h2>

      <p className={styles.text}>
        A random number between 1 and 100 will be given.
      </p>

      <p className={styles.text}>
        You should guess the number with only 5 chances.
      </p>

      <p className={styles.text}>
        Whenever you guess, you will get 3 kinds of responses.
      </p>

      <ul className={styles.list}>
        <li>
          <span className={`${styles.badge} ${styles.up}`}>UP</span>
          <span className={styles.expl}>
            : If your guess is lower than the answer.
          </span>
        </li>
        <li>
          <span className={`${styles.badge} ${styles.down}`}>DOWN</span>
          <span className={styles.expl}>
            : If your guess is higher than the answer.
          </span>
        </li>
        <li>
          <span className={`${styles.badge} ${styles.correct}`}>CORRECT</span>
          <span className={styles.expl}>: If your guess is correct!</span>
        </li>
      </ul>
    </section>
  );
};
