import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Omakase.ai - Voice AI Agent for E-commerce | Boost Sales 24/7",
  description: "Boost sales with a Voice AI Agent built for your store. Turn website visitors into customers with AI-powered voice conversations. Answer questions, recommend products, and close sales 24/7.",
  keywords: ["AI agent", "voice AI", "e-commerce", "Shopify", "customer service", "sales automation", "chatbot"],
  openGraph: {
    title: "Omakase.ai - Voice AI Agent for E-commerce",
    description: "Boost sales with a Voice AI Agent built for your store. 15,000+ AI agents launched.",
    url: "https://omakase.ai",
    siteName: "Omakase.ai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Omakase.ai - Voice AI Agent for E-commerce",
    description: "Boost sales with a Voice AI Agent built for your store.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${montserrat.variable} font-sans antialiased bg-black text-white`}
      >
        {children}
      </body>
    </html>
  );
}
