import {describe, expect, it} from "bun:test";
import {readFileSync} from "fs";
import {Ast} from "./parser.ts";
import {parseTextToAst, parseGoalTreeSemantics, parseProblemTreeSemantics, TreeSemantics} from "./interpreter.ts";
import {examples} from "./examples.ts";
import {evaporatingCloudTestcases, goalTreeTestcases, problemTreeTestcases} from "./testcases.ts";

describe("evaporating cloud", () => {
  for (const {name, text} of evaporatingCloudTestcases) {
    it(name, () => {
      const ast = parseTextToAst(text);
      expect(ast).toStrictEqual(JSON.parse(readFileSync(`${__dirname}/__tests__/${name}.ec.json`).toString()) as Ast);
    });
  }

  for (const {name, text} of examples.find(([group, _examples]) => group === "Evaporating Cloud")![1]) {
    it(`parses example: ${name}`, () => {
      const ast = parseTextToAst(text);
      expect(ast).toStrictEqual(JSON.parse(readFileSync(`${__dirname}/__tests__/example evaporating cloud: ${name}.json`).toString()) as Ast);
    });
  }
});

describe("goal tree", () => {
  for (const {name, text} of goalTreeTestcases) {
    it(name, () => {
      const ast = parseTextToAst(text);
      expect(ast).toStrictEqual(JSON.parse(readFileSync(`${__dirname}/__tests__/${name}.gt.json`).toString()) as Ast);
    });
  }

  for (const {name, text} of examples.find(([group, _examples]) => group === "Goal Tree")![1]) {
    it(`parses example: ${name}`, () => {
      const ast = parseTextToAst(text);
      expect(ast.type).toEqual("goal");
      const semantics = parseGoalTreeSemantics(ast);
      expect({ast, semantics}).toStrictEqual(JSON.parse(readFileSync(`${__dirname}/__tests__/example goal tree: ${name}.json`).toString()) as {ast: Ast, semantics: TreeSemantics});
    });
  }
});

describe("problem tree", () => {
  for (const {name, text} of problemTreeTestcases) {
    it(name, () => {
      const ast = parseTextToAst(text);
      expect(ast).toStrictEqual(JSON.parse(readFileSync(`${__dirname}/__tests__/parses ast for input ${name}.json`).toString()) as Ast);
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