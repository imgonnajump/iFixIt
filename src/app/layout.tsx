import type { Metadata, Viewport } from "next";
import { Nunito, Silkscreen } from "next/font/google";
import "./globals.css";

const body = Nunito({ variable: "--font-body", subsets: ["latin"] });
const pixel = Silkscreen({ variable: "--font-pixel", weight: ["400", "700"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FixCam: fix it yourself",
  description: "Walk through your pixel home, snap the broken thing, and get coached through the repair.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e7e1d3" },
    { media: "(prefers-color-scheme: dark)", color: "#141210" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${body.variable} ${pixel.variable} antialiased`}>{children}</body>
    </html>
  );
}
