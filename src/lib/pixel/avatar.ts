import type { Avatar } from "../profile";

export type Dir = "down" | "up" | "left" | "right";

const OUT = "#2a2520";

function r(ctx: CanvasRenderingContext2D, c: string, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

// Draws a 16x16 chibi character at (x, y). frame 0/1 alternates legs while walking.
export function drawAvatar(ctx: CanvasRenderingContext2D, a: Avatar, x: number, y: number, dir: Dir = "down", frame = 0) {
  const { skin, shirt, hairColor: hc } = a;
  const side = dir === "left" || dir === "right";
  const flip = dir === "left";
  const X = (px: number, w = 1) => (flip ? x + 16 - px - w : x + px);

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(x + 3, y + 14, 10, 2);

  // legs
  const legA = frame === 1 ? 1 : 0;
  const legB = frame === 1 ? 0 : 1;
  r(ctx, "#33334d", x + 5, y + 12 + legA, 2, 3 - legA);
  r(ctx, "#33334d", x + 9, y + 12 + legB, 2, 3 - legB);

  // body
  r(ctx, OUT, x + 3, y + 8, 10, 6);
  r(ctx, shirt, x + 4, y + 9, 8, 4);
  // arms
  if (side) {
    r(ctx, skin, X(frame ? 9 : 7), y + 10, 2, 3);
  } else {
    r(ctx, skin, x + 3, y + 10, 1, 3);
    r(ctx, skin, x + 12, y + 10, 1, 3);
  }
  if (!side && dir === "down") r(ctx, "rgba(255,255,255,0.35)", x + 7, y + 10, 2, 2); // shirt detail

  // head
  r(ctx, OUT, x + 2, y, 12, 10);
  r(ctx, skin, x + 3, y + 1, 10, 8);

  // hair
  const hairTop = () => r(ctx, hc, x + 3, y + 1, 10, 3);
  if (dir === "up") {
    r(ctx, hc, x + 3, y + 1, 10, 8);
  } else {
    hairTop();
    if (side) r(ctx, hc, X(9, 4), y + 1, 4, a.hair === "long" ? 8 : 6);
  }
  if (!side && dir === "down") {
    if (a.hair === "bob") {
      r(ctx, hc, x + 3, y + 4, 2, 4);
      r(ctx, hc, x + 11, y + 4, 2, 4);
    }
    if (a.hair === "long") {
      r(ctx, hc, x + 2, y + 4, 2, 7);
      r(ctx, hc, x + 12, y + 4, 2, 7);
    }
  }
  if (dir === "up" && a.hair === "long") r(ctx, hc, x + 3, y + 8, 10, 3);
  if (a.hair === "spiky") {
    r(ctx, OUT, x + 3, y - 1, 2, 1);
    r(ctx, hc, x + 4, y - 1, 1, 2);
    r(ctx, hc, x + 7, y - 2, 2, 3);
    r(ctx, hc, x + 11, y - 1, 1, 2);
  }
  if (a.hair === "bun") {
    r(ctx, OUT, x + 6, y - 3, 4, 3);
    r(ctx, hc, x + 7, y - 2, 2, 2);
  }

  // face
  if (dir === "down") {
    r(ctx, OUT, x + 5, y + 5, 1, 2);
    r(ctx, OUT, x + 10, y + 5, 1, 2);
    r(ctx, "#f2a0a0", x + 4, y + 7, 2, 1);
    r(ctx, "#f2a0a0", x + 10, y + 7, 2, 1);
    r(ctx, OUT, x + 7, y + 7, 2, 1);
  } else if (side) {
    r(ctx, OUT, X(5), y + 5, 1, 2);
    r(ctx, "#f2a0a0", X(4, 2), y + 7, 2, 1);
  }

  // hats
  if (a.hat === "cap") {
    r(ctx, OUT, x + 2, y - 1, 12, 4);
    r(ctx, shirt, x + 3, y, 10, 2);
    if (dir === "down") r(ctx, shirt, x + 3, y + 3, 10, 1);
    if (side) r(ctx, shirt, X(0, 4), y + 2, 4, 1);
  } else if (a.hat === "beanie") {
    r(ctx, OUT, x + 2, y - 2, 12, 5);
    r(ctx, "#d6336c", x + 3, y - 1, 10, 3);
    r(ctx, "#f783ac", x + 3, y + 1, 10, 1);
    r(ctx, "#f783ac", x + 7, y - 3, 2, 1);
  } else if (a.hat === "hardhat") {
    r(ctx, OUT, x + 1, y - 2, 14, 5);
    r(ctx, "#fab005", x + 2, y - 1, 12, 3);
    r(ctx, "#ffd43b", x + 5, y - 1, 3, 1);
    r(ctx, "#e67700", x + 1, y + 2, 14, 1);
  }
}
