import {describe, expect, it} from "bun:test";
import {readFileSync} from "fs";
import {parseTextToAst, parseGoalTreeSemantics} from "./interpreter.ts";
import {examples} from "./examples.ts";
import {goalTreeTestcases as testcases} from "./testcases.ts";

describe("goal tree interpreter", () => {
  for (const {name, text} of testcases) {
    it(name, () => {
      const ast = parseTextToAst(text);
      expect(ast).toStrictEqual(JSON.parse(readFileSync(`${__dirname}/__tests__/${name}.gt.json`).toString()));
    });
  }

  for (const {name, text} of examples.find(([group, _examples]) => group === "Goal Tree")![1]) {
    it(`parses example: ${name}`, () => {
      const ast = parseTextToAst(text);
      expect(ast.type).toEqual("goal");
      const semantics = parseGoalTreeSemantics(ast);
      expect({ast, semantics}).toStrictEqual(JSON.parse(readFileSync(`${__dirname}/__tests__/example goal tree: ${name}.json`).toString()));
    });
  }
});
