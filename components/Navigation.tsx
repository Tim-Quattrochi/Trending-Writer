"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, LayoutDashboard, Newspaper } from "lucide-react";
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
    const checkUserAuth = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
    };

    checkUserAuth();
  }, []);

  const navItems = [
    {
      href: "/articles",
      label: "Dispatches",
      description: "Daily Oddities blog",
      icon: Newspaper,
      active: pathname === "/articles" || pathname.startsWith("/articles"),
      requiresAuth: false,
    },
    {
      href: "/dashboard",
      label: "Dashboard",
      description: "Manage trends",
      icon: LayoutDashboard,
      active: pathname === "/dashboard" || pathname.startsWith("/dashboard"),
      requiresAuth: true,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        {/* Logo / Brand */}
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-2.5 rounded-2xl border bg-card/95 px-3 py-2 shadow-sm transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary lg:h-10 lg:w-10">
            <Compass className="h-4 w-4 lg:h-5 lg:w-5" aria-hidden="true" />
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-semibold leading-tight lg:text-base">
              Daily Oddities
            </span>
            <span className="text-[11px] text-muted-foreground lg:text-xs">
              Trends → Drafts → Facebook
            </span>
          </span>
        </Link>

        {/* Primary Navigation */}
        <nav
          className="flex flex-wrap gap-2 lg:flex-1 lg:justify-center"
          aria-label="Primary navigation"
          role="navigation"
        >
          {navItems
            .filter((item) => !item.requiresAuth || isLoggedIn)
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "flex min-w-0 flex-1 flex-col rounded-xl border px-3 py-2 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 lg:flex-none lg:px-4",
                  item.active
                    ? "border-primary/60 bg-primary/5 text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-1.5 text-xs font-semibold lg:text-sm">
                  <item.icon
                    className="h-3.5 w-3.5 lg:h-4 lg:w-4"
                    aria-hidden="true"
                  />
                  {item.label}
                </span>
                <span className="hidden text-[11px] text-muted-foreground lg:block lg:text-xs">
                  {item.description}
                </span>
              </Link>
            ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 lg:justify-end">
          {!isLoggedIn ? (
            <Button
              asChild
              variant="default"
              size="sm"
              className="text-xs font-semibold lg:text-sm"
            >
              <Link href="/login">Sign in</Link>
            </Button>
          ) : (
            <LogoutButton />
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
