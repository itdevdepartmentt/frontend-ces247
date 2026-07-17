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
  ClipboardList,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
      roles: ["USER", "ADMIN", "QC", "TL_QC", "TL"],
    },
    {
      title: "Dashboard FCR",
      href: "/dashboard-fcr",
      icon: LayoutPanelTop,
      roles: ["USER", "ADMIN", "QC", "TL_QC", "TL"],
    },
    {
      title: "Ticket Breakdown Channel",
      href: "/breakdown-channel",
      icon: TicketPercent,
      roles: ["USER", "ADMIN", "QC", "TL_QC", "TL"],
    },
    {
      title: "Corporate Detail",
      href: "/corporate-detail",
      icon: Building2,
      roles: ["USER", "ADMIN", "QC", "TL_QC", "TL"],
    },
    {
      title: "Product Detail",
      href: "/product-detail",
      icon: ShoppingBasket,
      roles: ["USER", "ADMIN", "QC", "TL_QC", "TL"],
    },
    {
      title: "Upload Report",
      href: "/upload",
      icon: FileUp,
      roles: ["ADMIN", "QC", "TL_QC", "TL"],
    },
    {
      title: "Download Raw Data",
      href: "/download",
      icon: Download,
      roles: ["ADMIN", "QC", "TL_QC", "TL"],
    },
    {
      title: "Account Management",
      href: "/accounts",
      icon: UserRoundPlus,
      roles: ["ADMIN", "QC", "TL_QC", "TL"],
    },
    {
      title: "BISA",
      href: "/news",
      icon: Newspaper,
      roles: ["USER", "ADMIN", "QC", "TL_QC", "TL"],
    },
    {
      title: "Lookup Management",
      href: "/lookup-management",
      icon: DatabaseZap,
      roles: ["ADMIN", "QC", "TL_QC", "TL"],
    },
    {
      title: "Survey Management",
      href: "/survey-management",
      icon: ClipboardList,
      roles: ["ADMIN", "USER", "QC", "TL_QC", "TL"],
    },
    {
      title: "Quality Assurance",
      href: "#",
      icon: ShieldCheck,
      roles: ["USER", "ADMIN", "QC", "TL_QC", "TL"],
      subItems: [
        { title: "QA Score", href: "/quality-assurance/qa-score", roles: ["USER", "ADMIN", "QC", "TL_QC", "TL"] },
        { title: "Detail Tapping", href: "/quality-assurance/detail-tapping", roles: ["ADMIN", "QC", "TL_QC", "TL"] },
        { title: "Form Tapping", href: "/quality-assurance/form-tapping", roles: ["ADMIN", "QC", "TL_QC"] },
        { title: "Rekonsiliasi QA", href: "/quality-assurance/reconciliation", roles: ["ADMIN", "QC", "TL_QC", "TL"] },
        { title: "Productivity QC", href: "/quality-assurance/productivity-qc", roles: ["ADMIN", "QC", "TL_QC"] },
      ]
    },
  ];

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

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
              
              // Custom restriction: Hide QA menu for specific email
              if (user && link.title === "Quality Assurance" && user.email === "TselPrime@gmail.com") return null;
              
              // Filter subItems based on user roles
              const subItems = link.subItems?.filter(sub => user && sub.roles.includes(user.role)) || [];
              const hasSubItems = subItems.length > 0;
              
              const Icon = link.icon;
              const isActive = pathname === link.href || subItems.some(sub => pathname.startsWith(sub.href));
              const isOpen = openMenus[link.title] !== undefined ? openMenus[link.title] : isActive;
              
              // Render Icon-only Tooltip (Desktop Collapsed)
              if (isCollapsed && !isMobile) {
                return hasSubItems ? (
                  <DropdownMenu key={link.title}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground mx-auto",
                              isActive
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="sr-only">{link.title}</span>
                          </button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <div className="font-semibold">{link.title}</div>
                      </TooltipContent>
                    </Tooltip>
                    
                    <DropdownMenuContent side="right" align="start" className="w-48 ml-2">
                      {subItems.map((sub) => (
                        <DropdownMenuItem key={sub.title} asChild>
                          <Link href={sub.href} className="w-full cursor-pointer">
                            {sub.title}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Tooltip key={link.title}>
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
                    <TooltipContent side="right">
                      <div className="font-semibold">{link.title}</div>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              // Render Full Link (Mobile or Desktop Expanded)
              return (
                <div key={link.title} className="space-y-1">
                  {hasSubItems ? (
                    <button
                      onClick={() => setOpenMenus(prev => ({ ...prev, [link.title]: !isOpen }))}
                      className={cn(
                        "w-full flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                        isActive && !isOpen
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      <div className="flex items-center">
                        <Icon className="mr-2 h-4 w-4" />
                        {link.title}
                      </div>
                      <div className="ml-auto flex items-center transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                         <ChevronDown className="h-4 w-4" />
                      </div>
                    </button>
                  ) : (
                    <Link
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
                  )}
                  {hasSubItems && (
                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-300 ease-in-out",
                        isOpen ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
                      )}
                    >
                      <div className="flex flex-col space-y-1 ml-6 border-l pl-2 border-border/50 py-1">
                        {subItems.map((subItem) => (
                           <Link
                             key={subItem.href}
                             href={subItem.href}
                             className={cn(
                               "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all duration-200",
                               pathname === subItem.href
                                 ? "bg-accent text-accent-foreground shadow-sm"
                                 : "text-muted-foreground",
                             )}
                             onClick={() => isMobile && setIsCollapsed(true)}
                           >
                             {subItem.title}
                           </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
