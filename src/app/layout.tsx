import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers/theme-provider";

export const metadata: Metadata = {
  title: "EduNexus Terminal",
  description: "Secure Institutional Registry Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}