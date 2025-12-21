import {Canvg, presets} from "canvg";

const preset = presets.offscreen();

export async function toPng({width, height, svg}: {width: number, height: number, svg: SVGSVGElement}) {
  console.log("svg", svg);
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const v = await Canvg.from(ctx!, svg.outerHTML, preset);
  await v.render(); // Render only first frame, ignoring animations and mouse.
  const blob = await canvas.convertToBlob();
  const pngUrl = URL.createObjectURL(blob);
  return pngUrl;
}
