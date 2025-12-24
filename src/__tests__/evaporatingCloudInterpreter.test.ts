import {describe, expect, it} from "bun:test";
import {parseTextToAst} from "../interpreter.ts";
import {exampleEvaporatingCloudText} from "../examples.ts";
import {Ast} from "../parser.ts";

const testcases = [
  {
    name: "only type line parses to empty",
    text: "type: conflict",
    expected: {
      statements: [],
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
      statements: [
        {
          id: "A",
          text: "Maximize business performance",
          type: "node",
          params: {},
        },
        {
          id: "B",
          text: "Subordinate all decisions to the financial goal",
          type: "node",
          params: {},
        },
        {
          id: "C",
          text: "Ensure people are in a state of optimal performance",
          type: "node",
          params: {},
        },
        {
          id: "D",
          text: "Subordinate people's needs to the financial goal",
          type: "node",
          params: {},
        },
        {
          id: "E",
          text: "Attend to people's needs (& let people work)",
          type: "node",
          params: {},
        },
      ],
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
      statements: [
        {
          id: "A",
          text: "Maximize business performance {",
          type: "node",
          params: {},
        },
        {
          id: "B",
          text: "Subordinate all decisions to the financial goal",
          type: "node",
          params: {},
        },
        {
          id: "C",
          text: "Ensure people are in a state of optimal performance",
          type: "node",
          params: {},
        },
        {
          id: "D",
          text: "Subordinate people's needs to the financial goal",
          type: "node",
          params: {},
        },
        {
          id: "E",
          text: "Attend to people's needs (& let people work)",
          type: "node",
          params: {},
        },
      ],
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
      statements: [
        {
          id: "A",
          text: "Maximize business performance",
          type: "node",
          params: {},
        },
        {
          id: "D",
          text: "Subordinate people's needs to the financial goal",
          type: "node",
          params: {},
        },
        {
          fromIds: ["D"],
          toId: "A",
          text: "inject Psychological flow triggers",
          type: "edge",
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
      statements: [
        {
          type: "edge",
          text: "Discover they don't conflict",
          fromIds: ["D"],
          toId: "E",
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
      statements: [
        {
          type: "edge",
          text: "Discover they don't conflict",
          fromIds: ["D"],
          toId: "E",
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
      statements: [
        {
          text: " This is a comment",
          type: "comment",
        },
      ],
    },
  },
  {
    name: "unusual characters in annotation",
    text: `
type: conflict
A: "*watafa* pepe"
`,
    expected: {
      statements: [
        {
          type: "node",
          id: "A",
          text: "*watafa* pepe",
          params: {},
        },
      ],
    },
  },
] as {name: string, text: string, expected: Ast}[];

describe("evaporating cloud tree interpreter", () => {
  for (const {name, text, expected} of testcases) {
    it(name, () => {
      expect(parseTextToAst(text).ast).toStrictEqual(expected);
    });
  }

  it("parses example", () => {
    const text = exampleEvaporatingCloudText;
    expect(parseTextToAst(text).ast).not.toBeNull();
  });

  it("empty text throws type missing", () => {
    const text = "";
    expect(() => parseTextToAst(text)).toThrow("Type declaration missing");
  });
});
