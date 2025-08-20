export const GuessInput = () => {
  return (
    <input
      type="number"
      placeholder="Enter your guess.."
      name="guess"
      required
      min="1"
      max="100"
    />
  );
};
