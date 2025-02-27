"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Home,
  Plus,
  BookOpen,
  LayoutDashboard,
  Settings,
  LogOut,
  History,
  Bell,
  Menu,
  Search,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AuthModal } from "@/components/auth/auth-modal";

// Navigation items
const mainNavItems = [
  {
    name: "Home",
    href: "/",
    icon: <Home className="h-5 w-5" />,
  },
  {
    name: "Features",
    href: "/#features",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    name: "Pricing",
    href: "/pricing",
    icon: <CreditCard className="h-5 w-5" />,
    highlight: true,
  },
];

// Dashboard navigation items for logged-in users
const dashboardNavItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    name: "Create Story",
    href: "/dashboard/create",
    icon: <Plus className="h-5 w-5" />,
    highlight: true,
  },
  {
    name: "Library",
    href: "/dashboard/library",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    name: "History",
    href: "/dashboard/history",
    icon: <History className="h-5 w-5" />,
  },
];

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const userName = session?.user?.name?.split(" ")[0] || "User";
  const userImage = session?.user?.image || "";
  
  // Show dashboard items for logged in users, main items for everyone else
  const navItems = status === "authenticated" ? dashboardNavItems : mainNavItems;
  
  const handleLoginClick = () => {
    setIsAuthModalOpen(true);
  };
  
  return (
    <header className="supports-backdrop-blur:bg-background/60 sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center px-4">
        <div className="flex items-center justify-between w-full gap-4 md:gap-8">
          {/* Logo & Mobile Menu Button */}
          <div className="flex items-center gap-2">
            <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="pr-0">
                <SheetHeader className="mb-4">
                  <SheetTitle>
                    <Link 
                      href="/" 
                      className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent"
                    >
                      Lullaby.ai
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <nav className="grid gap-2 py-6">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileNavOpen(false)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 text-lg rounded-lg transition-colors",
                        pathname === item.href
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {item.icon}
                      {item.name}
                      {item.highlight && (
                        <Badge className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white">New</Badge>
                      )}
                    </Link>
                  ))}
                  
                  {/* Conditional elements based on auth status */}
                  {status === "authenticated" && (
                    <>
                      <div className="h-px bg-border my-4" />
                      <Link
                        href="/pricing"
                        onClick={() => setIsMobileNavOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-lg rounded-lg transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
                      >
                        <CreditCard className="h-5 w-5" />
                        Pricing & Plans
                      </Link>
                    </>
                  )}

                  <div className="h-px bg-border my-4" />
                  
                  {status === "authenticated" ? (
                    <button
                      onClick={() => {
                        setIsMobileNavOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-lg rounded-lg transition-colors hover:bg-red-900/20 text-red-500"
                    >
                      <LogOut className="h-5 w-5" />
                      Log out
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsMobileNavOpen(false);
                        handleLoginClick();
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-lg rounded-lg transition-colors hover:bg-indigo-900/20 text-indigo-400"
                    >
                      <Sparkles className="h-5 w-5" />
                      Sign In
                    </button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
            
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <motion.div 
                whileHover={{ rotate: 10 }}
                className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent"
              >
                Lullaby.ai
              </motion.div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-10">
            {navItems.map((item) => (
              <Link 
                key={item.name}
                href={item.href}
                className={cn(
                  "relative flex items-center text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href 
                    ? "text-foreground" 
                    : "text-muted-foreground"
                )}
              >
                <span className="flex items-center gap-1">
                  {item.icon && <span className="mr-1">{item.icon}</span>}
                  {item.name}
                  {item.highlight && (
                    <Badge className="ml-1 bg-indigo-600 hover:bg-indigo-700 text-white">New</Badge>
                  )}
                </span>
                {pathname === item.href && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute -bottom-[18px] left-0 right-0 h-[2px] bg-primary rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </Link>
            ))}
            
            {/* Show pricing link in dashboard */}
            {status === "authenticated" && pathname.startsWith("/dashboard") && (
              <Link 
                href="/pricing"
                className={cn(
                  "relative flex items-center text-sm font-medium transition-colors hover:text-primary",
                  pathname === "/pricing" 
                    ? "text-foreground" 
                    : "text-muted-foreground"
                )}
              >
                <span className="flex items-center gap-1">
                  <CreditCard className="h-5 w-5 mr-1" />
                  Pricing
                </span>
                {pathname === "/pricing" && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute -bottom-[18px] left-0 right-0 h-[2px] bg-primary rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </Link>
            )}
          </nav>
          
          {/* Right Side: Search & User Navigation */}
          <div className="flex items-center gap-4">
            {/* Search Bar - Only for logged in users */}
            {status === "authenticated" && (
              <form className="hidden md:flex items-center relative">
                <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search stories..."
                  className="w-48 lg:w-64 h-9 rounded-md border border-input bg-background px-3 py-1 pl-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </form>
            )}
            
            {/* User profile or login button */}
            {status === "authenticated" ? (
              <>
                {/* Notifications - Only for logged in users */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-600 rounded-full" />
                        <span className="sr-only">Notifications</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Notifications</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {/* User Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        {userImage ? (
                          <AvatarImage src={userImage} alt={userName} />
                        ) : (
                          <AvatarFallback>
                            {userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {session?.user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/pricing" className="cursor-pointer">
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Subscription</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer text-red-500 focus:text-red-500"
                      onClick={() => signOut({ callbackUrl: "/" })}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={handleLoginClick}
                  className="text-muted-foreground hover:text-primary hidden md:flex"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={handleLoginClick}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
      <AuthModal 
        isOpen={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
      />
    </header>
  );
}