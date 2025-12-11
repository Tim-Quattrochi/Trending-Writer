"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Compass, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModeToggle } from "./mode-toggle";
import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import LogoutButton from "./LogoutButton";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { DEFAULT_CATEGORY_SLUG } from "@/lib/article-helpers";

interface CategoryLink {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  is_active?: boolean | null;
}

export default function Navigation() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [categoryLinks, setCategoryLinks] = useState<CategoryLink[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkUserAuth = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
    };

    checkUserAuth();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const response = await fetch("/api/categories?sortBy=updated_at&sortOrder=desc");
        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        if (!isMounted || !payload?.items) {
          return;
        }

        const filtered = (payload.items as CategoryLink[])
          .filter((category) => category.slug && category.is_active !== false)
          .slice(0, 6);

        setCategoryLinks(filtered);
      } catch (error) {
        console.error("Failed to load categories for navigation:", error);
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const navLinks = [
    { href: "/articles", label: "Stories" },
    ...(isLoggedIn ? [{ href: "/dashboard", label: "Dashboard" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Compass className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-semibold tracking-tight">Daily Oddities</span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Main navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                pathname === link.href || pathname.startsWith(link.href + "/")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}

          {/* Categories Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith("/trends")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                Categories
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56">
              {categoryLinks.length === 0 && !isLoadingCategories ? (
                <DropdownMenuItem asChild>
                  <Link href={`/trends/${DEFAULT_CATEGORY_SLUG}`}>
                    All Stories
                  </Link>
                </DropdownMenuItem>
              ) : (
                categoryLinks.map((category) => (
                  <DropdownMenuItem asChild key={category.id}>
                    <Link href={`/trends/${category.slug}`}>
                      {category.name}
                    </Link>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/articles" className="text-primary">
                  View all stories →
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ModeToggle />
          
          {/* Desktop Auth */}
          <div className="hidden md:block">
            {!isLoggedIn ? (
              <Button asChild size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
            ) : (
              <LogoutButton />
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}

            {/* Categories in Mobile */}
            <div className="border-t pt-2 mt-2">
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Categories
              </p>
              {categoryLinks.slice(0, 4).map((category) => (
                <Link
                  key={category.id}
                  href={`/trends/${category.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {category.name}
                </Link>
              ))}
            </div>

            {/* Mobile Auth */}
            <div className="border-t pt-4 mt-2">
              {!isLoggedIn ? (
                <Button asChild className="w-full">
                  <Link href="/login">Sign in</Link>
                </Button>
              ) : (
                <LogoutButton />
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
