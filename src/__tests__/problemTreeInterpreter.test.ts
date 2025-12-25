import {describe, expect, it} from "bun:test";
import * as approvals from "approvals";
import {parseTextToAst, parseProblemTreeSemantics} from "../interpreter.ts";
import {exampleProblemTreeText} from "../examples.ts";
import {Ast} from "../parser.ts";

const testCases = [
  {
    name: "with only UDE",
    text: `b: "badness" {class: UDE}`,
  },
  {
    name: "with UDE and single cause",
    text: `
    b: "badness" {class: UDE}
    c: "cause"
    b <- c
    `,
  },
  {
    name: "with UDE and multi-cause",
    text: `
    b: "badness" {class: UDE}
    c1: "cause 1"
    c2: "cause 2"
    b <- c1 && c2
    `,
  },
  {
    name: "with multi-cause right arrow",
    text: `
    b: "badness"
    c1: "cause 1"
    c2: "cause 2"
    c1 && c2 -> b
    `,
  },
  {
    name: "single-line comments",
    text: `
    # This is a comment
    `,
  },
  {
    name: "single cause right arrow",
    text: `
    b: "badness"
    c: "cause"
    c -> b
    `,
  },
  {
    name: "empty text",
    text: "",
  },
];

describe("problem tree interpreter", () => {
  testCases.forEach((testCase) => {
    it(testCase.name, () => {
      const typeLine = `type: problem\n`;
      const ast = parseTextToAst(typeLine + testCase.text);
      approvals.verifyAsJSON(__dirname, "parses ast for input " + testCase.name, ast, {});
    });
  });

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

  it("example parses", () => {
    const text = exampleProblemTreeText;
    const ast = parseTextToAst(text);
    expect(ast.type).toEqual("problem");
    const semantics = parseProblemTreeSemantics(ast);
    approvals.verifyAsJSON(__dirname, "example problem tree", {ast, semantics}, {});
  });
});
