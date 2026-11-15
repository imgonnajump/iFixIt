// Client-side image helpers.

export type Prepared = {
  data: string; // base64 JPEG, clean (for diagnosis)
  grid: string; // base64 JPEG with a labeled 10% grid (for locating things precisely)
  preview: string; // data URL for display
  aspect: number; // width / height
};

const MAX_EDGE = 1568;

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const fs = Math.max(11, Math.round(Math.min(w, h) * 0.028));
  ctx.font = `bold ${fs}px sans-serif`;
  ctx.textBaseline = "top";
  const line = (x1: number, y1: number, x2: number, y2: number) => {
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1;
    ctx.stroke();
  };
  const tag = (text: string, x: number, y: number) => {
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(x - 1, y, tw + 4, fs + 3);
    ctx.fillStyle = "#fff";
    ctx.fillText(text, x + 1, y + 1);
  };
  for (let i = 1; i < 10; i++) {
    const x = Math.round((w * i) / 10);
    const y = Math.round((h * i) / 10);
    line(x, 0, x, h);
    line(0, y, w, y);
  }
  for (let i = 1; i < 10; i++) {
    const x = Math.round((w * i) / 10);
    const y = Math.round((h * i) / 10);
    const t = String(i * 10);
    tag(t, x + 3, 2);
    tag(t, x + 3, h - fs - 5);
    tag(t, 2, y + 2);
    tag(t, w - ctx.measureText(t).width - 6, y + 2);
  }
}

// Downscale (Claude works well at ~1568px long edge) and make a gridded copy.
export async function prepareImage(file: File): Promise<Prepared> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  const preview = canvas.toDataURL("image/jpeg", 0.85);

  drawGrid(ctx, w, h);
  const gridded = canvas.toDataURL("image/jpeg", 0.85);

  return { data: preview.split(",")[1], grid: gridded.split(",")[1], preview, aspect: w / h };
}

export const GRID_NOTE =
  "A grid is drawn over the photo to help you locate things: thin lines every 10% of the width and height, labeled 10-90 at the edges. Ignore the grid otherwise.";

export type Box = { x1: number; y1: number; x2: number; y2: number }; // percent 0-100

export function cleanBox(b: Box): Box | null {
  const c = (v: number) => Math.min(100, Math.max(0, v));
  const x1 = c(Math.min(b.x1, b.x2));
  const x2 = c(Math.max(b.x1, b.x2));
  const y1 = c(Math.min(b.y1, b.y2));
  const y2 = c(Math.max(b.y1, b.y2));
  if (x2 - x1 < 0.5 || y2 - y1 < 0.5) return null;
  return { x1, y1, x2, y2 };
}
