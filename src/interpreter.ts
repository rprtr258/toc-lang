import {Ast, AstNode, parse} from "./parser.ts";

export type NodeID = string;

export interface Node {
  id: NodeID,
  label: string,
  statusPercentage?: number,
  annotation?: string,
  intermediate?: true,
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

  const nodes = {
    "Goal": {
      id: "Goal",
      annotation: "G",
      label: goal?.text ?? "",
      ...(s => s !== undefined ? {statusPercentage: parseFloat(s)} : {})(goal?.params.status),
    },
    ...Object.fromEntries(ast.nodes
      .filter(s => s.id !== "Goal")
      .map(statement => [statement.id, {
        id: statement.id,
        label: statement.text,
        ...(c => c !== undefined ? {annotation: c} : {})(statement.params.class),
        ...(s => s !== undefined ? {statusPercentage: parseFloat(s)} : {})(statement.params.status),
      }])),
  } as Record<string, Node>;

  const edges = ast.edges.map((statement): Edge => {
    const nodeID = statement.toId;
    if (nodes[nodeID] === undefined)
      throw new Error(`Node ${nodeID} not found`);

    if (statement.fromIds.length !== 1) {
      throw new Error("Edges must have exactly one 'from' node in a Goal Tree");
    }
    const reqID = statement.fromIds[0];
    if (nodes[reqID] === undefined)
      throw new Error(`Requirement ${reqID} not found`);

    if (nodeID === "Goal") {
      nodes[reqID].annotation = "CSF";
    }
    return {
      from: reqID,
      to: nodeID,
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

  return sorted.filter(id => nodeMap.has(id)).map(id => nodeMap.get(id)!);
}

export function parseProblemTreeSemantics(ast: Ast): TreeSemantics {
  ast = sortAst(ast);

  const nodes: Record<NodeID, Node> = Object.fromEntries(ast.nodes.map(node => [node.id, {
    id: node.id,
    label: node.text,
    ...(a => a !== undefined ? {annotation: a} : {})(findNodeAnnotation(node)),
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
      };
      return [newEdge];
    }

    // Multi-cause: create intermediate AND node
    const intermediateID = edge.fromIds.join("|") + "|cause|" + effectID;
    nodes[intermediateID] = {
      id: intermediateID,
      label: "AND",
      intermediate: true,
    };
    return [
      ...edge.fromIds.map(causeID => {
        if (nodes[causeID] === undefined)
          throw new Error(`Cause ${causeID} not declared`);

        return {
          from: causeID,
          to: intermediateID,
        };
      }),
      {
        from: intermediateID,
        to: effectID,
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
