"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Newspaper, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModeToggle } from "./mode-toggle";
import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import LogoutButton from "./LogoutButton";
import { Button } from "./ui/button";

export default function Navigation() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check user auth status
    const checkUserAuth = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
    };

    checkUserAuth();
  }, []);

  const navItems = [
    {
      href: "/",
      label: "Trends",
      description: "Live Google feed",
      icon: TrendingUp,
      active:
        pathname === "/" ||
        pathname.startsWith("/trends") ||
        pathname.startsWith("/trends/"),
    },
    {
      href: "/articles",
      label: "Dispatches",
      description: "Daily Oddities blog",
      icon: Newspaper,
      active: pathname === "/articles" || pathname.startsWith("/articles"),
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-20 flex-wrap items-center gap-4 py-2">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-full border bg-card/90 px-4 py-2 text-left transition hover:border-primary/50"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Compass className="h-5 w-5" />
          </span>
          <span className="flex flex-col">
            <span className="text-base font-semibold leading-tight">
              Daily Oddities
            </span>
            <span className="text-xs text-muted-foreground">
              Trends → Drafts → Facebook
            </span>
          </span>
        </Link>

        <nav
          className="flex flex-1 flex-wrap items-center justify-start gap-2"
          aria-label="Primary"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex flex-col rounded-2xl border px-4 py-2 transition hover:border-primary/40",
                item.active
                  ? "border-primary/60 bg-primary/5 text-foreground"
                  : "border-transparent text-muted-foreground"
              )}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <item.icon className="h-4 w-4" />
                {item.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {item.description}
              </span>
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            asChild
            variant="secondary"
            className="hidden text-sm font-semibold md:inline-flex"
          >
            <Link href="/articles">Open dispatches</Link>
          </Button>
          {isLoggedIn && <LogoutButton />}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
