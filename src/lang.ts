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
import {COLORS, Completion, VALID_SHAPES} from "./interpreter.ts";
import {VALID_TYPES} from "./parser.ts";

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
  // to highlight "lol_kek" before "lol"
  completions.sort((a: Completion, b: Completion) => -a.id.localeCompare(b.id));

  type CompletionItem = [label: string, info: string];
  const NODE_PROPERTY_KEYS: CompletionItem[] = [
    ["class", "Node class"],
    ["status", "Completion status in percent"],
    ["shape", "Node shape"],
    ["border", "Border color"],
    ["fill", "Fill color"],
  ];
  const EDGE_PROPERTY_KEYS: CompletionItem[] = [["color", "Edge color"]];
  const ALL_PROPERTY_KEYS = [...NODE_PROPERTY_KEYS, ...EDGE_PROPERTY_KEYS];
  const DIRECTIVE_KEYS: CompletionItem[] = [["type", "Type of diagram"]];
  const CLASS_VALUES: CompletionItem[] = [
    ["UDE", "UnDesirable Effect"],
    ["CSF", "Critical Success Factor"],
    ["FOL", "Fact Of Life"],
    ["DE", "Desirable Effect"],
  ];

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
          prop === "shape" ? (VALID_SHAPES as readonly string[]).map(label => ({type: "value", label})) :
          ["border", "fill", "color"].includes(prop) ? Object.keys(COLORS).map(label => ({type: "value", label})) :
          prop === "class" ? CLASS_VALUES.map(([label, info]) => ({type: "value", label, info})) :
          prop === "status" ? ["0", "25", "50", "75", "100"].map(label => ({type: "value", label})) :
          [];

        if (options.length > 0) {
          return {
            from: word.from,
            options,
            validFor: /^(\w+)?$/,
          };
        }
      }
    }

    // Check if we're after a colon (label or directive value)
    if (textBefore.slice(-2) === ": ") {
      // Check if it's a directive
      if (lineBefore.match(/^\.[a-zA-Z]+: $/)) {
        return {
          from: word.from,
          options: VALID_TYPES.map(label => ({type: "keyword", label})),
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
        options: ALL_PROPERTY_KEYS.map(([label, info]) => ({
          type: "property",
          label,
          info,
        })),
        validFor: /^(\w+)?$/,
      };
    }

    // Check if we're at the start of a line (potential directive)
    if (lineBefore.trim() === "") {
      return {
        from: word.from,
        options: [
          ...DIRECTIVE_KEYS.map(([label, info]) => ({
            type: "keyword",
            label: "." + label,
            info,
          })),
          ...completions.map(({id, text}) => ({
            type: "variable",
            label: id,
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
