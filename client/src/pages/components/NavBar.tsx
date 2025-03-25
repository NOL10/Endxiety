import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu } from "lucide-react";

interface NavBarProps {
  active: "home" | "mood" | "community" | "chat" | "analytics";
}

export default function NavBar({ active }: NavBarProps) {
  const [, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/");
  };

  const navLinks = [
    { name: "Home", path: "/", key: "home" },
    { name: "Anxiety Tracker", path: "/mood", key: "mood" },
    { name: "Support Community", path: "/community", key: "community" },
    { name: "AI Therapy", path: "/chat", key: "chat" },
    { name: "Insights", path: "/analytics", key: "analytics" },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-soft fixed w-full z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-primary font-display font-bold text-2xl">
                Endxiety
                <span className="text-xs ml-1 bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-full">Beta</span>
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => (
              <Button
                key={link.key}
                onClick={() => navigate(link.path)}
                variant="ghost"
                className={
                  active === link.key
                    ? "text-primary font-medium"
                    : "text-neutral-600 hover:text-primary"
                }
              >
                {link.name}
              </Button>
            ))}
          </div>
          <div className="hidden md:flex items-center">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="flex items-center text-neutral-600 hover:text-primary"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              <span>Log out</span>
            </Button>
          </div>
          <div className="flex items-center md:hidden">
            <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {navLinks.map((link) => (
                  <DropdownMenuItem
                    key={link.key}
                    className={active === link.key ? "text-primary font-medium" : ""}
                    onClick={() => {
                      navigate(link.path);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {link.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
