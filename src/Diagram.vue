<script setup lang="ts">
import {computed, ref} from "vue";
import svgPanZoom from "svg-pan-zoom";
import Cloud from "./Cloud.vue";
import Tree from "./Tree.vue";
import {TreeSemantics} from "./interpreter.ts";
import {Ast, EDiagramType} from "./parser.ts";

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
  elem: SVGSVGElement | null,
  initialTransform?: string,
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
      controlIconsEnabled: false,
      fit: true,
      center: true,
      minZoom: 0.1,
      maxZoom: 10,
      zoomScaleSensitivity: 0.4,
    });
    if (initialTransform) {
      // Parse initial transform, but svg-pan-zoom handles fit/center, so maybe skip or adjust
      // For simplicity, let it fit and center
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
