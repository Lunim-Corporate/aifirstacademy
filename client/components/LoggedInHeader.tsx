import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { BrainCircuit, Loader2, LogOut, Settings, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { apiListNotifications, apiSearch, apiLogout } from "@/lib/api";
import type { ListNotificationsResponse, SearchResponse } from "@shared/api";
import { useAuth } from "@/context/AuthContext";

export default function LoggedInHeader() {
  const nav = useNavigate();
  const loc = useLocation();
  const { user } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const initials = useMemo(
    () =>
      (user?.name || user?.email || "U")
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [user]
  );

  return (
    <header className="border-b border-gray-200 dark:border-gray-700/40 bg-black sm:bg-background/95 sm:backdrop-blur supports-[backdrop-filter]:sm:bg-background/60">
      <div className="flex h-16 items-center px-4 sm:px-6 relative">
  {/* Hamburger - move to far left on mobile */}
  <button
    className="sm:hidden absolute left-2 top-1/2 -translate-y-1/2 p-2 z-50"
    onClick={() => window.dispatchEvent(new Event("toggle-sidebar"))}
  >
    <Menu className="h-6 w-6 text-white" />
  </button>

  <Link to="/" className="flex items-center space-x-4 ml-8 sm:ml-0">
    <BrainCircuit className="h-8 w-8 text-primary-600" />
    <span className="text-xl font-bold text-white">AI-First Marketing Academy</span>
  </Link>

  <div className="ml-auto flex items-center space-x-4 relative">
    {/* Avatar dropdown */}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="flex items-center justify-center bg-gray-300 text-gray-700 text-lg font-semibold">
              {user?.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "U"}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="space-y-1">
          <div className="text-sm font-medium">{user?.name || user?.email || "Account"}</div>
          {user?.email && <div className="text-xs text-muted-foreground">{user.email}</div>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => nav("/settings")}>
          <Settings className="mr-2 h-4 w-4" /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            try {
              await apiLogout();
            } catch {}
            try {
              localStorage.removeItem("auth_token");
              window.dispatchEvent(new Event("auth-changed"));
            } catch {}
            window.location.replace("/login");
          }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</div>

    </header>
  );
}
