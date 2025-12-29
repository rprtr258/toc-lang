<script setup lang="ts">
import {ref} from "vue";
import type {Diagnostic} from "@codemirror/lint";
import Editor from "./Editor.vue";
import Diagram from "./Diagram.vue";
import {
  parseTextToAst,
  parseGoalTreeSemantics,
  parseProblemTreeSemantics,
  type TreeSemantics,
  Completion,
  cloudDefaultLabels,
} from "./interpreter.ts";
import {Ast, DiagramType} from "./parser.ts";
import {SyntaxError} from "./tokenizer.ts";

const completions = ref<Completion[]>([]);

const ast = ref<Ast | null>(null);
const semantics = ref<TreeSemantics | null>(null);
const diagnostics = ref<Diagnostic[]>([]);
const text = ref<string>("");
const diagramType = ref<DiagramType | null>(null);

const onEditorChange = (value: string) => {
  try {
    const parsedAst = parseTextToAst(value);
    switch (parsedAst.type) {
      case "goal": {
        const sem = parseGoalTreeSemantics(parsedAst);
        semantics.value = sem;
        completions.value = parsedAst.nodes;
        break;
      }
      case "problem": {
        const sem = parseProblemTreeSemantics(parsedAst);
        semantics.value = sem;
        completions.value = parsedAst.nodes;
        break;
      }
      default:
        semantics.value = null; // TODO: validate semantics
        completions.value = Object.entries(cloudDefaultLabels).map(([id, text]) => ({
          id,
          text: parsedAst.nodes.find(n => n.id === id)?.text ?? text,
        }));
    }
    ast.value = parsedAst;
    diagramType.value = parsedAst.type;
    diagnostics.value = [];
  } catch (e) {
    const err = e as SyntaxError;
    const diag: Diagnostic = {
      from: err.token.start - err.token.col,
      to: err.token.end ?? value.length,
      severity: "error",
      message: err.message,
    };
    diagnostics.value = [diag];
  }
};
</script>

<template>
  <div class="two-panes">
    <Editor
      :rows="20"
      :value="text"
      @update="v => {text = v; onEditorChange(v);}"
      :diagnostics="diagnostics"
      :completions="completions"
    />
    <Diagram
      v-if="ast"
      :key="diagramType || 'none'"
      :ast="ast"
      :semantics="semantics"
      :diagramType="diagramType"
    />
    <div v-else>No AST</div>
  </div>
</template>

<style scoped>
.two-panes {
  display: grid;
  grid-template-columns: 1fr 2fr;
  height: 100%;
}
.two-panes > :nth-child(1) {
  min-height: 0;
}
</style>
