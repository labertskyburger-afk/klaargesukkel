import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Klaargesukkel — Admin",
  robots: { index: false, follow: false },
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
