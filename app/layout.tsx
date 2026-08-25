import type { Metadata } from "next";
import "./globals.css";
import "./chatbot.css";
import Chatbot from "./chatbot";

export const metadata: Metadata = {
  title: "Arch Engineering Services | Engineering, Automation & Software",
  description: "St. Louis mechanical CAD, Autodesk Inventor iLogic automation, and custom software services for manufacturers.",
  icons: { icon: "/favicon.png", shortcut: "/favicon.png", apple: "/favicon.png" },
  openGraph: {
    title: "Arch Engineering Services",
    description: "Engineering. Automation. Software.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Arch Engineering Services — Engineering. Automation. Software." }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Arch Engineering Services",
    description: "Engineering. Automation. Software.",
    images: ["/og.png"]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}<Chatbot /></body></html>;
}
