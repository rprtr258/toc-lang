<script setup lang="ts">
import {onMounted, useTemplateRef, computed} from "vue";
import dagre from "@dagrejs/dagre";
import {wrapLines} from "./util.ts";
import {TreeSemantics, Node, NodeID} from "./interpreter.ts";
import {xy} from "./math.ts";

const props = defineProps<{
  semantics: TreeSemantics,
  setSvgElem: (svgElem: SVGElement | null, initialTransform?: string) => void,
}>();
const {setSvgElem} = props;
const semantics = computed(() => props.semantics);
const edges = computed(() => semantics.value.edges);
const nodes = computed(() => semantics.value.nodes);

const svgRef = useTemplateRef<SVGSVGElement>("svgRef");

type LayoutedNode = {
  id: string,
  width: number,
  height: number,
  shape: string,
  style: string,
  labelStyle: string,
  label: string,
  annotation: string,
  intermediate: boolean,
};

function edgePath(points: xy[]): string {
  const n = points.length;
  if (n < 2) return "";

  let d = `M ${points[0].x} ${points[0].y}`;

  if (n === 2) {
    const p0 = points[0];
    const p1 = points[1];
    const cx = (p0.x + p1.x) / 2;
    const cy = (p0.y + p1.y) / 2;
    return `${d} Q ${cx} ${cy} ${p1.x} ${p1.y}`;
  }

  for (let i = 1; i < n - 1; i++) {
    const pPrev = points[i - 1];
    const pCurr = points[i];
    const pNext = points[i + 1];

    const cx = pCurr.x + (pNext.x - pPrev.x) * 0.2;
    const cy = pCurr.y + (pNext.y - pPrev.y) * 0.2;

    d += ` Q ${cx} ${cy} ${pNext.x} ${pNext.y}`;
  }

  return d;
}

function createNode(node: Node): LayoutedNode {
  const fontSize = node.intermediate ? 7 : 13;
  const fontWeight = node.intermediate ? "bold" : "300";
  const shape = node.intermediate ? "ellipse" : "rect";
  const fillColor = ((statusPercentage) => {
    if (node.intermediate) return "white";
    if (statusPercentage === undefined) return "#dff8ff"; // Blue
    if (statusPercentage >= 70) return "#95f795"; // Green
    if (statusPercentage > 30) return "#fdfdbe"; // Yellow
    return "#ffb2b2"; // Red
  })(node.statusPercentage);
  const styleCommon = shape === "rect" ? "rx: 5px; ry: 5px;" : "";
  const style = `stroke: black; stroke-width: 1px; ${styleCommon} fill:${fillColor};`;
  const width = node.intermediate ? 25 : 150;
  const labelLines = wrapLines(node.label, 20);
  const height = node.intermediate ? 25 : Math.max(50, labelLines.length * 20);
  return {
    id: node.id,
    width,
    height,
    shape,
    style,
    labelStyle: `font: ${fontWeight} ${fontSize}px "trebuchet ms",verdana,arial,sans-serif; fill: black;`,
    label: labelLines.join("\n"),
    annotation: node.annotation ?? "",
    intermediate: node.intermediate ?? false,
  };
}

function createEdge(from: string, to: string) {
  const connectsIntermediate =
    semantics.value.nodes[from]?.intermediate ||
    semantics.value.nodes[to]?.intermediate;
  return {minlen: connectsIntermediate ? 1 : 2};
}

const layedOutNodes = computed(() => Object.values(nodes.value).map(node => createNode(node)));

const g = computed(() => {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({rankdir: semantics.value.rankdir, ranksep: 15, nodesep: 20});
  for (const n of layedOutNodes.value)
    g.setNode(n.id, {width: n.width, height: n.height});
  for (const edge of edges.value)
    g.setEdge(edge.from, edge.to, createEdge(edge.from, edge.to));
  dagre.layout(g);
  return g;
});

const layoutedNodes = computed<(LayoutedNode & xy)[]>(() => layedOutNodes.value.map(node => {
  const pos = g.value.node(node.id);
  return {
    ...node,
    x: pos.x - node.width / 2,
    y: pos.y - node.height / 2,
  };
}));

const layoutedEdges = computed<{
  from: NodeID,
  to: NodeID,
  points: Array<xy>,
  style: string,
}[]>(() => g.value.edges().map(edgeInfo => {
  const edge = g.value.edge(edgeInfo);
  return {
    from: edgeInfo.v,
    to: edgeInfo.w,
    points: edge.points,
    style: "stroke: black; fill:none; stroke-width: 1px;",
  };
}));

const allX = computed(() => [
  ...layoutedNodes.value.flatMap(n => [n.x, n.x + n.width]),
  ...layoutedEdges.value.flatMap(e => e.points.map(p => p.x)),
]);

const allY = computed(() => [
  ...layoutedNodes.value.flatMap(n => [n.y, n.y + n.height]),
  ...layoutedEdges.value.flatMap(e => e.points.map(p => p.y)),
]);

const faa = 20;
const viewBox = computed(() => {
  const minX = Math.min(...allX.value) - faa;
  const maxX = Math.max(...allX.value) + faa;
  const minY = Math.min(...allY.value) - faa;
  const maxY = Math.max(...allY.value) + faa;
  return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
});

onMounted(() => {
  svgRef.value!.setAttribute("viewBox", viewBox.value);
  setSvgElem(svgRef.value, "translate(0, 0)");
});
</script>

<template>
  <div
    id="tree-svg-container"
    :style="{ width: '100%', height: '100%' }"
  >
    <svg
      id="treeSvg"
      ref="svgRef"
      width="100%"
      height="100%"
      version="1.1"
      preserveAspectRatio="xMinYMin"
      viewBox="0 0 1000 1000"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="black" />
        </marker>
      </defs>
      <g transform="translate(13, 13)">
        <path
          v-for="edge in layoutedEdges"
          :key="`${edge.from}-${edge.to}`"
          :d="edgePath(edge.points)"
          :style="edge.style"
          marker-end="url(#arrowhead)"
        />
        <g v-for="node in layoutedNodes" :key="node.id">
          <rect
            v-if="node.shape === 'rect'"
            :x="node.x"
            :y="node.y"
            :width="node.width"
            :height="node.height"
            :style="node.style"
          />
          <ellipse
            v-else
            :cx="node.x + node.width / 2"
            :cy="node.y + node.height / 2"
            :rx="node.width / 2"
            :ry="node.height / 2"
            :style="node.style"
          />
          <text
            :x="node.x + node.width / 2"
            :y="node.y + node.height / 2 - (node.label.split('\n').length - 1) * 7"
            :style="node.labelStyle"
            text-anchor="middle"
            dominant-baseline="central"
          >
            <tspan
              v-if="!node.intermediate"
              :x="node.x + node.width / 2"
              :y="node.y + 7"
              :style="`font-size: 0.6em; fill: black; font-style: italic; font-weight: bold;`"
              text-anchor="middle"
              dominant-baseline="central"
            >
              {{ node.id }}
            </tspan>
            <title v-if="!node.intermediate">{{ node.id }}</title>
            <tspan
              v-for="(line, index) in node.label.split('\n')"
              :key="index"
              :x="node.x + node.width / 2"
              :dy="node.intermediate ? 0 : index === 0 ? '1em' : '1.2em'"
            >
              {{ line }}
            </tspan>
          </text>
          <template v-if="node.annotation">
            <circle
              :cx="node.x"
              :cy="node.y"
              r="10"
              fill="white"
              stroke="black"
              stroke-width="1"
            />
            <text
              :x="node.x"
              :y="node.y"
              :style="`font-size: ${node.annotation.length < 2 ? 11 : 8}px; fill: black;`"
              text-anchor="middle"
              dominant-baseline="central"
            >
              {{ node.annotation }}
            </text>
          </template>
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped></style>
