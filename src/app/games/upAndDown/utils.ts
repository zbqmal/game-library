/**
 * Returns a random number in the range between min and max given
 * @param min minimum number of the range
 * @param max maximum number of the range
 * @returns random number between min and max
 */
export function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  if (min > max) [min, max] = [max, min];

  return Math.floor(Math.random() * (max - min + 1)) + min;
}
