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
} from "@codemirror/autocomplete";
import {tags as t} from "@lezer/highlight";

export function myLanguage(idents: string[]) {
  return StreamLanguage.define<undefined>({
    startState() { return undefined; },
    token(stream, state: undefined): keyof typeof t {
      void(state);
      if (stream.match(/^#.*/)) return "lineComment";
      if (stream.match(":")) return "punctuation";
      if (stream.match(/^(->|<-|--)/)) return "arithmeticOperator";
      if (stream.match("type")) return "keyword";
      if (stream.match(/^[{}]/)) return "brace";
      if (idents.find(ident => stream.match(ident))) return "variableName";
      if (stream.match('"', false) && stream.match(/^"[^"]*"/)) return "string";

      stream.eat(/./);
      return "name";
    },
  });
}

// export const TocLangLanguage = LRLanguage.define({
//   parser: parser.configure({
//     props: [
//       indentNodeProp.add({
//         Application: delimitedIndent({closing: "}", align: false}),
//       }),
//       foldNodeProp.add({
//         Application: foldInside,
//       }),
//       styleTags({
//         Ident: t.variableName,
//         Boolean: t.bool,
//         String: t.string,
//         Label: t.string,
//         ":": t.punctuation,
//         "->": t.arithmeticOperator,
//         "--": t.arithmeticOperator,
//         "<-": t.arithmeticOperator,
//         LineComment: t.lineComment,
//         "{ }": t.brace,
//       }),
//     ],
//   }),
//   languageData: {
//     commentTokens: {line: "#"},
//   },
// });

export const TOC_LANG_HIGHLIGHT = syntaxHighlighting(
  HighlightStyle.define(
    [
      ...defaultHighlightStyle.specs,
      {tag: t.punctuation, color: "#99b"},
      {tag: t.arithmeticOperator, color: "#686"},
      {tag: t.variableName, color: "#55a"},
      {tag: t.string, color: "#677", fontStyle: "italic"},
    ],
    {themeType: "light"},
  ),
);

export function TOC_LANG(options: {idents: string[]}): LanguageSupport {
  const autocomplete: CompletionSource = (context: CompletionContext) => {
    const word = context.matchBefore(/\w*/);
    console.log(word, context, options.idents);
    if (word !== null && word.from === word.to && !context.explicit) {
      return null;
    }
    return {
      from: word?.from || context.pos,
      options: options.idents.map(ident => ({label: ident, type: "Ident"})),
      validFor: /^(\w+)?$/,
    };
  };
  const lang = myLanguage(options.idents.toSorted((a: string, b: string) => b.length - a.length));
  return new LanguageSupport(lang, [lang.data.of(autocomplete)]);
}