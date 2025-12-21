<script setup lang="ts">
import {onMounted, useTemplateRef, watch} from "vue";
import * as d3 from "d3";
import * as dagreD3 from "dagre-d3-es";
import {computeResizeTransform, wrapLines} from "./util";
import {type TreeSemantics, type Node} from "./interpreter";

interface DagreNodeProps {
  // See docs https://github.com/dagrejs/dagre/wiki
  width?: number,
  height?: number,
  label: string,
  style: string,
  labelStyle: string,
  shape: string,
}

const props = defineProps<{
  semantics: TreeSemantics,
  setSvgElem: (svgElem: SVGElement | null) => void,
}>();
const {semantics, setSvgElem} = props;
const {nodes, edges} = semantics;
console.log("rendering tree: ", semantics);

const svgRef = useTemplateRef("svgRef");
const containerRef = useTemplateRef("containerRef");

onMounted(() => render());
watch(() => props.semantics, () => render());

function render() {
  const g = new dagreD3.graphlib.Graph({directed: true});
  g.setGraph({}); // Set an object for the graph label
  g.graph().rankdir = semantics?.rankdir ?? "TB";
  g.graph().ranksep = 15; // Effectively 30 because we double on non-intermediate edges
  g.graph().nodesep = 20;
  g.setDefaultEdgeLabel(() => ({})); // Default to assigning a new object as a label for each new edge.

  for (const node of nodes.values()) createNode(node, node.statusPercentage);
  for (const edge of edges) createEdge(edge.from, edge.to);

  function createEdge(from: string, to: string) {
    const connectsIntermediate =
      semantics!.nodes.get(from)?.intermediate ||
      semantics!.nodes.get(to)?.intermediate;
    g.setEdge(from, to, {
      curve: d3.curveBasis,
      style: "stroke: gray; fill:none; stroke-width: 1px;",
      minlen: connectsIntermediate ? 1 : 2,
    });
  }

  function createNode(node: Node, statusPercentage: number | undefined) {
    const fontFamily = '"trebuchet ms",verdana,arial,sans-serif';
    const fontSize = node.intermediate ? 7 : 13;
    const fontStyle = node.intermediate
      ? `font: bold ${fontSize}px ${fontFamily};`
      : `font: 300 ${fontSize}px ${fontFamily};`;
    const shape = node.intermediate ? "ellipse" : "rect";
    const styleCommon = shape === "rect"
      ? "stroke: black; stroke-width: 1px; rx: 5px; ry: 5px;"
      : "stroke: black; stroke-width: 1px;";
    const config: DagreNodeProps = {
      label: wrapLines(node.label, 20).join("\n"),
      shape,
      style: `${styleCommon} fill:#dff8ff;`, // Blue
      labelStyle: fontStyle + "fill: black;",
    };
    if (node.intermediate) {
      config.width = 5;
      config.height = 5;
      config.style = `${styleCommon} fill:white;`; // Blue
    }
    if (statusPercentage !== undefined) {
      if (statusPercentage >= 70) {
        config.style = `${styleCommon} fill:#95f795;`; // Green
      }
      if (statusPercentage < 70 && statusPercentage > 30) {
        config.style = `${styleCommon} fill:#fdfdbe;`; // Yellow
      }
      if (statusPercentage <= 30) {
        config.style = `${styleCommon} fill:#ffb2b2;`; // Red
      }
    }

    console.log("creating node ", node.key);
    g.setNode(node.key, config);
  }
  const svg = d3.select(svgRef.value);
  const inner = svg.select("g");

  const render = dagreD3.render();
  const container = d3.select(containerRef.value);
  // Run the renderer. This is what draws the final graph.
  render(inner, g);
  inner.attr("transform", computeResizeTransform(inner.node(), container.node(), 13, 13) + ", translate(13, 13)");
  const radius = 10;
  // cleanup previous annotations
  inner.selectAll("g.node.annotation-circle").remove();
  inner.selectAll("g.node.annotation-label").remove();
  const nodeSelector = inner
    .selectAll("g.node")
    .filter((v: string) => semantics?.nodes.get(v)?.annotation !== undefined);

  function getNodeSize(elem: SVGGElement) {
    const rectElem = elem.getElementsByTagName("rect")[0];
    if (rectElem) {
      return {
        width: rectElem.width.baseVal.value,
        height: rectElem.height.baseVal.value,
      };
    }
    const ellipseElem = elem.getElementsByTagName("ellipse")[0];
    if (ellipseElem) {
      return {
        width: 2 * ellipseElem.rx.baseVal.value,
        height: 2 * ellipseElem.ry.baseVal.value,
      };
    }
    return {width: 0, height: 0};
  }

  nodeSelector
    .append("circle")
    .attr("class", "annotation-circle")
    .attr("cx", function () {
      const elem = this.parentNode as SVGGElement;
      const {width} = getNodeSize(elem);
      return -width / 2;
    })
    .attr("cy", function () {
      const elem = this.parentNode as SVGGElement;
      const {height} = getNodeSize(elem);
      return -height / 2;
    })
    .attr("r", radius)
    .style("fill", "white")
    .style("stroke", "black")
    .style("stroke-width", "1px");
  nodeSelector
    .append("text")
    .attr("class", "annotation-label")
    .style("font-size", function () {
      const elem = this.parentNode!;
      const text = semantics?.nodes.get(elem.__data__)?.annotation;
      return (text && text.length < 2 ? 11 : 8) + "px";
    })
    .attr("x", function () {
      const elem = this.parentNode as SVGGElement;
      const {width} = getNodeSize(elem);
      return -width / 2;
    })
    .attr("y", function () {
      const elem = this.parentNode as SVGGElement;
      const { height } = getNodeSize(elem);
      return -height / 2 + 1.5;
    })
    .text(function () {
      const elem = this.parentNode as SVGAElement;
      return nodes.get(elem.__data__)?.annotation ?? "";
    });
  setSvgElem(svgRef.value);
}
</script>

<template>
  <div
    id="tree-svg-container"
    ref="containerRef"
    :style="{width: '100%', height: '500'}"
  >
    <svg
      id="treeSvg"
      ref="svgRef"
      width="100%"
      height="100%"
      version="1.1"
      preserveAspectRatio="xMinYMin"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g />
    </svg>
  </div>
</template>

<style scoped>
</style>
