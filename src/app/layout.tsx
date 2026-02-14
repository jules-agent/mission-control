import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ZoomControl } from "./components/ZoomControl";

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono"
});

export const metadata: Metadata = {
  title: "Mission Control Dashboard",
  description: "Status telemetry and mission task control.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={spaceMono.variable}>
      <body>
        <Providers>
          <ZoomControl />
          {children}
        </Providers>
      </body>
    </html>
  );
}
