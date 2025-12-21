function* wrapLinesGen(str: string, width: number): Generator<string> {
  const words = str.split(" ");
  let line = "";
  for (const [i, word] of words.entries()) {
    if (line.length + word.length > width) {
      yield line;
      line = "";
    }
    line += word + " ";
    if (i === words.length - 1) {
      yield line;
    }
  }
}

// break string into lines on word boundaries
export function wrapLines(str: string, width: number): string[] {
  return Array.from(wrapLinesGen(str, width));
}

export function computeResizeTransform(
  gNode: SVGGraphicsElement,
  container: { clientWidth: number, clientHeight: number },
  padX: number,
  padY: number,
): string {
  const bbox = gNode.getBBox({stroke: true, fill: true, markers: true});
  const boundingWidth = bbox.width + padX;
  const boundingHeight = bbox.height + padY;

  console.log("bounding h w: ", boundingHeight, boundingWidth);
  const {clientWidth: containerWidth, clientHeight: containerHeight} = container;
  console.log("container h w: ", containerHeight, containerWidth);

  // Calculate applicable scale for zoom
  const zoomScale = 100 / Math.max(boundingWidth, boundingHeight);
  return `scale(${zoomScale},${zoomScale})`;
}
