<script setup lang="ts">
import {computed, onMounted, useTemplateRef} from "vue";
import svgPanZoom from "svg-pan-zoom";
import Cloud from "./Cloud.vue";
import Tree from "./Tree.vue";
import {TreeSemantics} from "./interpreter.ts";
import {Ast, DiagramType} from "./parser.ts";

const props = defineProps<{
  ast: Ast,
  semantics: TreeSemantics | null,
  diagramType: DiagramType | null,
}>();
const {diagramType} = props;
const ast = computed(() => props.ast);
const semantics = computed(() => props.semantics);

const svgElem = useTemplateRef<SVGSVGElement | null>("svgRef");

type SvgPanZoomInstance = typeof svgPanZoom; // TODO: this shit does not export fucking types
let panZoomInstance: SvgPanZoomInstance | null = null;

onMounted(() => {
  if (panZoomInstance) {
    panZoomInstance.destroy();
    panZoomInstance = null;
  }
  const elem = svgElem.value!;
  elem.style.display = "block";
  panZoomInstance = svgPanZoom(elem, {
    zoomEnabled: true,
    panEnabled: true,
    mouseWheelZoomEnabled: true,
    dblClickZoomEnabled: false,
    controlIconsEnabled: true,
    fit: true,
    center: true,
    minZoom: 0.1,
    maxZoom: 10,
    zoomScaleSensitivity: 0.4,
  });
  // TODO: fix this gavnischcsche from https://github.com/bumbu/svg-pan-zoom/issues/433
  const controls = elem.querySelector('g[id="svg-pan-zoom-controls"]')!; // reposition the controls
  const svgHeight = elem.getBoundingClientRect().height;
  const svgWidth = elem.getBoundingClientRect().width;
  controls.setAttribute("transform", `translate(${svgWidth - 100}, ${svgHeight - 100})`);
});
</script>

<template>
  <div style="width: 100%; height: 100%;">
    <svg
      ref="svgRef"
      width="100%"
      height="100%"
      version="1.1"
      preserveAspectRatio="xMinYMin"
      viewBox="0 0 650 400"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Cloud
        v-if="diagramType === 'conflict'"
        :ast="ast"
      />
      <!-- Check for goal because it's possible for us to get the wrong diagram type -->
      <template v-else-if="!semantics">No AST</template>
      <Tree
        v-else-if="diagramType === 'goal'"
        key="goal"
        :semantics="semantics"
      />
      <Tree
        v-else-if="diagramType === 'problem'"
        key="problem"
        :semantics="semantics"
      />
    </svg>
  </div>
</template>
