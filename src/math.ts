export type xy = {
  x: number,
  y: number,
};

export type rect = xy & {
  w: number,
  h: number,
};

export function intermediatePoint(start: xy, end: xy, distance: number): xy {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const ratio = distance / length;
  return {
    x: start.x + dx * ratio,
    y: start.y + dy * ratio,
  };
}

export function plus(a: xy, b: xy): xy {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
  };
}

export function mid(a: xy, b: xy): xy {
  const sum = plus(a, b);
  return {
    x: sum.x / 2,
    y: sum.y / 2,
  };
}

export interface Edge {
  start: xy,
  end: xy,
}

export function createEdge(
  startNode: rect,
  endNode: rect,
): Edge & { adjStart: xy } {
  const start: xy = {
    x: startNode.x + startNode.w,
    y: startNode.y + startNode.h / 2,
  };
  const end: xy = {
    x: endNode.x,
    y: endNode.y + endNode.h / 2,
  };
  return {start, adjStart: intermediatePoint(start, end, 16), end};
}

export function bottomCenter(r: rect): xy {
  return {
    x: r.x + r.w / 2,
    y: r.y + r.h,
  };
}

export function topCenter(r: rect): xy {
  return {
    x: r.x + r.w / 2,
    y: r.y,
  };
}
