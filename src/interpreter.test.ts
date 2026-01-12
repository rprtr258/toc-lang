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
    .type: problem
    b: "badness" class=UDE
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
        {fromIds: ["c"], toId: "d", params: {}},
      ],
    };
    const ast = parseTextToAst(text);
    expect(ast).toEqual(expected);
    expect(() => parseProblemTreeSemantics(ast)).toThrowError(/^Effect d not declared$/);
  });

  it("parses AST and semantics for injection example", () => {
    const text = `.type: problem

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

describe("New PIC-like syntax", () => {
  describe("Directives", () => {
    it("parses .type: problem", () => {
      const ast = parseTextToAst(".type: problem");
      expect(ast.type).toStrictEqual("problem");
      expect(ast.nodes).toEqual([]);
      expect(ast.edges).toEqual([]);
    });

    it("parses .type: conflict", () => {
      const ast = parseTextToAst(".type: conflict");
      expect(ast.type).toStrictEqual("conflict");
    });

    it("parses .type: goal", () => {
      const ast = parseTextToAst(".type: goal");
      expect(ast.type).toStrictEqual("goal");
    });
  });

  describe("Node properties", () => {
    it("parses node with class property (no defaults)", () => {
      const ast = parseTextToAst('.type: problem\nbad: "Bad" class=UDE');
      expect(ast.nodes[0].params).toEqual({
        class: "UDE",
      });
    });

    it("parses node with shape property (no defaults)", () => {
      const ast = parseTextToAst('.type: problem\nbad: "Bad" shape=circle');
      expect(ast.nodes[0].params).toEqual({
        shape: "circle",
      });
    });

    it("parses node with color properties (no defaults)", () => {
      const ast = parseTextToAst('.type: problem\nbad: "Bad" border=red fill=yellow');
      expect(ast.nodes[0].params).toEqual({
        border: "red",
        fill: "yellow",
      });
    });

    it("parses node with all properties", () => {
      const ast = parseTextToAst('.type: problem\nbad: "Bad" class=UDE shape=box border=red fill=red');
      expect(ast.nodes[0].params).toEqual({
        class: "UDE",
        shape: "box",
        border: "red",
        fill: "red",
      });
    });

    it("parses node without properties (no defaults)", () => {
      const ast = parseTextToAst('.type: problem\nbad: "Bad"');
      expect(ast.nodes[0].params).toEqual({});
    });
  });

  describe("Edge properties", () => {
    it("parses edge with color", () => {
      const ast = parseTextToAst('.type: problem\nA <- B: "label" color=red');
      expect(ast.edges[0].params).toStrictEqual({color: "red"});
    });

    it("parses multi-cause edge with color", () => {
      const ast = parseTextToAst('.type: problem\nA <- B && C: "combined" color=blue');
      expect(ast.edges[0].params).toStrictEqual({color: "blue"});
    });

    it("parses bidirectional edge with color", () => {
      const ast = parseTextToAst('.type: conflict\nA -- B: "conflict" color=red');
      expect(ast.edges[0].biDirectional).toStrictEqual(true);
      expect(ast.edges[0].params).toStrictEqual({color: "red"});
    });
  });

  describe("Problem tree semantics", () => {
    it("applies UDE annotation from class property", () => {
      const ast = parseTextToAst('.type: problem\nbad: "Bad" class=UDE');
      const semantics = parseProblemTreeSemantics(ast);
      expect(semantics.nodes.bad.annotation).toStrictEqual("UDE");
    });

    it("handles multi-cause with new syntax", () => {
      const ast = parseTextToAst('.type: problem\nbad: "Bad" class=UDE\nux: "UX"\nfeatures: "Features"\nbad <- ux && features');
      const semantics = parseProblemTreeSemantics(ast);
      expect(semantics.nodes).toContainKey("ux|features|cause|bad");
      expect(semantics.nodes["ux|features|cause|bad"].label).toStrictEqual("AND");
    });
  });

  describe("Goal tree semantics", () => {
    it("applies CSF annotation from class property", () => {
      const ast = parseTextToAst('.type: goal\nGoal: "Goal"\nrev: "Revenue" class=CSF\nGoal <- rev');
      const semantics = parseGoalTreeSemantics(ast);
      expect(semantics.nodes.rev.annotation).toStrictEqual("CSF");
    });

    it("handles status property", () => {
      const ast = parseTextToAst('.type: goal\nGoal: "Goal"\nrev: "Revenue" status=50');
      const semantics = parseGoalTreeSemantics(ast);
      expect(semantics.nodes.rev.statusPercentage).toStrictEqual(50);
    });
  });

  describe("Visual styling properties", () => {
    it("problem tree passes shape to semantics", () => {
      const ast = parseTextToAst('.type: problem\nbad: "Bad" class=UDE shape=circle');
      const semantics = parseProblemTreeSemantics(ast);
      expect(semantics.nodes.bad.shape).toStrictEqual("circle");
    });

    it("problem tree passes fill to semantics", () => {
      const ast = parseTextToAst('.type: problem\nbad: "Bad" class=UDE fill=red');
      const semantics = parseProblemTreeSemantics(ast);
      expect(semantics.nodes.bad.fill).toStrictEqual("red");
    });

    it("problem tree passes border to semantics", () => {
      const ast = parseTextToAst('.type: problem\nbad: "Bad" class=UDE border=blue');
      const semantics = parseProblemTreeSemantics(ast);
      expect(semantics.nodes.bad.border).toStrictEqual("blue");
    });

    it("problem tree passes edge color to semantics", () => {
      const ast = parseTextToAst('.type: problem\nbad: "Bad"\ncause: "Cause"\nbad <- cause: "causes" color=red');
      const semantics = parseProblemTreeSemantics(ast);
      expect(semantics.edges[0].color).toStrictEqual("red");
    });

    it("goal tree passes styling properties to semantics", () => {
      const ast = parseTextToAst('.type: goal\nGoal: "Goal"\nrev: "Revenue" class=CSF shape=box fill=green border=green');
      const semantics = parseGoalTreeSemantics(ast);
      expect(semantics.nodes.rev.shape).toStrictEqual("box");
      expect(semantics.nodes.rev.fill).toStrictEqual("green");
      expect(semantics.nodes.rev.border).toStrictEqual("green");
    });

    it("goal tree passes edge color to semantics", () => {
      const ast = parseTextToAst('.type: goal\nGoal: "Goal"\nrev: "Revenue"\nGoal <- rev: "achieved" color=green');
      const semantics = parseGoalTreeSemantics(ast);
      expect(semantics.edges[0].color).toStrictEqual("green");
    });

    it("no defaults in semantics when using styling properties", () => {
      const ast = parseTextToAst('.type: problem\nbad: "Bad" shape=circle');
      const semantics = parseProblemTreeSemantics(ast);
      // Parser doesn't add defaults, so only shape is in semantics
      expect(semantics.nodes.bad.shape).toStrictEqual("circle");
      expect(semantics.nodes.bad.fill).toStrictEqual("white");
      expect(semantics.nodes.bad.border).toStrictEqual("black");
    });
  });
});

describe("Invalid color handling", () => {
  it("invalid fill color throws", () => {
    const ast = parseTextToAst('.type: problem\nbad: "Bad" fill=r');
    expect(() => parseProblemTreeSemantics(ast)).toThrow(/^Invalid color: r$/);
  });

  it("invalid border color throws", () => {
    const ast = parseTextToAst('.type: problem\nbad: "Bad" border=xyz');
    expect(() => parseProblemTreeSemantics(ast)).toThrow(/^Invalid color: xyz$/);
  });

  it("invalid shape throws", () => {
    const ast = parseTextToAst('.type: problem\nbad: "Bad" shape=triangle');
    expect(() => parseProblemTreeSemantics(ast)).toThrow(/^Invalid shape: triangle$/);
  });

  it("invalid edge color throws", () => {
    const ast = parseTextToAst('.type: problem\nbad: "Bad"\ncause: "Cause"\nbad <- cause: "causes" color=invalid');
    expect(() => parseProblemTreeSemantics(ast)).toThrow(/^Invalid color: invalid$/);
  });

  it("valid colors are preserved", () => {
    const ast = parseTextToAst('.type: problem\nbad: "Bad" fill=red border=blue');
    const semantics = parseProblemTreeSemantics(ast);
    expect(semantics.nodes.bad.fill).toBe("red");
    expect(semantics.nodes.bad.border).toBe("blue");
  });

  it("valid shapes are preserved", () => {
    const ast = parseTextToAst('.type: problem\nbad: "Bad" shape=circle');
    const semantics = parseProblemTreeSemantics(ast);
    expect(semantics.nodes.bad.shape).toBe("circle");
  });

  it("case insensitive color names", () => {
    const ast = parseTextToAst('.type: problem\nbad: "Bad" fill=RED border=Blue');
    expect(() => parseProblemTreeSemantics(ast)).toThrow(/^Invalid color: RED$/);
  });

  it("case insensitive color names 2", () => {
    const ast = parseTextToAst('.type: problem\nbad: "Bad" fill=red border=Blue');
    expect(() => parseProblemTreeSemantics(ast)).toThrow(/^Invalid color: Blue$/);
  });

  it("class alone does not trigger styling", () => {
    const ast = parseTextToAst('.type: problem\nbad: "Bad" class=UDE');
    const semantics = parseProblemTreeSemantics(ast);
    expect(semantics.nodes.bad.shape).toBe("box");
    expect(semantics.nodes.bad.fill).toBe("white");
    expect(semantics.nodes.bad.border).toBe("black");
    expect(semantics.nodes.bad.annotation).toBe("UDE");
  });

  it("fill alone does not trigger shape defaults", () => {
    const ast = parseTextToAst('.type: problem\nbad: "Bad" fill=red');
    const semantics = parseProblemTreeSemantics(ast);
    expect(semantics.nodes.bad.shape).toBe("box");
    expect(semantics.nodes.bad.fill).toBe("red");
    expect(semantics.nodes.bad.border).toBe("black");
  });
});
