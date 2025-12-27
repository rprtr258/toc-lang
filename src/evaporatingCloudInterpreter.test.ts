import {describe, expect, it} from "bun:test";
import {readFileSync} from "fs";
import {parseTextToAst} from "./interpreter.ts";
import {examples} from "./examples.ts";
import {evaporatingCloudTestcases as testcases} from "./testcases.ts";

describe("evaporating cloud tree interpreter", () => {
  for (const {name, text} of testcases) {
    it(name, () => {
      const ast = parseTextToAst(text);
      expect(ast).toStrictEqual(JSON.parse(readFileSync(`${__dirname}/__tests__/${name}.ec.json`).toString()));
    });
  }

  for (const {name, text} of examples.find(([group, _examples]) => group === "Evaporating Cloud")![1]) {
    it(`parses example: ${name}`, () => {
      const ast = parseTextToAst(text);
      expect(ast).toStrictEqual(JSON.parse(readFileSync(`${__dirname}/__tests__/example evaporating cloud: ${name}.json`).toString()));
    });
  }
});
