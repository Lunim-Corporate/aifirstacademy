import { BookOpen, Award, Settings, Home, Code, Library, Users, ChevronDown, ChevronRight, Play, CheckCircle, Clock, Target, Lock, Video, FileText, HelpCircle, Trophy, Star, Zap, Calendar, TrendingUp, Medal, Shield, Download, ExternalLink, Sparkles, GraduationCap, MapPin, Timer, Brain, Rocket, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";


interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  active?: boolean;
}

interface SidebarProps {
  currentPath?: string;
  additionalItems?: SidebarItem[];
}

const defaultSidebarItems: SidebarItem[] = [
  { icon: BookOpen, label: "Courses", href: "/learning" },
  { icon: Award, label: "Achievements", href: "/certificates" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function Sidebar({ currentPath, additionalItems = [] }: SidebarProps) {
  const location = useLocation();
  const finalPath = currentPath || location.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Toggle on mobile (LoggedInHeader dispatches this event)
    const handler = () => setMobileMenuOpen((v) => !v);
    window.addEventListener("toggle-sidebar", handler);
    return () => window.removeEventListener("toggle-sidebar", handler);
  }, []);

  // Close the drawer after any navigation (e.g. clicking logo)
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);
  
  
  const sidebarItems = [...defaultSidebarItems, ...additionalItems];

  const SidebarContent = () => (
    <>
      {/* Mobile close button */}
      <div className="sm:hidden flex justify-end p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
  
      <nav className="p-4 space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = finalPath.startsWith(item.href) || item.active;
  
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "text-[#bdeeff] border border-[#bdeeff]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-[#bdeeff]" : ""}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
  
  return (
    <>
      {/* Mobile hamburger button */}

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="sm:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop and Mobile */}
      <aside
  className={`fixed sm:static top-16 left-0 z-50 w-64 bg-muted/30 border-r border-gray-200 dark:border-gray-700/40 h-[calc(100vh-4rem)] overflow-y-auto transition-transform duration-300 ${
    mobileMenuOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
  }`}
>
        <SidebarContent />
      </aside>
    </>
  );
}