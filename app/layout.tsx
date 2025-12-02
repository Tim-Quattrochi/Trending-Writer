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
  title: "Daily Oddities Dispatch",
  description:
    "A modern chronicle of quirky, strange, and humorous stories sourced from the Daily Oddities community and Google Trends.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${newsreader.variable} ${spaceGrotesk.variable} antialiased bg-muted`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative min-h-screen bg-background text-foreground">
            <div className="pointer-events-none absolute inset-0 opacity-60">
              <div className="absolute inset-0 bg-gradient-to-b from-[#fff8ed] via-background to-muted" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_65%)]" />
            </div>
            <div className="relative z-10 flex min-h-screen flex-col">
              <Navigation />
              <main className="flex-1 pb-20">{children}</main>
              <footer className="border-t bg-background/80 backdrop-blur">
                <div className="container flex flex-col gap-3 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
                  <p className="font-semibold tracking-wide text-foreground">
                    Daily Oddities · Curious signals from the social ether
                  </p>
                  <p>
                    Built with Google Trends, Supabase, and a pinch of Daily
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
