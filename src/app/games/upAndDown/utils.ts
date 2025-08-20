/**
 * Returns a random number in the range between min and max given
 * @param min minimum number of the range
 * @param max maximum number of the range
 * @returns random number between min and max
 */
export const getRandomInt = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
