import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CookieConsentBanner from "@/app/components/CookieConsentBanner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Ultimate Influencer™",
  description: "The Premium Preventive Parenting Platform — training parents to lead with intention.",
  icons: {
    icon: "/image/logo-vertical.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-full flex flex-col">
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
