import {describe, expect, it} from "bun:test";
import {Ast} from "./parser.ts";
import {parseTextToAst, parseGoalTreeSemantics, parseProblemTreeSemantics} from "./interpreter.ts";
import {examples} from "./examples.ts";
import {evaporatingCloudTestcases, goalTreeTestcases, problemTreeTestcases} from "./testcases.ts";

describe("evaporating cloud", () => {
  for (const {name, text} of evaporatingCloudTestcases) {
    it(name, () => {
      const ast = parseTextToAst(text);
      expect(JSON.stringify(ast, null, 2)).toMatchSnapshot();
    });
  }

  for (const {name, text} of examples.find(([group, _examples]) => group === "Evaporating Cloud")![1]) {
    it(`parses example: ${name}`, () => {
      const ast = parseTextToAst(text);
      expect(JSON.stringify(ast, null, 2)).toMatchSnapshot();
    });
  }
});

describe("goal tree", () => {
  for (const {name, text} of goalTreeTestcases) {
    it(name, () => {
      const ast = parseTextToAst(text);
      expect(JSON.stringify(ast, null, 2)).toMatchSnapshot();
    });
  }

  for (const {name, text} of examples.find(([group, _examples]) => group === "Goal Tree")![1]) {
    it(`parses example: ${name}`, () => {
      const ast = parseTextToAst(text);
      expect(ast.type).toEqual("goal");
      const semantics = parseGoalTreeSemantics(ast);
      expect(JSON.stringify({ast, semantics}, null, 2)).toMatchSnapshot();
    });
  }
});

describe("problem tree", () => {
  for (const {name, text} of problemTreeTestcases) {
    it(name, () => {
      const ast = parseTextToAst(text);
      expect(JSON.stringify(ast, null, 2)).toMatchSnapshot();
    });
  }

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

  it("parses AST and semantics for injection example", () => {
    const text = `type: problem

x: "X"
y: "Y"
cause_cause: "cause_cause"
y <- x && cause_cause

cause_y: "cause_y"
cause: "cause"
cause_y <- x && cause`;
    const ast = parseTextToAst(text);
    expect(ast.type).toEqual("problem");
    const semantics = parseProblemTreeSemantics(ast);
    expect(JSON.stringify({ast, semantics}, null, 2)).toMatchSnapshot();
  });

  for (const {name, text} of examples.find(([group, _examples]) => group === "Current Reality Tree")![1]) {
    it(`parses example: ${name}`, () => {
      const ast = parseTextToAst(text);
      expect(ast.type).toEqual("problem");
      const semantics = parseProblemTreeSemantics(ast);
      expect(JSON.stringify({ast, semantics}, null, 2)).toMatchSnapshot();
    });
  }
});
