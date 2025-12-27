export type xy = {
  x: number,
  y: number,
};

export type rect = xy & {
  w: number,
  h: number,
};

export interface Edge {
  start: xy,
  end: xy,
}

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
