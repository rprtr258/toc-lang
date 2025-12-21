<script setup lang="ts">
import {Edge, xy} from "./math.ts";
const {edge} = defineProps<{edge: Edge & {adjStart: xy}}>();
</script>

<template>
  <line
    :x1="edge.adjStart.x"
    :y1="edge.adjStart.y"
    :x2="edge.end.x"
    :y2="edge.end.y"
    stroke="#000"
    stroke-width="3"
    marker-start="url(#startarrow)"
  />
</template>

<style scoped></style>
