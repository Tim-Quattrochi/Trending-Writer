"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Newspaper, TrendingUp, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModeToggle } from "./mode-toggle";
import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import LogoutButton from "./LogoutButton";

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
      icon: TrendingUp,
      active:
        pathname === "/" ||
        pathname.startsWith("/trends") ||
        pathname.startsWith("/trends/"),
    },
    {
      href: "/articles",
      label: "Articles",
      icon: Newspaper,
      active:
        pathname === "/articles" || pathname.startsWith("/articles"),
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link className="flex items-center gap-2" href="/">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block text-xl">
              Trending Writer
            </span>
          </Link>
        </div>
        <nav className="flex items-center gap-1 md:gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                item.active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4 mr-2" />
              {item.label}
            </Link>
          ))}
          <div className="flex items-center gap-2 ml-2">
            {isLoggedIn && <LogoutButton />}
            <ModeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
