"use client";

import { useEffect, useRef } from "react";
import { drawAvatar, type Dir } from "@/lib/pixel/avatar";
import type { Avatar } from "@/lib/profile";

// The user's avatar, drawn crisp at any size.
export function PixelAvatar({ avatar, size = 96, dir = "down", label }: { avatar: Avatar; size?: number; dir?: Dir; label?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, 20, 20);
    drawAvatar(ctx, avatar, 2, 3, dir, 0);
  }, [avatar, dir]);
  return (
    <canvas
      ref={ref}
      width={20}
      height={20}
      className="pixelated"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? "Your pixel avatar"}
    />
  );
}
