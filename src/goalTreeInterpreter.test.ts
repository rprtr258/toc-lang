import {describe, expect, it} from "bun:test";
import {readFileSync} from "fs";
import {parseTextToAst, parseGoalTreeSemantics} from "./interpreter.ts";
import {examples} from "./examples.ts";
import {Ast} from "./parser.ts";

const testcases = [
  {
    name: "with only goal",
    text: `
    type: goal
    Goal: "win"
    `,
    expected: {
      type: "goal",
      nodes: [
        {
          id: "Goal",
          text: "win",
          params: {},
        },
      ],
      edges: [],
    },
  },
  {
    name: "with CSF and NCs",
    text: `
    type: goal

    Goal: "win"

    weScore: "We score points" { class: CSF }
    theyDont: "Other team doesn't score" { class: CSF }

    possession: "We get the ball"
    shooting: "We shoot the ball accurately"
    defense: "We have good defense"

    theyDont <- defense
    weScore <- possession
    weScore <- shooting
    `,
    expected: {
      type: "goal",
      nodes: [
        {
          id: "Goal",
          text: "win",
          params: {},
        },
        {
          id: "weScore",
          text: "We score points",
          params: {class: "CSF"},
        },
        {
          id: "theyDont",
          text: "Other team doesn't score",
          params: {class: "CSF"},
        },
        {
          id: "possession",
          text: "We get the ball",
          params: {},
        },
        {
          id: "shooting",
          text: "We shoot the ball accurately",
          params: {},
        },
        {
          id: "defense",
          text: "We have good defense",
          params: {},
        },
      ],
      edges: [
        {
          toId: "theyDont",
          fromIds: ["defense"],
        },
        {
          toId: "weScore",
          fromIds: ["possession"],
        },
        {
          toId: "weScore",
          fromIds: ["shooting"],
        },
      ],
    },
  },
  {
    name: "node status",
    text: `
    type: goal
    mynode: "win" {
      status: 50
    }
    `,
    expected: {
      type: "goal",
      nodes: [
        {
          id: "mynode",
          text: "win",
          params: {status: "50"},
        },
      ],
      edges: [],
    },
  },
  {
    name: "single-line comments",
    text: `
    # This is a comment
    type: goal
    `,
    expected: {
      type: "goal",
      nodes: [],
      edges: [],
    },
  },
  {
    name: "with status",
    text: `
    type: goal

    Goal: "win"
    weScore: "We score points" {status: 70}
    `,
    expected: {
      type: "goal",
      nodes: [
        {
          id: "Goal",
          text: "win",
          params: {},
        },
        {
          id: "weScore",
          text: "We score points",
          params: {status: "70"},
        },
      ],
      edges: [],
    },
  },
] as {name: string, text: string, expected: Ast}[];

describe("goal tree interpreter", () => {
  for (const {name, text, expected} of testcases) {
    it(name, () => {
      expect(parseTextToAst(text)).toStrictEqual(expected);
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
