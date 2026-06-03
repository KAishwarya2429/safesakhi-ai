import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert,
  LayoutDashboard,
  Navigation,
  Bot,
  Map,
  FileText,
  Settings,
  LogOut,
  Menu,
  Zap,
  Radio,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const navItems = [
  { path: "/dashboard", label: "Command Center", icon: LayoutDashboard },
  { path: "/journey", label: "Active Journey", icon: Navigation },
  { path: "/agents", label: "Agent Hub", icon: Bot },
  { path: "/risk-map", label: "Risk Map", icon: Map },
  { path: "/incidents", label: "Incidents", icon: FileText },
  { path: "/settings", label: "Settings", icon: Settings },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Session terminated");
    navigate("/login", { replace: true });
    onClose?.();
  };

  const username =
    profile?.email?.replace("@miaoda.com", "") ||
    user?.email?.replace("@miaoda.com", "") ||
    "User";

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-sm bg-primary/10 border border-primary/30 shrink-0">
          <ShieldAlert className="w-5 h-5 text-primary" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-safe border-2 border-sidebar" />
        </div>
        <div className="min-w-0">
          <p className="font-mono font-bold text-sm text-foreground tracking-wider truncate">
            SAFESAKHI AI
          </p>
          <p className="text-xs text-muted-foreground font-mono">v2.0 ACTIVE</p>
        </div>
      </div>

      {/* System status */}
      <div className="mx-3 mt-3 p-2.5 rounded-sm border border-safe/20 bg-safe/5 flex items-center gap-2">
        <Radio className="w-3.5 h-3.5 text-safe shrink-0 animate-pulse" />
        <span className="text-xs font-mono text-safe truncate">
          ALL SYSTEMS NOMINAL
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors font-mono min-h-11",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground border border-border/40"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate text-xs tracking-wide">
              {label.toUpperCase()}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 space-y-2 border-t border-sidebar-border pt-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-mono font-bold">
              {username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-foreground truncate">
              {username}
            </p>
            <Badge
              variant="outline"
              className="text-[10px] py-0 px-1.5 font-mono border-primary/30 text-primary"
            >
              {profile?.role?.toUpperCase() || "USER"}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-emergency font-mono text-xs h-9"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          SIGN OUT
        </Button>
      </div>
    </div>
  );
}

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  missionActive?: boolean;
}

export default function AppLayout({
  children,
  title,
  subtitle,
  headerRight,
  missionActive,
}: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border">
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-x-hidden flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b border-border bg-background/95 backdrop-blur-sm">
          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden shrink-0 border border-border/50 text-foreground hover:bg-muted w-9 h-9"
              >
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="p-0 w-64 bg-sidebar border-border"
            >
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Title */}
          <div className="flex-1 min-w-0">
            {title && (
              <div className="flex items-center gap-2">
                <h1 className="text-sm md:text-base font-mono font-bold text-foreground truncate tracking-wide">
                  {title}
                </h1>
                {missionActive && (
                  <Badge className="shrink-0 bg-safe/15 text-safe border-safe/30 font-mono text-[10px] py-0">
                    <Zap className="w-2.5 h-2.5 mr-1 animate-pulse" />
                    MISSION LIVE
                  </Badge>
                )}
              </div>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground font-mono truncate">
                {subtitle}
              </p>
            )}
          </div>

          {/* Right slot */}
          <div className="shrink-0 flex items-center gap-2">
            {headerRight}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-border bg-muted/30">
              <Shield className="w-3 h-3 text-primary" />
              <span className="font-mono text-[10px] text-muted-foreground">
                SECURED
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
