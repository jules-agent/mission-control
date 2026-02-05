import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono"
});

export const metadata: Metadata = {
  title: "Mission Control Dashboard",
  description: "Status telemetry and mission task control."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={spaceMono.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
