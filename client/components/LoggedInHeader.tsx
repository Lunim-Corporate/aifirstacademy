import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { BrainCircuit, Bell, Search as SearchIcon, Loader2, LogOut, Settings, Library as LibraryIcon, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { apiListNotifications, apiMarkAllNotificationsRead, apiMarkNotificationRead, apiSearch, apiLogout } from "@/lib/api";
import type { ListNotificationsResponse, SearchResponse } from "@shared/api";
import { useAuth } from "@/context/AuthContext";

export default function LoggedInHeader() {
  const nav = useNavigate();
  const loc = useLocation();
  const { user, loading: loadingUser, refresh } = useAuth();

  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const searchTimer = useRef<number | null>(null);

  const [notif, setNotif] = useState<ListNotificationsResponse | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = notif?.unread || 0;


  useEffect(() => {
    if (!notifOpen) return;
    (async () => {
      try {
        const res = await apiListNotifications();
        setNotif(res);
      } catch {
        setNotif({ notifications: [], unread: 0 });
      }
    })();
  }, [notifOpen]);

  const onSearchChange = (value: string) => {
    setQ(value);
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    if (!value.trim()) {
      setResults(null);
      return;
    }
    searchTimer.current = window.setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiSearch(value.trim());
        setResults(res);
        setSearchOpen(true);
      } catch {
        setResults({ query: value.trim(), items: [] });
      } finally {
        setSearching(false);
      }
    }, 250) as unknown as number;
  };

  const initials = useMemo(() => (user?.name || user?.email || "U").split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase(), [user]);

  return (
    <header className="border-b border-gray-200 dark:border-gray-700/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-6">
        <Link to="/" className="flex items-center space-x-4">
          <BrainCircuit className="h-8 w-8 text-primary-600" />
          <span className="text-xl font-bold" style={{color: 'white'}}>AI-First Marketing Academy</span>
        </Link>

        <div className="ml-auto flex items-center space-x-4 relative">



          <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="flex items-center justify-center bg-gray-300 text-gray-700 text-lg font-semibold">
                {user?.name
                  ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
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
              <DropdownMenuItem onClick={async()=>{ 
                try { 
                  await apiLogout(); 
                } catch {} 
                try { 
                  localStorage.removeItem("auth_token"); 
                  window.dispatchEvent(new Event('auth-changed')); 
                } catch {} 
                // Use window.location.replace to completely prevent back navigation
                window.location.replace("/login");
              }}>
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

