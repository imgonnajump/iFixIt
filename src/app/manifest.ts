import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FixCam: fix it yourself",
    short_name: "FixCam",
    description: "Snap a photo of anything broken. Get the part name, cost, tools, and a step-by-step fix with a repair coach.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f5",
    theme_color: "#ea580c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
