import { Toaster } from "@ovr/ui/components/sonner";
import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Open Visual Regression",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
