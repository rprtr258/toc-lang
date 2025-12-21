import {describe, expect, it} from "bun:test";
import {wrapLines} from "../util.ts";

const testcases = [
  {
    text: "Subordinate all decisions to the financial goal",
    expected: ["Subordinate all ", "decisions to the ", "financial goal "],
  },
];

describe("util", () => {
  it("wrap lines", () => {
    for (const {text, expected} of testcases) {
      expect(wrapLines(text, 20)).toEqual(expected);
    }
  });
});
