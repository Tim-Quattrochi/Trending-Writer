import type { Metadata } from "next";
import { Newsreader, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-editorial",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Daily Oddities",
  description:
    "A modern chronicle of quirky, strange, and humorous stories sourced from the Daily Oddities community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${newsreader.variable} ${spaceGrotesk.variable} min-h-screen bg-muted antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col bg-background text-foreground">
            {/* Decorative background */}
            <div
              className="pointer-events-none absolute inset-0 opacity-60"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[#fff8ed] via-background to-muted" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_65%)]" />
            </div>

            {/* Content wrapper */}
            <div className="relative z-10 flex min-h-screen flex-col">
              <Navigation />

              {/* Main content with consistent mobile-first spacing */}
              <main className="flex-1 px-4 py-6 lg:px-6 lg:py-10">
                {children}
              </main>

              {/* Footer */}
              <footer className="mt-auto border-t bg-background/80 backdrop-blur-sm">
                <div className="container mx-auto flex flex-col gap-2 px-4 py-6 text-xs text-muted-foreground lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:py-8 lg:text-sm">
                  <p className="font-semibold tracking-wide text-foreground">
                    Daily Oddities · Curious signals from the social ether
                  </p>
                  <p>
                    Built with Supabase, modern AI helpers, and a pinch of Daily
                    Oddities humor.
                  </p>
                </div>
              </footer>

              <Toaster />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
