import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { LangToggle } from "@/components/LangToggle";

export const metadata: Metadata = {
  title: "Sheetshift — Excel to App",
  description: "Convert any Excel file into a domain-specific internal web app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        {children}
        <LangToggle />
        <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />
      </body>
    </html>
  );
}
