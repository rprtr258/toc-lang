import {EOF, SyntaxError, Token, tokenize, TokenType} from "./tokenizer.ts";

export type ParamsAst = Record<string, string>;

export type StatementAst =
  | {
    type: "edge",
    id?: string,
    text?: string,
    fromIds: string[],
    toId: string,
    params?: ParamsAst,
    biDirectional?: true,
  }
  | {
    type: "node",
    id: string,
    text: string,
    params: ParamsAst,
  }
  | {
    type: "type",
    value: string,
  };

export const VALID_TYPES = ["problem", "conflict", "goal"] as const; // TODO: move to interpreter
export type DiagramType = (typeof VALID_TYPES)[number];

function isDiagramType(type: string): type is DiagramType {
  return (VALID_TYPES as readonly string[]).includes(type);
}

export type AstNode = {
  id: string,
  text: string,
  params: ParamsAst,
};
export type AstEdge = {
  fromIds: string[],
  toId: string,
  text?: string,
  biDirectional?: true,
};
export interface Ast {
  type: DiagramType,
  nodes: AstNode[],
  edges: AstEdge[],
}

class Parser {
  private tokens: Token[];
  private current: number = 0;
  private input: string;

  constructor(input: string) {
    this.input = input;
    this.tokens = tokenize(input);
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private advance(): Token {
    const token = this.tokens[this.current];
    if (!this.check("EOF")) this.current++;
    return token;
  }

  private check(type: TokenType): boolean {
    return this.peek().type === type;
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new SyntaxError(message, this.peek());
  }

  private value(tok: Token): string {
    if (tok.type === "STRING") return this.input.slice(tok.start + 1, tok.end - 1);
    return this.input.slice(tok.start, tok.end);
  }

  // type: ident
  private parseTypeStatement(): StatementAst {
    this.consume("IDENT", "Expected 'type'");
    this.consume("COLON", "Expected ':' after 'type'");
    const typeValue = this.consume("IDENT", "Expected type value");
    return {
      type: "type",
      value: this.value(typeValue),
    };
  }

  // ident : label params?
  private parseNodeStatement(): StatementAst {
    const id = this.value(this.consume("IDENT", "Expected identifier for node"));
    this.consume("COLON", "Expected ':' after node identifier");
    const label = this.parseLabel();
    const params = this.parseParamBlock();
    return {
      type: "node",
      id,
      text: label,
      params: params || {},
    };
  }

  private parseLabel(): string {
    if (!this.check("STRING"))
      throw new SyntaxError("Expected label", this.peek());

    return this.value(this.advance());
  }

  private parseParamBlock(): ParamsAst | null {
    if (!this.match("LBRACE")) return null;
    while (this.match("EOL"));
    const params: ParamsAst = {};
    while (!this.check("RBRACE") && !this.check("EOF")) {
      while (this.match("EOL"));
      if (this.check("RBRACE")) break;
      const key = this.value(this.consume("IDENT", "Expected parameter key"));
      this.consume("COLON", "Expected ':' in parameter");
      params[key] = this.parseExpression();
      while (this.match("EOL"));
    }
    this.consume("RBRACE", "Expected '}' after parameters");
    return params;
  }

  private parseExpression(): string {
    if (this.check("STRING")) {
      return this.value(this.advance());
    } else if (this.check("IDENT")) {
      return this.value(this.advance());
    } else {
      return this.value(this.consume("IDENT", "Expected expression"));
    }
  }

  private peekAhead(): Token {
    const idx = this.current + 1;
    return idx < this.tokens.length ? this.tokens[idx] : EOF;
  }

  private parseEdgeStatement(): [
    left: string[],
    right: string[],
    tok: Token & {type: "ARROW_LEFT" | "ARROW_RIGHT" | "ARROW_BI"},
    label: string | undefined,
  ] {
    const sosal = this.peek();
    const leftIds = this.parseIdentList();
    const tok = this.advance();
    const rightIds = this.parseIdentList();
    const label: string | undefined = this.match("COLON") ? this.parseLabel() : undefined;
    switch (tok.type) {
      case "ARROW_LEFT": case "ARROW_RIGHT": case "ARROW_BI": break;
      default:
        throw new SyntaxError("Unexpected edge syntax", sosal);
    }
    return [leftIds, rightIds, tok as Token & {type: "ARROW_LEFT" | "ARROW_RIGHT" | "ARROW_BI"}, label];
  }

  private parseIdentList(): string[] {
    const ids: string[] = [];
    ids.push(this.value(this.consume("IDENT", "Expected identifier")));
    while (this.match("AND")) {
      ids.push(this.value(this.consume("IDENT", "Expected identifier after '&&'")));
    }
    return ids;
  }

  parseStatement(): StatementAst {
    if (this.check("IDENT") && this.value(this.peek()) === "type") {
      return this.parseTypeStatement();
    } else if (this.check("IDENT") && this.peekAhead()?.type === "COLON") {
      return this.parseNodeStatement();
    } else if (this.check("IDENT")) {
      const [leftIds, rightIds, arrowTok, label] = this.parseEdgeStatement();
      switch (arrowTok.type) {
        // toId <- fromIds && ... : label?
        case "ARROW_LEFT":
          if (leftIds.length !== 1)
            throw new SyntaxError("Only one 'to' identifier is allowed", arrowTok);
          return {
            type: "edge",
            toId: leftIds[0],
            fromIds: rightIds,
            text: label,
          };
        // fromIds && ... -> toId : label?
        case "ARROW_RIGHT":
          if (rightIds.length !== 1)
            throw new SyntaxError("Only one 'to' identifier is allowed", arrowTok);
          return {
            type: "edge",
            toId: rightIds[0],
            fromIds: leftIds,
            text: label,
          };
        // fromId -- toId : label?
        case "ARROW_BI":
          if (leftIds.length !== 1)
            throw new SyntaxError("Only one 'from' identifier is allowed", arrowTok);
          if (rightIds.length !== 1)
            throw new SyntaxError("Only one 'to' identifier is allowed", arrowTok);
          return {
            type: "edge",
            toId: rightIds[0],
            fromIds: [leftIds[0]],
            text: label,
            biDirectional: true,
          };
      }
    }
    throw new SyntaxError("Unexpected token", this.peek());
  }

  *parse(): Generator<StatementAst> {
    while (true) {
      while (this.match("EOL") || this.match("COMMENT"));
      if (this.check("EOF"))
        return;
      yield this.parseStatement();
    }
  }
}

const zeroLocation = {col: 0, end: 0, line: 0, start: 0};

export function parse(input: string): Ast {
  const parser = new Parser(input);

  const typeStatements: (StatementAst & {type: "type"})[] = [];
  const nodeStatements: (StatementAst & {type: "node"})[] = [];
  const edgeStatements: (StatementAst & {type: "edge"})[] = [];
  for (const s of parser.parse()) {
    switch (s.type) {
      case "type": typeStatements.push(s); break;
      case "node": nodeStatements.push(s); break;
      case "edge": edgeStatements.push(s); break;
      default: void s;
    }
  }

  if (typeStatements.length > 1)
    throw new SyntaxError("Only one 'type' statement is allowed", zeroLocation);
  else if (typeStatements.length === 1 && !isDiagramType(typeStatements[0].value))
    throw new SyntaxError(`Invalid type '${typeStatements[0].value}'. Must be one of: ${VALID_TYPES.join(", ")}`, zeroLocation);

  const parserType = (typeStatements.length === 1 ? typeStatements[0].value : "problem") as DiagramType;
  return {
    type: parserType,
    nodes: nodeStatements.map(({id, text, params}) => ({id, text, params})),
    edges: edgeStatements.map(({fromIds, toId, text, biDirectional}) => {
      const res: AstEdge = {fromIds, toId};
      if (text !== undefined) res.text = text;
      if (biDirectional) res.biDirectional = biDirectional;
      return res;
    }),
  };
}
