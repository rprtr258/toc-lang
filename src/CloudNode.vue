<script setup lang="ts">
import {computed} from "vue";
import {wrapLines} from "./util.ts";
import {COLORS, parseColor} from "./interpreter.ts";

const props = defineProps<{
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  annotation: string,
  params?: Record<string, string>, // TODO: assert no shape
}>();
const {x, y, width, height, annotation, params = {}} = props;
const lines = computed(() => wrapLines(props.text, 20));
const lineHeight = 16;
const textX = x + 12;
const fillColor = computed(() => parseColor(params.fill, "white"));
const borderColor = computed(() => parseColor(params.border, "black"));
</script>

<template>
  <rect
    :x="x"
    :y="y"
    rx="10"
    ry="10"
    :width="width"
    :height="height"
    :fill="COLORS[fillColor]"
    :stroke="borderColor"
  />
  <text :x="textX" :y="y + height / 2 - lines.length * lineHeight / 2 - 4">
    <tspan v-for="(line, i) in lines" :key="i" :x="textX" :dy="lineHeight">
      {{ line }}
    </tspan>
  </text>
  <circle
    :cx="x"
    :cy="y"
    r="10"
    :style="{ fill: 'white', stroke: 'black', 'stroke-width': '2px' }"
  ></circle>
  <text :x="x - 4" :y="y + 4">
    {{ annotation }}
  </text>
</template>

<style scoped>
svg text {
  fill: black;
  stroke-width: 2;
}
</style>
