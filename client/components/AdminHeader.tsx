import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BrainCircuit, Bell, Search as SearchIcon, Loader2, LogOut, Settings, ShieldCheck, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { apiListNotifications, apiMarkAllNotificationsRead, apiMarkNotificationRead, apiMe, apiMeCookie, apiSearch, apiLogout } from "@/lib/api";
import type { AuthUser, ListNotificationsResponse, SearchResponse } from "@shared/api";

export default function AdminHeader() {
  const nav = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const searchTimer = useRef<number | null>(null);
  const [notif, setNotif] = useState<ListNotificationsResponse | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = notif?.unread || 0;

  useEffect(() => {
    (async () => {
      try {
        try { const me = await apiMeCookie(); setUser(me.user); }
        catch { const token = localStorage.getItem("auth_token"); if (token) { const me = await apiMe(token); setUser(me.user); } }
      } catch { setUser(null); }
    })();
  }, []);

  useEffect(() => { if (!notifOpen) return; (async () => { try { setNotif(await apiListNotifications()); } catch { setNotif({ notifications: [], unread: 0 }); } })(); }, [notifOpen]);

  const onSearchChange = (value: string) => {
    setQ(value);
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    if (!value.trim()) { setResults(null); return; }
    searchTimer.current = window.setTimeout(async () => {
      setSearching(true);
      try { const res = await apiSearch(value.trim()); setResults(res); setSearchOpen(true); }
      catch { setResults({ query: value.trim(), items: [] }); }
      finally { setSearching(false); }
    }, 250) as unknown as number;
  };

  const initials = useMemo(() => (user?.name || user?.email || "U").split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase(), [user]);

  return (
    <header className="border-b border-gray-200 dark:border-gray-700/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-6 gap-4">
        <Link to="/admin" className="flex items-center space-x-4">
          <BrainCircuit className="h-8 w-8 text-primary-600" />
          <span className="text-xl font-bold gradient-text">AI-First Academy</span>
          <span className="ml-2 text-xs px-2 py-1 rounded-full bg-primary-600 text-white">Admin</span>
        </Link>

        <div className="ml-auto flex items-center space-x-4 relative">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => { if (results?.items?.length) setSearchOpen(true); }}
              onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
              type="search"
              placeholder="Search across platform"
              className="pl-10 pr-8 py-2 w-72 bg-muted/50"
            />
            {searching && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
            {searchOpen && results && (
              <div className="absolute z-50 mt-2 left-0 sm:right-0 sm:left-auto w-[32rem] max-w-[95vw] max-h-[65vh] overflow-auto bg-background border border-gray-200 dark:border-gray-700 rounded-md shadow-lg ring-1 ring-border">
                {results.items.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">No results</div>
                ) : (
                  <ul className="p-1">
                    {results.items.map((it) => (
                      <li key={`${it.kind}:${it.id}`}>
                        <button
                          className="w-full text-left px-3 py-2 hover:bg-muted/50 rounded-md"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { setSearchOpen(false); if (it.href) nav(it.href); }}
                        >
                          <div className="text-sm font-medium truncate">{it.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{it.kind}{it.snippet ? ` • ${it.snippet}` : ""}</div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                {unread > 0 && <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-600 text-[10px] text-white grid place-items-center">{unread > 9 ? "9+" : unread}</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm font-medium">Notifications</div>
                <button className="text-xs text-brand-700 hover:underline disabled:text-muted-foreground" disabled={!unread} onClick={async()=>{ const res = await apiMarkAllNotificationsRead(); setNotif(n=> n ? { ...n, unread: res.unread, notifications: n.notifications.map(x=> ({...x, readAt: x.readAt || new Date().toISOString()})) } : n); }}>Mark all as read</button>
              </div>
              <div className="max-h-96 overflow-auto">
                {(notif?.notifications || []).length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">You're all caught up.</div>
                ) : (
                  (notif!.notifications).map(n => (
                    <button key={n.id} className={`w-full text-left px-3 py-2 border-b border-gray-200 dark:border-gray-700/50 hover:bg-muted/50 ${!n.readAt ? "bg-brand-50/40" : ""}`} onClick={async()=>{
                      try { await apiMarkNotificationRead(n.id); } catch {}
                      setNotif(curr => curr ? { ...curr, notifications: curr.notifications.map(x => x.id === n.id ? { ...x, readAt: x.readAt || new Date().toISOString() } : x), unread: Math.max(0, (curr.unread||0) - (n.readAt ? 0 : 1)) } : curr);
                      if (n.href) nav(n.href);
                    }}>
                      <div className="text-sm font-medium leading-tight">{n.title}</div>
                      {n.body && <div className="text-xs text-muted-foreground leading-tight line-clamp-2">{n.body}</div>}
                      <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                    </button>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2">
  <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
    <User className="h-6 w-6 text-gray-700" />
  </div>
</button>

            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="space-y-1">
                <div className="text-sm font-medium">{user?.name || user?.email || "Account"}</div>
                {user?.email && <div className="text-xs text-muted-foreground">{user.email}</div>}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => nav("/admin")}>
                <ShieldCheck className="mr-2 h-4 w-4" /> Admin Console
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => nav("/admin#users")}>
                <Users className="mr-2 h-4 w-4" /> Users
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => nav("/admin#reports")}>
                <BarChart3 className="mr-2 h-4 w-4" /> Reports
              </DropdownMenuItem>
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

