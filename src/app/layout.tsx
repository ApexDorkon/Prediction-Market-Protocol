import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import ReduxProvider from "@/components/providers/ReduxProvider";
import { Providers } from "./providers";
import { ToastProvider } from "@/components/toast/ToastContext";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Prediction Market Protocol",
  description: "A decentralized event-forecasting and binary options protocol.",
  icons: {
    icon: "/favicon.png", // Ensure you have a generic favicon in /public
  },
  openGraph: {
    title: "Prediction Market Protocol",
    description: "On-chain prediction markets with NFT-based positioning.",
    url: "https://your-portfolio-link.com",
    siteName: "DEX Forecast",
    images: [
      {
        url: "/og-image.png", // Generic social sharing image
        width: 1200,
        height: 630,
        alt: "Protocol Preview",
      },
    ],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0a] text-gray-200`}
      >
        <ReduxProvider>
          <Providers>
            <ToastProvider>
              <Header />
              <main className="min-h-screen">
                {children}
              </main>
            </ToastProvider>
          </Providers>
        </ReduxProvider>
      </body>
    </html>
  );
}