import { capitalize } from "./utils";

describe("capitalize", () => {
  const tests: Array<[string, string]> = [
    ["", ""],
    ["a", "A"],
    ["A", "A"],
    ["al", "Al"],
    ["sTrAnGe", "STrAnGe"],
  ];

  tests.forEach(([input, expected]) => {
    it(`should return "${expected}" for "${input}"`, () => expect(capitalize(input)).toBe(expected));
  });
});
