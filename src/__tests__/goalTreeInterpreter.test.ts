import {describe, expect, it} from "bun:test";
import {parseTextToAst, parseGoalTreeSemantics, TreeSemantics} from "../interpreter.ts";
import {exampleGoalTreeText} from "../examples.ts";
import {Ast} from "../parser.ts";

const testcases = [
  {
    name: "with only goal",
    text: `
    type: goal
    Goal: "win"
    `,
    expected: {
      statements: [
        {
          text: "win",
          type: "node",
          id: "Goal",
          params: {},
        },
      ],
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
      statements: [
        {
          id: "Goal",
          text: "win",
          type: "node",
          params: {},
        },
        {
          id: "weScore",
          text: "We score points",
          type: "node",
          params: {class: "CSF"},
        },
        {
          id: "theyDont",
          text: "Other team doesn't score",
          type: "node",
          params: {class: "CSF"},
        },
        {
          id: "possession",
          text: "We get the ball",
          type: "node",
          params: {},
        },
        {
          id: "shooting",
          text: "We shoot the ball accurately",
          type: "node",
          params: {},
        },
        {
          id: "defense",
          text: "We have good defense",
          type: "node",
          params: {},
        },
        {
          toId: "theyDont",
          fromIds: ["defense"],
          type: "edge",
          text: undefined,
        },
        {
          toId: "weScore",
          fromIds: ["possession"],
          type: "edge",
          text: undefined,
        },
        {
          toId: "weScore",
          fromIds: ["shooting"],
          type: "edge",
          text: undefined,
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
      statements: [
        {
          text: "win",
          type: "node",
          id: "mynode",
          params: {status: "50"},
        },
      ],
    },
  },
  {
    name: "single-line comments",
    text: `
    # This is a comment
    type: goal
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
    name: "with status",
    text: `
    type: goal

    Goal: "win"
    weScore: "We score points" {status: 70}
    `,
    expected: {
      statements: [
        {
          id: "Goal",
          text: "win",
          type: "node",
          params: {},
        },
        {
          id: "weScore",
          text: "We score points",
          type: "node",
          params: {status: "70"},
        },
      ],
    },
  },
] as {name: string, text: string, expected: Ast}[];

describe("goal tree interpreter", () => {
  for (const {name, text, expected} of testcases) {
    it(name, () => {
      expect(parseTextToAst(text).ast).toStrictEqual(expected);
    });
  }

  it("parses example", () => {
    const text = exampleGoalTreeText;
    const {ast} = parseTextToAst(text);
    expect(ast).not.toBeNull();
    const semTree = parseGoalTreeSemantics(ast);
    const expectedSemTree: TreeSemantics = {
      edges: [
        {
          from: "revUp",
          to: "Goal",
        },
        {
          from: "costsDown",
          to: "Goal",
        },
        {
          from: "features",
          to: "newCust",
        },
        {
          from: "retain",
          to: "features",
        },
        {
          from: "newCust",
          to: "revUp",
        },
        {
          from: "keepCust",
          to: "revUp",
        },
        {
          from: "reduceInfra",
          to: "costsDown",
        },
        {
          from: "marketSalary",
          to: "retain",
        },
        {
          from: "morale",
          to: "retain",
        },
      ],
      nodes: {
        Goal: {
          id: "Goal",
          label: "Make money now and in the future",
          annotation: "G",
        },
        revUp: {
          id: "revUp",
          label: "Generate more revenue",
          annotation: "CSF",
        },
        costsDown: {
          id: "costsDown",
          label: "Control costs",
          annotation: "CSF",
        },
        keepCust: {
          id: "keepCust",
          label: "Protect relationship with existing customers",
        },
        newCust: {
          id: "newCust",
          label: "Acquire new customers",
        },
        reduceInfra: {
          id: "reduceInfra",
          label: "Reduce infrastructure spending",
        },
        retain: {
          id: "retain",
          label: "Retain employees",
        },
        marketSalary: {
          id: "marketSalary",
          label: "Keep up with market salaries",
        },
        morale: {
          id: "morale",
          label: "Maintain employee morale",
        },
        features: {
          id: "features",
          label: "Develop new features",
        },
      },
      rankdir: "BT",
    };
    expect(semTree).toStrictEqual(expectedSemTree);
  });
});
