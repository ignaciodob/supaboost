import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Supaboost – Give your teammates a boost!",
  description: "Give your teammates a quiet confidence boost by answering fun, anonymous prompts – and discover when the love comes back your way.",
  openGraph: {
    title: "Supaboost – Give your teammates a boost!",
    description: "Give your teammates a quiet confidence boost by answering fun, anonymous prompts – and discover when the love comes back your way.",
    url: "https://supaboost.vercel.app",
    siteName: "Supaboost",
    images: [
      {
        url: "/og_image.jpg",
        width: 1200,
        height: 630,
        alt: "Supaboost preview image",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Supaboost – Give your teammates a boost!",
    description: "Give your teammates a quiet confidence boost by answering fun, anonymous prompts – and discover when the love comes back your way.",
    images: ["/og_image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
