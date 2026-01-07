<script setup lang="ts">
import {computed} from "vue";
import {plus, mid, bottomCenter, topCenter, rect, xy, intermediatePoint, Edge} from "./math.ts";
import CloudNode from "./CloudNode.vue";
import Injection from "./Injection.vue";
import {Ast} from "./parser.ts";
import {cloudDefaultLabels, Color, parseColor} from "./interpreter.ts";

const props = defineProps<{
  ast: Ast,
}>();
const ast = computed(() => props.ast);

type NodeLabels = {
  A: string,
  B: string,
  C: string,
  D: string,
  E: string,
};
const nodeLabels = computed<NodeLabels>(() => ({
  ...cloudDefaultLabels,
  ...Object.fromEntries(ast.value.nodes.map(node => [node.id, node.text])),
}) as NodeLabels);

const nodeParams = computed<Record<string, Record<string, string>>>(() =>
  Object.fromEntries(ast.value.nodes.map(node => [node.id, node.params])),
);

const injections = computed<Record<string, string>>(() => Object.fromEntries(ast.value.edges.map(edge => {
  const id1 = edge.fromIds[0];
  const id2 = edge.toId;
  const edgeName = id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
  return [edgeName, edge.text!];
})));

function createEdge(
  startNode: rect,
  endNode: rect,
): Edge & {adjStart: xy} {
  const start: xy = {
    x: startNode.x + startNode.w,
    y: startNode.y + startNode.h / 2,
  };
  const end: xy = {
    x: endNode.x,
    y: endNode.y + endNode.h / 2,
  };
  return {start, adjStart: intermediatePoint(start, end, 16), end};
}

const edgeColors = computed<Record<string, Color>>(() => Object.fromEntries(ast.value.edges.map(edge => {
  const id1 = edge.fromIds[0];
  const id2 = edge.toId;
  const edgeName = id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
  return [edgeName, parseColor(edge.params.color, "black")];
})));

const x1 = 25;
const x2 = 250;
const x3 = 500;
const y1 = 50;
const y3 = 300;
const y2 = (y1 + y3) / 2;
const nodeWidth = 150;
const nodeHeight = 75;
const nodeA: rect = {x: x1, y: y2, w: nodeWidth, h: nodeHeight};
const nodeB: rect = {x: x2, y: y1, w: nodeWidth, h: nodeHeight};
const nodeC: rect = {x: x2, y: y3, w: nodeWidth, h: nodeHeight};
const nodeD: rect = {x: x3, y: y1, w: nodeWidth, h: nodeHeight};
const nodeE: rect = {x: x3, y: y3, w: nodeWidth, h: nodeHeight};
const edgeAB = createEdge(nodeA, nodeB);
const edgeAC = createEdge(nodeA, nodeC);
const edgeBD = createEdge(nodeB, nodeD);
const edgeCE = createEdge(nodeC, nodeE);
const conflictStart = bottomCenter(nodeD);
const conflictEnd = topCenter(nodeE);
const conflictMid = mid(conflictStart, conflictEnd);
const conflictEdgePoints = [
  conflictStart,
  plus(conflictMid, {x: -15, y: 5}),
  plus(conflictMid, {x: 15, y: -5}),
  conflictEnd,
];
const edgeDE = {
  start: conflictEdgePoints[0],
  end: conflictEdgePoints[3],
};
const conflictEdgePointsString = conflictEdgePoints.map(p => `${p.x},${p.y}`).join(" ");
</script>

<template>
  <g>
    <defs>
      <marker
        id="arrowhead"
        markerWidth="10"
        markerHeight="7"
        refX="0"
        refY="1.75"
        orient="auto"
      >
        <polygon points="0 0, 10 3.5, 0 7" transform="scale(0.5 0.5)" />
      </marker>
      <marker
        id="startarrow"
        markerWidth="10"
        markerHeight="7"
        refX="5"
        refY="1.75"
        orient="auto"
      >
        <polygon
          points="10 0, 10 7, 0 3.5"
          fill=""
          transform="scale(0.5 0.5)"
        />
      </marker>
      <marker
        id="endarrow"
        markerWidth="10"
        markerHeight="7"
        refX="0"
        refY="1.75"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <polygon
          points="0 0, 10 3.5, 0 7"
          fill=""
          transform="scale(0.5 0.5)"
        />
      </marker>
    </defs>
    <CloudNode
      v-for="[annotation, text, node, params] in [
        ['A', nodeLabels.A, nodeA, nodeParams.A],
        ['B', nodeLabels.B, nodeB, nodeParams.B],
        ['C', nodeLabels.C, nodeC, nodeParams.C],
        ['D', nodeLabels.D, nodeD, nodeParams.D],
        ['E', nodeLabels.E, nodeE, nodeParams.E],
      ] as const"
      :key="annotation"
      :annotation="annotation"
      :text="text"
      :x="node.x"
      :y="node.y"
      :width="nodeWidth"
      :height="nodeHeight"
      :params="params"
    />
    <line
      v-for="([edge, color], i) in [
        [edgeAB, edgeColors['A-B'] ?? 'black'],
        [edgeAC, edgeColors['A-C'] ?? 'black'],
        [edgeBD, edgeColors['B-D'] ?? 'black'],
        [edgeCE, edgeColors['C-D'] ?? 'black'],
      ] as const"
      :key="i"
      :x1="edge.adjStart.x"
      :y1="edge.adjStart.y"
      :x2="edge.end.x"
      :y2="edge.end.y"
      :stroke="color"
      stroke-width="3"
      marker-start="url(#startarrow)"
    />
    <Injection
      v-for="[inj, edge, [dx, dy]] in ([
        ['A-B', edgeAB, [-100, -125]],
        ['A-C', edgeAC, [-100, 125]],
        ['B-D', edgeBD, [0, -75]],
        [`C-E`, edgeCE, [0, 75]],
        [`D-E`, edgeDE, [120, 20]],
      ] as const).filter(([inj, _edge]) => injections[inj] !== undefined)"
      :key="inj"
      :text="injections[inj]"
      :edge="edge"
      :dx="dx"
      :dy="dy"
    />
    <polyline
      :points="conflictEdgePointsString"
      markerStart="url(#startarrow)"
      markerEnd="url(#endarrow)"
      :style="{ fill: 'none', stroke: 'black', 'stroke-width': 3 }"
    />
  </g>
</template>

<style scoped>
svg {
  font-family: "trebuchet ms", verdana, arial, sans-serif;
  font-size: 13px;
}
svg text {
  fill: black;
}
svg text.annotation {
  font-weight: bold;
}
</style>
