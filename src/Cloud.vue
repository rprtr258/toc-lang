<script setup lang="ts">
import {computed, onMounted, useTemplateRef, watch} from "vue";
import {createEdge, displacePoint, midPoint, bottomCenter, topCenter, rect} from "./math.ts";
import CloudNode from "./CloudNode.vue";
import Injection from "./Injection.vue";
import CloudEdge from "./CloudEdge.vue";
import {Ast, StatementAst} from "./parser.ts";

const props = defineProps<{
  ast: Ast,
  setSvgElem: (elem: SVGSVGElement) => void,
}>();
const ast = computed(() => props.ast);

const cloudSvgRef = useTemplateRef<SVGSVGElement>("cloudSvg");
const cloudSvgInnerRef = useTemplateRef<SVGGElement>("cloudSvgInner");

onMounted(() => updateTransform());
watch(() => props.ast, () => updateTransform());

function updateTransform() {
  const g = cloudSvgInnerRef.value!;
  if (g) {
    const bbox = g.getBBox();
    const viewBox = `0 0 ${bbox.width + 20} ${bbox.height + 20}`;
    cloudSvgRef.value?.setAttribute("viewBox", viewBox);
    g.setAttribute("transform", "translate(10, 10)");
  }
  props.setSvgElem(cloudSvgRef.value!);
}

type NodeLabels = {
  A: string,
  B: string,
  C: string,
  D: string,
  E: string,
};
const nodeLabels = computed<NodeLabels>(() => Object.fromEntries(ast.value.statements
  .filter((statement): statement is StatementAst & { type: "node" } => statement.type === "node")
  .map(statement => [statement.id, statement.text])) as NodeLabels);

const injections = computed<Record<string, string>>(() => Object.fromEntries(ast.value.statements
  .filter((statement): statement is StatementAst & { type: "edge" } => statement.type === "edge")
  .map(statement => {
    const id1 = statement.fromIds[0];
    const id2 = statement.toId;
    const edgeName = id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
    return [edgeName, statement.text!];
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
const nodeDp: rect = {x: x3, y: y3, w: nodeWidth, h: nodeHeight};
const edgeAB = createEdge(nodeA, nodeB);
const edgeAC = createEdge(nodeA, nodeC);
const edgeBD = createEdge(nodeB, nodeD);
const edgeCDp = createEdge(nodeC, nodeDp);
const conflictStart = bottomCenter(nodeD);
const conflictEnd = topCenter(nodeDp);
const conflictMid = midPoint(conflictStart, conflictEnd);
const conflictEdgePoints = [
  displacePoint(conflictStart, {x: 0, y: 16}),
  displacePoint(conflictMid, {x: -15, y: 5}),
  displacePoint(conflictMid, {x: 15, y: -5}),
  displacePoint(conflictEnd, {x: 0, y: -16}),
];
const edgeDDp = {
  start: conflictEdgePoints[0],
  end: conflictEdgePoints[3],
};
const conflictEdgePointsString = conflictEdgePoints.map((p) => `${p.x},${p.y}`).join(" ");
</script>

<template>
  <div style="width: 100%; height: 100%">
    <svg
      ref="cloudSvg"
      width="100%"
      height="100%"
      version="1.1"
      preserveAspectRatio="xMinYMin"
      viewBox="0 0 650 400"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g ref="cloudSvgInner">
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
          annotation="A"
          :text="nodeLabels.A"
          :x="nodeA.x"
          :y="nodeA.y"
          :width="nodeWidth"
          :height="nodeHeight"
        />
        <CloudNode
          annotation="B"
          :text="nodeLabels.B"
          :x="nodeB.x"
          :y="nodeB.y"
          :width="nodeWidth"
          :height="nodeHeight"
        />
        <CloudNode
          annotation="C"
          :text="nodeLabels.C"
          :x="nodeC.x"
          :y="nodeC.y"
          :width="nodeWidth"
          :height="nodeHeight"
        />
        <CloudNode
          annotation="D"
          :text="nodeLabels.D"
          :x="nodeD.x"
          :y="nodeD.y"
          :width="nodeWidth"
          :height="nodeHeight"
        />
        <CloudNode
          annotation="E"
          :text="nodeLabels.E"
          :x="nodeDp.x"
          :y="nodeDp.y"
          :width="nodeWidth"
          :height="nodeHeight"
        />
        <CloudEdge :edge="edgeAB" />
        <CloudEdge :edge="edgeAC" />
        <CloudEdge :edge="edgeBD" />
        <CloudEdge :edge="edgeCDp" />
        <Injection
          v-if="injections['A-B']"
          :text="injections['A-B']"
          :edge="edgeAB"
          :dx="-100"
          :dy="-125"
        />
        <Injection
          v-if="injections['A-C']"
          :text="injections['A-C']"
          :edge="edgeAC"
          :dx="-100"
          :dy="125"
        />
        <Injection
          v-if="injections['B-D']"
          :text="injections['B-D']"
          :edge="edgeBD"
          :dx="0"
          :dy="-75"
        />
        <Injection
          v-if="injections[`C-E`]"
          :text="injections[`C-E`]"
          :edge="edgeCDp"
          :dx="0"
          :dy="75"
        />
        <Injection
          v-if="injections[`D-E`]"
          :text="injections[`D-E`]"
          :edge="edgeDDp"
          :dx="120"
          :dy="20"
        />
        <polyline
          :points="conflictEdgePointsString"
          markerStart="url(#startarrow)"
          markerEnd="url(#endarrow)"
          :style="{ fill: 'none', stroke: 'black', 'stroke-width': 3 }"
        />
      </g>
    </svg>
  </div>
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
