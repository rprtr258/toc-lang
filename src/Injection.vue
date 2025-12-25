<script setup lang="ts">
import {computed} from "vue";
import {Edge, mid} from "./math.ts";
import {wrapLines} from "./util.ts";

const props = defineProps<{
  text: string,
  edge: Edge,
  dx: number,
  dy: number,
}>();
const {edge, dx, dy} = props;
const text = computed(() => props.text);
const lines = computed(() => wrapLines(text.value, 35));
const edgeMidPoint = mid(edge.start, edge.end);
const lineHeight = 16;
const textCenterX = edgeMidPoint.x + dx;
const textX = textCenterX - 75;
const textY = edgeMidPoint.y + dy;
const dYMagnitude = dy / Math.abs(dy);
const textBottomY = computed(() => textY + lines.value.length * lineHeight + 7);
const textTopY = textY;
const lineStartY = computed(() => dYMagnitude === 1 ? textTopY : textBottomY.value);
const lineStartX = textCenterX;
</script>

<template>
  <text :x="textX" :y="textY">
    <tspan v-for="(line, i) in lines" :key="i" :x="textX" :dy="lineHeight">
      {{ line }}
    </tspan>
  </text>
  <line
    :x1="lineStartX"
    :y1="lineStartY"
    :x2="edgeMidPoint.x"
    :y2="edgeMidPoint.y"
    stroke="#000"
    stroke-dasharray="4 5"
    stroke-width="2"
  />
</template>

<style scoped></style>
