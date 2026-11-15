"use client";

import { ICONS, ICON_PALETTE, type IconName } from "@/lib/pixel/icons";

// Renders a pixel icon as crisp inline SVG (one rect per pixel). Decorative by default.
export function PixelIcon({ name, size = 18, label, className = "" }: { name: IconName; size?: number; label?: string; className?: string }) {
  const rows = ICONS[name];
  const rects: React.ReactNode[] = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const fill = ICON_PALETTE[row[x]];
      if (fill) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={fill} />);
    }
  });
  return (
    <svg
      viewBox="0 0 9 9"
      width={size}
      height={size}
      className={`inline-block shrink-0 ${className}`}
      shapeRendering="crispEdges"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {rects}
    </svg>
  );
}
