<script setup lang="ts">
import {onMounted, watch} from "vue";
import {computeResizeTransform, wrapLines} from "./util";
import {CloudEdge, CloudNode, Injection, midPoint, intermediatePoint, drawCloud} from "./svgGen";

const props = defineProps<{
  ast: any,
  setSvgElem: (elem: SVGElement | null) => void,
}>();

watch(() => props.ast, () => updateTransform(), {immediate: true});

function updateTransform() {
  const g = document.getElementById("cloudSvgInner");
  const svgContainer = document.getElementById("cloudSvgContainer");
  g?.setAttribute("transform", computeResizeTransform(g, svgContainer, 10, 0) + ", translate(-10, 0)");
  props.setSvgElem(document.getElementById("cloudSvg") as any as SVGElement);
}
</script>

<template>
  <div id="cloudSvgContainer" style="width: 100%; height: 500px">
    <template v-if="ast" v-html="drawCloud(ast)"></template>
  </div>
</template>
