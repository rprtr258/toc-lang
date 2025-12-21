import peggy from "peggy";
import tocLangGrammarUrl from "./assets/grammars/toc-lang.peggy?raw";

const tocLang = peggy.generate(tocLangGrammarUrl);

const parsers = {
  conflict: tocLang,
  goal: tocLang,
  problem: tocLang,
};

export type NodeID = string;

export interface Node {
  id: NodeID,
  label: string,
  statusPercentage?: number,
  annotation?: string,
  intermediate?: boolean,
}

export interface Edge {
  from: NodeID,
  to: NodeID,
}

export interface TreeSemantics {
  rankdir: "LR" | "RL" | "TB" | "BT",
  nodes: Record<NodeID, Node>,
  edges: Edge[],
}

export interface Completions {
  idents: NodeID[],
}

export type EDiagramType = "problem" | "conflict" | "goal";

export interface ParseResult {
  ast: Ast,
  type: EDiagramType,
}

export function parseGoalTreeSemantics(ast: Ast): TreeSemantics {
  const goal = ast.statements.find((s: StatementAst) => s.type === "node" && s.id === "Goal") as StatementAst & {type: "node"} | undefined;

  const nodes = {
    "Goal": {
      id: "Goal",
      annotation: "G",
      label: goal?.text || "",
      ...(goal?.params.status ? {statusPercentage: parseFloat(goal.params.status)} : {}),
    },
    ...Object.fromEntries(ast.statements
      .filter((s): s is StatementAst & { type: "node" } => s.type === "node" && s.id !== "Goal")
      .map((statement) => [statement.id, {
        id: statement.id,
        label: statement.text,
        ...(statement.params.class ? {annotation: statement.params.class} : {}),
        ...(statement.params.status ? {statusPercentage: parseFloat(statement.params.status)} : {}),
      }])),
  } as Record<string, Node>;

  const edges = ast.statements
    .filter((s): s is StatementAst & { type: "edge" } => s.type === "edge")
    .map((statement): Edge => {
      const nodeID = statement.toId;
      if (!nodes[nodeID]) {
        throw new Error(`Node ${nodeID} not found`);
      }
      if (statement.fromIds.length !== 1) {
        throw new Error("Edges must have exactly one 'from' node in a Goal Tree");
      }
      const reqID = statement.fromIds[0];
      if (!nodes[reqID]) {
        throw new Error(`Requirement ${reqID} not found`);
      }
      if (nodeID === "Goal") {
        nodes[reqID].annotation = "CSF";
      }
      return {from: reqID, to: nodeID};
    });

  return {nodes, edges, rankdir: "BT"};
}

function findNodeAnnotation(statement: StatementAst) {
  if (statement.type !== "node")
    return undefined;
  const pattern = /^(UDE|FOL|DE)/i;
  if (typeof statement.params?.class === "string" && statement.params?.class?.match(pattern)) {
    return statement.params.class.match(pattern)![0].toUpperCase();
  }
  return undefined;
}

export function parseProblemTreeSemantics(ast: Ast): TreeSemantics {
  const nodes: Record<NodeID, Node> = Object.fromEntries(ast.statements
    .filter((s): s is StatementAst & { type: "node" } => s.type === "node")
    .map(statement => [statement.id, {
      annotation: findNodeAnnotation(statement),
      id: statement.id,
      label: statement.text,
    }]));

  const edges = ast.statements
    .filter((s): s is StatementAst & { type: "edge" } => s.type === "edge")
    .flatMap((statement): Edge[] => {
      const effectID = statement.toId;
      if (!nodes[effectID]) {
        throw new Error(`Effect ${effectID} not declared`);
      }
      if (statement.fromIds.length === 1) {
        const causeID = statement.fromIds[0];
        if (!nodes[causeID]) {
          throw new Error(`Cause ${causeID} not declared`);
        }
        return [{from: causeID, to: effectID}];
      }

      // Multi-cause: create intermediate AND node
      const intermediateID = statement.fromIds.join("_") + "_cause_" + effectID;
      nodes[intermediateID] = {
        id: intermediateID,
        label: "AND",
        intermediate: true,
      };
      return [
        ...statement.fromIds.map(causeID => {
          if (!nodes[causeID]) {
            throw new Error(`Cause ${causeID} not declared`);
          }
          return {from: causeID, to: intermediateID};
        }),
        {from: intermediateID, to: effectID},
      ];
    });

  return {nodes, edges, rankdir: "BT"};
}

export type RawStatementAst =
  | StatementAst
  | {
      type: "type",
      value: string,
    };

export type StatementAst =
  | {
      type: "edge",
      id?: string,
      text?: string,
      fromIds: string[],
      toId: string,
      biDir?: boolean,
      params?: ParamsAst,
      biDirectional?: true,
    }
  | {
      type: "node",
      id: string,
      text: string,
      params: ParamsAst,
    }
  | {
      type: "comment",
      text: string,
    };

export interface Ast {
  statements: StatementAst[],
}

type ParamsAst = Record<string, string>;

export function parseTextToAst(code: string): ParseResult {
  // Since we don't have the full parsers yet, using a RegEx.
  // This could false match on a comment or something but fine for now.
  const typeMatch = code.match(/\btype:\s*(\w+)\b/);
  if (!typeMatch) {
    throw Error("Type declaration missing");
  }

  const parserType: string = typeMatch[1];
  if (!["problem", "conflict", "goal"].includes(parserType)) {
    throw Error(
      `Invalid type '${parserType}'. Must be one of: problem, conflict, goal`,
    );
  }

  const parserEType = parserType as EDiagramType;
  const parser: peggy.Parser = parsers[parserType];
  const parsedAst = parser.parse(code) as { statements: RawStatementAst[] };
  const statements = parsedAst.statements.filter((s): s is StatementAst => s.type !== "type");
  return {ast: {statements}, type: parserEType};
}
