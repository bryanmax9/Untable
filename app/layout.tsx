import type { Metadata } from "next";
import "./globals.css";

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
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>{children}</body>
    </html>
  );
}
