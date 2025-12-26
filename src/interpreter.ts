import {Ast, AstNode, parse} from "./parser.ts";

export type NodeID = string;

export const COLORS = {
  black: "#000000",
  white: "#ffffff",
  red: "#ffb2b2",
  green: "#95f795",
  blue: "#dff8ff",
  yellow: "#fdfdbe",
} as const;

export type Color = keyof typeof COLORS;
export function parseColor(color: string | undefined, defaultColor: Color): Color {
  if (color === undefined)
    return defaultColor;
  if ((COLORS as unknown as Record<string, Color>)[color] !== undefined || color.match(/^#[0-9a-f]{6}$/i))
    return color as Color;
  throw new Error(`Invalid color: ${color}`);
}

export const VALID_SHAPES = ["box", "circle", "diamond"] as const;
type Shape = typeof VALID_SHAPES[number];

function isShape(shape: string): shape is Shape {
  return (VALID_SHAPES as readonly string[]).includes(shape);
}

function parseShape(shape?: string): Shape {
  if (shape === undefined)
    return "box";
  if (isShape(shape))
    return shape;
  throw new Error(`Invalid shape: ${shape}`);
}

export interface Node {
  id: NodeID,
  label: string,
  statusPercentage?: number,
  annotation?: string,
  intermediate?: true,
  shape: Shape,
  fill: Color,
  border: Color,
}

export interface Edge {
  from: NodeID,
  to: NodeID,
  color: Color,
}

export interface TreeSemantics {
  rankdir: "LR" | "RL" | "TB" | "BT",
  nodes: Record<NodeID, Node>,
  edges: Edge[],
}

export type Completion = {
  id: string,
  text: string,
};

function sortAst(ast: Ast): Ast {
  const orderedNodes = topologicalSort(ast);
  const rank = new Map(orderedNodes.map((n, i) => [n.id, i]));
  return {
    type: ast.type,
    nodes: orderedNodes,
    edges: ast.edges.toSorted((a, b) => {
      if (a.fromIds.length !== b.fromIds.length) {
        return a.fromIds.length - b.fromIds.length;
      }
      return rank.get(a.toId)! - rank.get(b.toId)!;
    }),
  };
}

export function parseGoalTreeSemantics(ast: Ast): TreeSemantics {
  ast = sortAst(ast);

  const goal = ast.nodes.find((s: AstNode) => s.id === "Goal");
  const goalNode: Node = {
    id: "Goal",
    annotation: "G",
    label: goal?.text ?? "",
    shape: parseShape(goal?.params.shape),
    fill: parseColor(goal?.params.fill, "white"),
    border: parseColor(goal?.params.border, "black"),
  };
  if (goal?.params.status !== undefined) {
    goalNode.statusPercentage = parseFloat(goal.params.status);
  }

  const nodes: Record<string, Node> = {
    Goal: goalNode,
    ...Object.fromEntries(ast.nodes
      .filter(s => s.id !== "Goal")
      .map(statement => [statement.id, {
        id: statement.id,
        label: statement.text,
        ...(c => c !== undefined ? {annotation: c} : {})(statement.params.class),
        ...(s => s !== undefined ? {statusPercentage: parseFloat(s)} : {})(statement.params.status),
        shape: parseShape(statement.params.shape),
        fill: parseColor(statement.params.fill, "white"),
        border: parseColor(statement.params.border, "black"),
      }])),
  };

  const edges = ast.edges.map((statement): Edge => {
    const nodeID = statement.toId;
    if (nodes[nodeID] === undefined)
      throw new Error(`Node ${nodeID} not found`);
    if (statement.fromIds.length !== 1)
      throw new Error("Edges must have exactly one 'from' node in a Goal Tree");

    const reqID = statement.fromIds[0];
    if (nodes[reqID] === undefined)
      throw new Error(`Requirement ${reqID} not found`);

    if (nodeID === "Goal") {
      nodes[reqID].annotation = "CSF";
    }
    return {
      from: reqID,
      to: nodeID,
      color: parseColor(statement.params.color, "black"),
    };
  });

  return {nodes, edges, rankdir: "BT"};
}

function findNodeAnnotation(statement: AstNode): string | undefined {
  const pattern = /^(UDE|FOL|DE)/i;
  if (typeof statement.params?.class === "string" && statement.params?.class?.match(pattern)) {
    return statement.params.class.match(pattern)![0].toUpperCase();
  }
  return undefined;
}

function topologicalSort({nodes, edges}: Ast): AstNode[] {
  const graph = new Map<NodeID, NodeID[]>();
  for (const node of nodes)
    graph.set(node.id, []);
  for (const edge of edges)
    for (const fromId of edge.fromIds)
      graph.get(fromId)!.push(edge.toId);

  const nodeMap = new Map(nodes.map(node => [node.id, node]));

  const visited = new Set<NodeID>();
  const sorted: NodeID[] = [];
  function dfs(id: NodeID): void {
    if (visited.has(id)) return;
    visited.add(id);
    for (const toId of graph.get(id) ?? [])
      dfs(toId);
    sorted.push(id);
  }
  for (const node of nodes)
    dfs(node.id);

  return sorted.filter(id => nodeMap.has(id)).map((id) => nodeMap.get(id)!);
}

export function parseProblemTreeSemantics(ast: Ast): TreeSemantics {
  ast = sortAst(ast);

  const nodes: Record<NodeID, Node> = Object.fromEntries(ast.nodes.map(node => [node.id, {
    id: node.id,
    label: node.text,
    ...(a => a !== undefined ? {annotation: a} : {})(findNodeAnnotation(node)),
    shape: parseShape(node.params.shape),
    fill: parseColor(node.params.fill, "white"),
    border: parseColor(node.params.border, "black"),
  }]));

  const edges = ast.edges.flatMap((edge): Edge[] => {
    const effectID = edge.toId;
    if (nodes[effectID] === undefined)
      throw new Error(`Effect ${effectID} not declared`);

    if (edge.fromIds.length === 1) {
      const causeID = edge.fromIds[0];
      if (nodes[causeID] === undefined)
        throw new Error(`Cause ${causeID} not declared`);

      const newEdge: Edge = {
        from: causeID,
        to: effectID,
        color: parseColor(edge.params.color, "black"),
      };
      return [newEdge];
    }

    // Multi-cause: create intermediate AND node
    const intermediateID = edge.fromIds.join("|") + "|cause|" + effectID;
    nodes[intermediateID] = {
      id: intermediateID,
      label: "AND",
      intermediate: true,
      shape: "circle",
      fill: "white",
      border: "black",
    };

    return [
      ...edge.fromIds.map(causeID => {
        if (nodes[causeID] === undefined)
          throw new Error(`Cause ${causeID} not declared`);

        return {
          from: causeID,
          to: intermediateID,
          color: parseColor(edge.params.color, "black"),
        };
      }),
      {
        from: intermediateID,
        to: effectID,
        color: parseColor(edge.params.color, "black"),
      },
    ];
  });

  return {nodes, edges, rankdir: "BT"};
}

export function parseTextToAst(code: string): Ast {
  return parse(code);
}

export const cloudDefaultLabels = {
  A: "Objective",
  B: "Requirement 1",
  C: "Prerequisite 1",
  D: "Requirement 2",
  E: "Prerequisite 2",
};
