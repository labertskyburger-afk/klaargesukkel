import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Klaargesukkel — Smart enough to keep it simple.",
  description:
    "Smart enough to keep it simple. Small, sharp digital solutions for everyday hassles — for people, organizations, and businesses.",
  metadataBase: new URL("https://klaargesukkel.com"),
  openGraph: {
    title: "Klaargesukkel",
    description: "Klaar met sukkel. Smart enough to keep it simple.",
    url: "https://klaargesukkel.com",
    siteName: "Klaargesukkel",
    locale: "en_ZA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-sand text-ink antialiased">{children}</body>
    </html>
  );
}
