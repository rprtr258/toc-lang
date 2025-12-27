import {
  LanguageSupport,
  HighlightStyle,
  syntaxHighlighting,
  defaultHighlightStyle,
  StreamLanguage,
} from "@codemirror/language";
import type {
  CompletionSource,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";
import {tags as t} from "@lezer/highlight";
import {Completion, VALID_SHAPES} from "./interpreter.ts";

function isTrue(value: boolean | RegExpMatchArray | null): value is true {
  if (value === null) return false;
  if (typeof value === "boolean") return value;
  return value.length > 0;
}

export function myLanguage(idents: string[]) {
  return StreamLanguage.define<undefined>({
    startState() {
      return undefined;
    },
    token(stream, state: undefined): keyof typeof t {
      void state;

      // Comments
      if (isTrue(stream.match(/^#.*/))) return "lineComment";

      // Directive (starts with .)
      if (isTrue(stream.match(/^\.[a-zA-Z]+/))) return "keyword";

      // Punctuation
      if (isTrue(stream.match(":"))) return "punctuation";
      if (isTrue(stream.match("="))) return "operator";
      if (isTrue(stream.match(/^[{}]/))) return "brace";

      // Arrows
      if (isTrue(stream.match(/^(->|<-|--)/))) return "arithmeticOperator";

      // Property keys
      if (isTrue(stream.match(/^(shape|border|fill|color|class|status)/)))
        return "propertyName";

      // Property values - shapes
      if (isTrue(stream.match(/^(box|circle|ellipse)/))) return "atom";

      // Property values - colors
      if (isTrue(stream.match(/^(black|white|blue|yellow|green|red)/))) return "color";

      // Type values
      if (isTrue(stream.match(/^(problem|conflict|goal)/))) return "keyword";

      // Annotations
      if (isTrue(stream.match(/^(UDE|CSF|FOL|DE)/))) return "variableName";

      // Old-style "type" keyword
      if (isTrue(stream.match(/^type\b/))) return "keyword";

      // Strings
      if (isTrue(stream.match('"', false)) && isTrue(stream.match(/^"[^"]*"/))) return "string";

      // Identifiers (including node IDs)
      if (idents.find(ident => isTrue(stream.match(ident))) !== undefined) return "variableName";

      // Default
      stream.eat(/./);
      return "name";
    },
  });
}

export const TOC_LANG_HIGHLIGHT = syntaxHighlighting(HighlightStyle.define([
  ...defaultHighlightStyle.specs,
  {tag: t.punctuation, color: "#99b"},
  {tag: t.arithmeticOperator, color: "#686"},
  {tag: t.variableName, color: "#55a"},
  {tag: t.string, color: "#677", fontStyle: "italic"},
  {tag: t.propertyName, color: "#a85"},
  {tag: t.atom, color: "#764"},
  {tag: t.color, color: "#567"},
], {themeType: "light"}));

export function TOC_LANG(completions: Completion[]): LanguageSupport {
  completions.sort((a: Completion, b: Completion) => a.id.localeCompare(b.id));

  const NODE_PROPERTY_KEYS = ["class", "status", "shape", "border", "fill"];
  const EDGE_PROPERTY_KEYS = ["color"];
  const ALL_PROPERTY_KEYS = [...NODE_PROPERTY_KEYS, ...EDGE_PROPERTY_KEYS];
  const COLOR_VALUES = ["black", "white", "blue", "yellow", "green", "red"];
  const TYPE_VALUES = ["problem", "conflict", "goal"];
  const DIRECTIVE_VALUES = ["type"];
  const ANNOTATION_VALUES = ["UDE", "CSF", "FOL", "DE"];

  const autocomplete: CompletionSource = (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/\w*/);
    if (word === null) return null;

    // Don't auto-trigger on empty word unless explicit
    if (word.from === word.to && !context.explicit) {
      return null;
    }

    const textBefore = context.state.sliceDoc(0, word.from);
    const lastCharBefore = textBefore.slice(-1);
    const lineBefore = textBefore.split("\n").pop() ?? "";

    // Check if we're after an equals sign (property value)
    if (lastCharBefore === "=") {
      // Determine what property we're setting
      const propMatch = lineBefore.match(/(\w+)=$/);
      if (propMatch) {
        const prop = propMatch[1];
        const options =
          prop === "shape" ? VALID_SHAPES as readonly string[] :
          prop === "border" || prop === "fill" || prop === "color" ? COLOR_VALUES :
          prop === "class" ? ANNOTATION_VALUES :
          prop === "status" ? ["0", "25", "50", "75", "100"] :
          prop === "type" ? TYPE_VALUES :
          [];

        if (options.length > 0) {
          return {
            from: word.from,
            options: options.map((label) => ({label, type: "value"})),
            validFor: /^(\w+)?$/,
          };
        }
      }
    }

    // Check if we're after a colon (label or directive value)
    if (lastCharBefore === ":") {
      // Check if it's a directive
      const directiveMatch = lineBefore.match(/^\.[a-zA-Z]+:$/);
      if (directiveMatch) {
        return {
          from: word.from,
          options: TYPE_VALUES.map((label) => ({label, type: "keyword"})),
          validFor: /^(\w+)?$/,
        };
      }

      // After colon in node/edge, suggest strings (not handled here, user types manually)
      return null;
    }

    // Check if we're in a property context (after a string or after another property)
    // Look for pattern: "label" or "label" prop=value
    const hasLabel = /"[^"]*"\s*$/.test(lineBefore);
    const hasProperty = /\w+=\w+\s*$/.test(lineBefore);

    if (hasLabel || hasProperty) {
      // Suggest property keys
      return {
        from: word.from,
        options: ALL_PROPERTY_KEYS.map((label) => ({
          label,
          type: "property",
          info: "Property key",
        })),
        validFor: /^(\w+)?$/,
      };
    }

    // Check if we're at the start of a line (potential directive)
    if (lineBefore.trim() === "") {
      return {
        from: word.from,
        options: [
          ...DIRECTIVE_VALUES.map((label) => ({
            label: "." + label,
            type: "keyword",
            info: "Directive",
          })),
          ...completions.map(({id, text}) => ({
            label: id,
            type: "variable",
            info: text,
          })),
        ],
        validFor: /^(\w+)?$/,
      };
    }

    // Default: suggest node IDs
    return {
      from: word.from,
      options: completions.map(({id, text}) => ({label: id, type: "variable", info: text})),
      validFor: /^(\w+)?$/,
    };
  };

  const idents = completions.map(c => c.id);
  const lang = myLanguage(idents);
  return new LanguageSupport(lang, [lang.data.of({autocomplete})]);
}
