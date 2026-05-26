import type { Metadata } from "next";
import { ThemeProvider } from "@ovr/ui/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Open Visual Regression",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
