"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  DatabaseZap,
  Download,
  FileUp,
  LayoutDashboard,
  LayoutPanelTop,
  LogOut,
  Menu,
  Newspaper,
  ShoppingBasket,
  TicketPercent,
  UserRoundPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ModeToggle } from "../ui-mode-toggle";
import Image from "next/image";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile screen on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const logoutMutation = useMutation({
    mutationFn: async () => api.post("auth/logout"),
    onSuccess: () => {
      queryClient.clear();
      toast("Logged out");
      router.push("/login");
    },
  });

  const links = [
    {
      title: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["USER", "ADMIN"],
    },
    {
      title: "Dashboard FCR",
      href: "/dashboard-fcr",
      icon: LayoutPanelTop,
      roles: ["USER", "ADMIN"],
    },
    {
      title: "Ticket Breakdown Channel",
      href: "/breakdown-channel",
      icon: TicketPercent,
      roles: ["USER", "ADMIN"],
    },
    {
      title: "Corporate Detail",
      href: "/corporate-detail",
      icon: Building2,
      roles: ["USER", "ADMIN"],
    },
    {
      title: "Product Detail",
      href: "/product-detail",
      icon: ShoppingBasket,
      roles: ["USER", "ADMIN"],
    },
    {
      title: "Upload Report",
      href: "/upload",
      icon: FileUp,
      roles: ["ADMIN"],
    },
    {
      title: "Download Raw Data",
      href: "/download",
      icon: Download,
      roles: ["ADMIN"],
    },
    {
      title: "Create User Account",
      href: "/register",
      icon: UserRoundPlus,
      roles: ["ADMIN"],
    },
    {
      title: "Berita dan Informasi",
      href: "/news",
      icon: Newspaper,
      roles: ["USER", "ADMIN"],
    },
    {
      title: "Lookup Management",
      href: "/lookup-management",
      icon: DatabaseZap,
      roles: ["ADMIN"],
    },
  ];

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          // --- Base Styles ---
          "flex flex-col justify-between bg-gray-50/95 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60 dark:bg-gray-900/95 border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out z-50 overflow-hidden",

          // --- Mobile Styles (Default) ---
          // Position: Fixed at top
          "fixed top-0 left-0 right-0 w-full border-b",
          // Height: toggles between slim header (16) and full screen (screen)
          isCollapsed ? "h-16" : "h-screen bottom-0",

          // --- Desktop Styles (md:) ---
          // Position: Relative (pushes content), Vertical, Full Height
          "md:relative md:h-screen md:border-r md:border-b-0 md:bottom-auto",
          // Width: toggles between 16 (icon only) and 64 (expanded)
          isCollapsed ? "md:w-16" : "md:w-64",
        )}
      >
        {/* Top Section: Toggle & Nav */}
        <div className="flex flex-col">
          {/* Header / Logo Area */}
          {/* On mobile this is the horizontal bar. On desktop it's the top of the sidebar. */}
          <div
            className={cn(
              "flex items-center h-16 shrink-0",
              // Center content if collapsed on desktop, otherwise standard spacing
              isCollapsed
                ? "md:justify-center px-4"
                : "justify-start px-6 gap-4",
            )}
          >
            {/* Burger Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0" // prevent squishing
              onClick={toggleSidebar}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>

            {/* Logo / Title */}
            {/* Logic: Visible if expanded OR if we are on mobile (so the top bar has a title) */}
            <div
              className={cn(
                "transition-all duration-300 overflow-hidden whitespace-nowrap",
                isCollapsed && !isMobile
                  ? "w-0 opacity-0"
                  : "w-auto opacity-100 ml-2",
              )}
            >
            <div className="flex justify-start gap-1">
                    <Image
                      src="/ces247-3.svg"
                      alt="Cesia logo"
                      width={8}
                      height={8}
                      className="h-7 w-7 object-contain"
                      priority
                    />
              <h2 className="text-lg font-semibold tracking-tight">CESIA</h2>
                  </div>
            </div>
          </div>

          {/* User Welcome Message */}
          {(!isCollapsed || isMobile) && (
            <div
              className={cn(
                "px-6 pb-2 text-xs text-muted-foreground truncate transition-all duration-300",
                // Hide on mobile when collapsed to keep the bar slim
                isMobile && isCollapsed ? "hidden" : "block",
              )}
            >
              Welcome, {user?.name}
            </div>
          )}

          {/* Navigation Links */}
          <nav
            className={cn(
              "space-y-2 px-2 mt-2 flex flex-col overflow-y-auto",
              // Hide nav items completely on mobile when collapsed
              isMobile && isCollapsed ? "hidden" : "flex",
            )}
          >
            {links.map((link) => {
              if (user && !link.roles.includes(user.role)) return null;
              const Icon = link.icon;
              const isActive = pathname === link.href;

              // Render Icon-only Tooltip (Desktop Collapsed)
              if (isCollapsed && !isMobile) {
                return (
                  <Tooltip key={link.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={link.href}
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground mx-auto",
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="sr-only">{link.title}</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{link.title}</TooltipContent>
                  </Tooltip>
                );
              }

              // Render Full Link (Mobile or Desktop Expanded)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground",
                  )}
                  onClick={() => isMobile && setIsCollapsed(true)} // Close menu on click (Mobile only)
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {link.title}
                </Link>
              );
            })}
          </nav>
        </div>


        {/* Footer / Logout */}
        <div
          className={cn(
            "p-2 border-t md:border-t-0",
            isMobile && isCollapsed ? "hidden" : "block",
          )}
        >
        <div className={cn("w-full flex mb-2", isCollapsed ? "justify-center" : "")}>
                <ModeToggle />

        </div>
          {isCollapsed && !isMobile ? (
            <Tooltip>
              <TooltipTrigger asChild>
              
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 mx-auto flex justify-center text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Logout</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
