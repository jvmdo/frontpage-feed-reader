import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { HotkeysProvider } from "@/components/providers/hotkeys-provider";
import HydrationFlagProvider from "@/components/providers/hydration-flag-provider";
import { ReactQueryClientProvider } from "@/components/providers/query-client-provider";
import { ServerTimeProvider } from "@/components/providers/server-time-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { settings } from "@/env";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(settings.baseUrl),
  title: {
    default: "Frontpage | Your personalized front page for tech content",
    template: "%s | Frontpage",
  },
  description:
    "A customizable content aggregator for developers and designers. Keep up with your favorite blogs, newsletters, and changelogs in one clean, editorial-style interface.",
  openGraph: {
    title: "Frontpage",
    description:
      "A customizable content aggregator for developers and designers. Keep up with your favorite blogs, newsletters, and changelogs in one clean, editorial-style interface.",
    url: "/",
    siteName: "Frontpage",
    images: [
      {
        url: "/screenshot.png",
        width: 1200,
        height: 630,
        alt: "Frontpage Screenshot",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Frontpage | Your personalized front page for tech content",
    description:
      "A customizable content aggregator for developers and designers. Keep up with your favorite blogs, newsletters, and changelogs in one clean, editorial-style interface.",
    images: ["/screenshot.png"],
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning={true}
      className={cn(
        "h-full",
        "antialiased",
        jetBrainsMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
        >
          <ReactQueryClientProvider>
            <NuqsAdapter>
              <ServerTimeProvider serverNow={new Date().toISOString()}>
                <TooltipProvider>
                  <HotkeysProvider>
                    <HydrationFlagProvider>{children}</HydrationFlagProvider>
                  </HotkeysProvider>
                </TooltipProvider>
              </ServerTimeProvider>
            </NuqsAdapter>
          </ReactQueryClientProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
