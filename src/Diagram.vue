<script setup lang="ts">
import {computed, ref} from "vue";
import svgPanZoom from "svg-pan-zoom";
import Cloud from "./Cloud.vue";
import Tree from "./Tree.vue";
import {TreeSemantics} from "./interpreter.ts";
import {Ast, EDiagramType} from "./parser.ts";
import {xy} from "./math.ts";

const props = defineProps<{
  ast: Ast,
  semantics: TreeSemantics | null,
  diagramType: EDiagramType | null,
}>();
const {diagramType} = props;
const ast = computed(() => props.ast);
const semantics = computed(() => props.semantics);

const svgElem = ref<SVGSVGElement | null>(null);

type SvgPanZoomInstance = typeof svgPanZoom; // TODO: this shit does not export fucking types
let panZoomInstance: SvgPanZoomInstance | null = null;

const updateSvgElem = (
  elem: SVGSVGElement,
  initialTransform?: [zoom: number, pan: xy],
) => {
  svgElem.value = elem;
  if (panZoomInstance) {
    panZoomInstance.destroy();
    panZoomInstance = null;
  }
  if (elem) {
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
      onZoom(newScale) {
        console.log("zoom", newScale);
      },
      onPan(newPan) {
        console.log("pan", newPan);
      },
    });
    // TODO: fix this gavnischcsche from https://github.com/bumbu/svg-pan-zoom/issues/433
    const controls = elem.querySelector('g[id="svg-pan-zoom-controls"]')!; // reposition the controls
    const svgHeight = elem.getBoundingClientRect().height;
    const svgWidth = elem.getBoundingClientRect().width;
    controls.setAttribute("transform", `translate(${svgWidth - 100}, ${svgHeight - 100})`);
    if (initialTransform) {
      console.log(initialTransform[0], initialTransform[1]);
      panZoomInstance.zoom(initialTransform[0]);
      panZoomInstance.pan(initialTransform[1]);
    }
  }
};
</script>

<template>
  <div>
    <Cloud
      v-if="diagramType === 'conflict'"
      :ast="ast"
      :setSvgElem="updateSvgElem"
    />
    <!-- Check for goal because it's possible for us to get the wrong diagram type -->
    <template v-else-if="!semantics">No AST</template>
    <Tree
      v-else-if="diagramType === 'goal'"
      key="goal"
      :semantics="semantics"
      :setSvgElem="updateSvgElem"
    />
    <Tree
      v-else-if="diagramType === 'problem'"
      key="problem"
      :semantics="semantics"
      :setSvgElem="updateSvgElem"
    />
  </div>
</template>
