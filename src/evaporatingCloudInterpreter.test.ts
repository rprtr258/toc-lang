import {describe, expect, it} from "bun:test";
import {readFileSync} from "fs";
import {parseTextToAst} from "./interpreter.ts";
import {examples} from "./examples.ts";
import {Ast} from "./parser.ts";

const testcases = [
  {
    name: "only type line parses to empty",
    text: "type: conflict",
    expected: {
      type: "conflict",
      nodes: [],
      edges: [],
    },
  },
  {
    name: "with only labels",
    text: `
type: conflict
A: "Maximize business performance"
B: "Subordinate all decisions to the financial goal"
C: "Ensure people are in a state of optimal performance"
D: "Subordinate people's needs to the financial goal"
E: "Attend to people's needs (& let people work)"
`,
    expected: {
      type: "conflict",
      nodes: [
        {
          id: "A",
          text: "Maximize business performance",
          params: {},
        },
        {
          id: "B",
          text: "Subordinate all decisions to the financial goal",
          params: {},
        },
        {
          id: "C",
          text: "Ensure people are in a state of optimal performance",
          params: {},
        },
        {
          id: "D",
          text: "Subordinate people's needs to the financial goal",
          params: {},
        },
        {
          id: "E",
          text: "Attend to people's needs (& let people work)",
          params: {},
        },
      ],
      edges: [],
    },
  },
  {
    name: "with only labels, quoted",
    text: `
type: conflict
A: "Maximize business performance {"
B: "Subordinate all decisions to the financial goal"
C: "Ensure people are in a state of optimal performance"
D: "Subordinate people's needs to the financial goal"
E: "Attend to people's needs (& let people work)"
`,
    expected: {
      type: "conflict",
      nodes: [
        {
          id: "A",
          text: "Maximize business performance {",
          params: {},
        },
        {
          id: "B",
          text: "Subordinate all decisions to the financial goal",
          params: {},
        },
        {
          id: "C",
          text: "Ensure people are in a state of optimal performance",
          params: {},
        },
        {
          id: "D",
          text: "Subordinate people's needs to the financial goal",
          params: {},
        },
        {
          id: "E",
          text: "Attend to people's needs (& let people work)",
          params: {},
        },
      ],
      edges: [],
    },
  },
  {
    name: "with injection on requirement",
    text: `
type: conflict
A: "Maximize business performance"
D: "Subordinate people's needs to the financial goal"
A <- D: "inject Psychological flow triggers"
`,
    expected: {
      type: "conflict",
      nodes: [
        {
          id: "A",
          text: "Maximize business performance",
          params: {},
        },
        {
          id: "D",
          text: "Subordinate people's needs to the financial goal",
          params: {},
        },
      ],
      edges: [
        {
          fromIds: ["D"],
          toId: "A",
          text: "inject Psychological flow triggers",
        },
      ],
    },
  },
  {
    name: "with injection on conflict",
    text: `
type: conflict
D -> E: "Discover they don't conflict"
`,
    expected: {
      type: "conflict",
      nodes: [],
      edges: [
        {
          fromIds: ["D"],
          toId: "E",
          text: "Discover they don't conflict",
        },
      ],
    },
  },
  {
    name: "can inject with bidirectional edge",
    text: `
type: conflict
D -- E: "Discover they don't conflict"
`,
    expected: {
      type: "conflict",
      nodes: [],
      edges: [
        {
          fromIds: ["D"],
          toId: "E",
          text: "Discover they don't conflict",
          biDirectional: true,
        },
      ],
    },
  },
  {
    name: "single-line comments",
    text: `
# This is a comment
type: conflict
`,
    expected: {
      type: "conflict",
      nodes: [],
      edges: [],
    },
  },
  {
    name: "unusual characters in annotation",
    text: `
type: conflict
A: "*watafa* pepe"
`,
    expected: {
      type: "conflict",
      nodes: [
        {
          id: "A",
          text: "*watafa* pepe",
          params: {},
        },
      ],
      edges: [],
    },
  },
] as {name: string, text: string, expected: Ast}[];

describe("evaporating cloud tree interpreter", () => {
  for (const {name, text, expected} of testcases) {
    it(name, () => {
      expect(parseTextToAst(text)).toStrictEqual(expected);
    });
  }

  for (const {name, text} of examples.find(([group, _examples]) => group === "Evaporating Cloud")![1]) {
    it(`parses example: ${name}`, () => {
      const ast = parseTextToAst(text);
      expect(ast).toStrictEqual(JSON.parse(readFileSync(`${__dirname}/__tests__/example evaporating cloud: ${name}.approved.txt`).toString()));
    });
  }
});
