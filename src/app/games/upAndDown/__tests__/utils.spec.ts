import { getRandomInt } from "../utils";

describe("utils", () => {
  describe("getRandomInt", () => {
    it("should return a number in its boundary", () => {
      for (let i = 0; i < 10; i++) {
        const randomInt = getRandomInt(1, 100);

        expect(randomInt).toBeGreaterThanOrEqual(1);
        expect(randomInt).toBeLessThanOrEqual(100);
      }
    });
  });
});
