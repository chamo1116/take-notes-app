import type { Metadata } from "next";
import { Inria_Serif, Inter } from "next/font/google";
import "./globals.css";

const inriaSerif = Inria_Serif({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-inria-serif",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Notes",
  description: "A cozy place to keep your notes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inriaSerif.variable} ${inter.variable}`}>
      <body className="font-inter">{children}</body>
    </html>
  );
}
