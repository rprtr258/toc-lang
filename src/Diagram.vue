<script setup lang="ts">
import {ref} from "vue";
import Cloud from "./Cloud.vue";
import Tree from "./Tree.vue";
import {saveSvgUrl} from "./util";
import {toPng} from "./imageExport";
import {EDiagramType, TreeSemantics} from "./interpreter";

const {ast, semantics, diagramType} = defineProps<{
  ast: any,
  semantics: TreeSemantics,
  diagramType: EDiagramType | null,
}>();

const downloadUrl = ref<string | null>(null);
const pngDownloadUrl = ref<string | null>(null);
const svgElem = ref<SVGElement | null>(null);

const genUrls = async () => {
  if (svgElem.value) {
    downloadUrl.value = saveSvgUrl(svgElem.value);
    pngDownloadUrl.value = await toPng({
      svg: svgElem.value,
      width: svgElem.value.clientWidth * 2,
      height: svgElem.value.clientHeight * 2,
    });
  } else {
    downloadUrl.value = null;
    pngDownloadUrl.value = null;
  }
};

const updateSvgElem = async (elem: SVGElement | null) => {
  svgElem.value = elem;
  downloadUrl.value = null;
  pngDownloadUrl.value = null;
};
</script>

<template>
  <div>
    <div class="diagram-controls">
      <button v-if="!downloadUrl || !pngDownloadUrl" @click="genUrls">
        Export
      </button>
      <div v-else>
        <a :href="downloadUrl" :download="`${diagramType}.svg`">Download SVG</a>
        <span> | </span>
        <a :href="pngDownloadUrl" :download="`${diagramType}.png`">PNG</a>
      </div>
    </div>

    <Cloud
      v-if="diagramType === 'conflict'"
      :ast="ast"
      :setSvgElem="updateSvgElem"
    />
    <Tree
      v-if="diagramType === 'goal'"
      :semantics="semantics"
      :setSvgElem="updateSvgElem"
    />
    <Tree
      v-if="diagramType === 'problem'"
      :semantics="semantics"
      :setSvgElem="updateSvgElem"
    />
  </div>
</template>
