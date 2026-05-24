import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Open Visual Regression",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="dark">{children}</body>
    </html>
  );
}
