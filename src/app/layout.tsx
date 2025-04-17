import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Use Inter from Google Fonts instead
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: "Campaign War Room",
  description: "A gamified platform for campaign volunteers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}