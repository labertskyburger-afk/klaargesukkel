import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Get It Sorted | Trusted Local Services in Cape Town",
  description:
    "Tell us what needs sorting. We connect you with suitable local service providers and follow through to confirm the problem was resolved. Free introductions with no paid leads or hidden commission.",
  metadataBase: new URL("https://klaargesukkel.com"),
  openGraph: {
    title: "Get It Sorted",
    description: "The right help. From the right people. Followed through.",
    url: "https://klaargesukkel.com",
    siteName: "Get It Sorted",
    locale: "en_ZA",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#12232E",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-sand text-ink antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
