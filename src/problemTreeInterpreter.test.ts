import {describe, expect, it} from "bun:test";
import {readFileSync} from "fs";
import {parseTextToAst, parseProblemTreeSemantics} from "./interpreter.ts";
import {examples} from "./examples.ts";
import {Ast} from "./parser.ts";
import {problemTreeTestcases as testcases} from "./testcases.ts";

describe("problem tree interpreter", () => {
  for (const {name, text} of testcases) {
    it(name, () => {
      const ast = parseTextToAst(text);
      expect(ast).toStrictEqual(JSON.parse(readFileSync(`${__dirname}/__tests__/parses ast for input ${name}.json`).toString()));
    });
  };

  it("fails for cause referencing unknown node", () => {
    const text = `
    type: problem
    b: "badness" {class: UDE}
    c: "cause"
    d <- c
    `;
    const expected: Ast = {
      type: "problem",
      nodes: [
        {id: "b", text: "badness", params: {class: "UDE"}},
        {id: "c", text: "cause", params: {}},
      ],
      edges: [
        {fromIds: ["c"], toId: "d", text: undefined},
      ],
    };
    const ast = parseTextToAst(text);
    expect(ast).toEqual(expected);
    expect(() => parseProblemTreeSemantics(ast)).toThrowError(/^Effect d not declared$/);
  });

  for (const {name, text} of examples.find(([group, _examples]) => group === "Current Reality Tree")![1]) {
    it(`parses example: ${name}`, () => {
      const ast = parseTextToAst(text);
      expect(ast.type).toEqual("problem");
      const semantics = parseProblemTreeSemantics(ast);
      expect(JSON.parse(JSON.stringify({ast, semantics}))).toStrictEqual(JSON.parse(readFileSync(`${__dirname}/__tests__/example problem tree: ${name}.json`).toString()));
    });
  }
});
