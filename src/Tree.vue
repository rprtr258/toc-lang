<script setup lang="ts">
import {onMounted, useTemplateRef, computed} from "vue";
import dagre from "@dagrejs/dagre";
import {getBoxToBoxArrow} from "curved-arrows";
import {wrapLines} from "./util.ts";
import {TreeSemantics, Node, NodeID} from "./interpreter.ts";
import {xy} from "./math.ts";

const props = defineProps<{
  semantics: TreeSemantics,
  setSvgElem: (svgElem: SVGSVGElement, initialTransform?: [zoom: number, pan: xy]) => void,
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

function edgePath(edge: LayoutedEdge): string {
  const from = layoutedNodes.value.find(n => n.id === edge.from)!;
  const to = layoutedNodes.value.find(n => n.id === edge.to)!;
  const [sx, sy, c1x, c1y, c2x, c2y, ex, ey, ae, as] = getBoxToBoxArrow(
    from.x, from.y, from.width, from.height,
    to.x, to.y, to.width, to.height,
    {
      allowedStartSides: ["top"],
      allowedEndSides: semantics.value.nodes[edge.to]?.intermediate ? ["bottom", "left", "right"] : ["bottom"],
      controlPointStretch: 20,
    },
  );
  void([ae, as]);
  return `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${ex} ${ey}`;
}

const white = "#ffffff";
const red = "#ffb2b2";
const green = "#95f795";
// const blue = "#dff8ff";
const yellow = "#fdfdbe";

function createNode(node: Node): LayoutedNode {
  const fontSize = node.intermediate ? 7 : 13;
  const fontWeight = node.intermediate ? "bold" : "300";
  const shape = node.intermediate ? "ellipse" : "rect";
  const fillColor = ((statusPercentage) => {
    if (node.intermediate || statusPercentage === undefined) return white;
    if (statusPercentage >= 70) return green;
    if (statusPercentage > 30) return yellow;
    return red;
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
    y: (pos.y - node.height / 2) * 1.2,
  };
}));

type LayoutedEdge = {
  from: NodeID,
  to: NodeID,
  points: Array<xy>,
};
const layoutedEdges = computed<LayoutedEdge[]>(() => g.value.edges().map(edgeInfo => {
  const edge = g.value.edge(edgeInfo);
  return {
    from: edgeInfo.v,
    to: edgeInfo.w,
    points: edge.points,
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
const viewRect = computed(() => {
  const minX = Math.min(...allX.value) - faa;
  const maxX = Math.max(...allX.value) + faa;
  const minY = Math.min(...allY.value) - faa;
  const maxY = Math.max(...allY.value) + faa;
  return {minX, minY, maxX, maxY};
});
const viewBox = computed(() => {
  const {minX, maxX, minY, maxY} = viewRect.value;
  return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
});

onMounted(() => {
  const svg = svgRef.value!;
  svg.setAttribute("viewBox", viewBox.value);
  const vb = viewRect.value;
  setSvgElem(svg, [1, {x: vb.minX, y: vb.minY}]);
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
          :d="edgePath(edge)"
          style="stroke: black; fill:none; stroke-width: 1px;"
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
