<script setup lang="ts">
import {ref} from "vue";
import {parser} from "peggy";
import type {Diagnostic} from "@codemirror/lint";
import Editor from "./Editor.vue";
import Diagram from "./Diagram.vue";
import {
  parseTextToAst,
  parseGoalTreeSemantics,
  parseProblemTreeSemantics,
  type TreeSemantics,
  type Completions,
  EDiagramType,
  Ast,
} from "./interpreter.ts";

const completions = ref<Completions>({idents: []});

const ast = ref<Ast | null>(null);
const semantics = ref<TreeSemantics | null>(null);
const diagnostics = ref<Diagnostic[]>([]);
const text = ref<string>("");
const diagramType = ref<EDiagramType | null>(null);

const onEditorChange = (value: string) => {
  try {
    const {ast: parsedAst, type} = parseTextToAst(value);
    switch (type) {
      case "goal": {
        const sem = parseGoalTreeSemantics(parsedAst);
        semantics.value = sem;
        completions.value.idents = Object.keys(sem.nodes);
        break;
      }
      case "problem": {
        const sem = parseProblemTreeSemantics(parsedAst);
        semantics.value = sem;
        completions.value.idents = Object.keys(sem.nodes);
        break;
      }
      default:
        semantics.value = null;
        completions.value.idents = ["A", "B", "C", "D", "E"];
    }
    ast.value = parsedAst;
    diagramType.value = type;
    diagnostics.value = [];
  } catch (e) {
    const err = e as parser.SyntaxError;
    const diag: Diagnostic = {
      from: err.location.start.offset - err.location.start.column,
      to: err.location?.end?.offset ?? value.length,
      severity: "error",
      message: err.message || e.toString(),
    };
    diagnostics.value = [diag];
  }
};
</script>

<template>
  <div style="display: grid; grid-template-columns: 50% 50%; height: 100%">
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

<style scoped></style>
