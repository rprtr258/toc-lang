<script setup lang="ts">
import {computed} from "vue";
import {mid, Edge} from "./math.ts";
import {wrapLines} from "./util.ts";

const props = defineProps<{
  text: string,
  edge: Edge,
  dx: number,
  dy: number,
}>();
const {edge, dx, dy} = props;
const lines = computed(() => wrapLines(props.text, 35));
const edgeMidPoint = mid(edge.start, edge.end);
const lineHeight = 16;
const textCenterX = edgeMidPoint.x + dx;
const textX = textCenterX - 75;
const textY = edgeMidPoint.y + dy;
</script>

<template>
  <text :x="textX" :y="textY">
    <tspan v-for="(line, i) in lines" :key="i" :x="textX" :dy="lineHeight">
      {{ line }}
    </tspan>
  </text>
  <line
    :x1="textCenterX"
    :y1="textY + (dy >= 0 ? 0 : lines.length * lineHeight + 7)"
    :x2="edgeMidPoint.x"
    :y2="edgeMidPoint.y"
    stroke="#000"
    stroke-dasharray="4 5"
    stroke-width="2"
  />
</template>

<style scoped></style>
