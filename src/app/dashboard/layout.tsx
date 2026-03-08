"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import {
  LayoutDashboard,
  Bot,
  BarChart3,
  LogOut,
  Zap,
  ChevronDown,
  Settings,
  Bell,
  Search,
  Sparkles,
} from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
    description: "Dashboard summary",
  },
  {
    href: "/dashboard/bots",
    label: "Bots",
    icon: Bot,
    description: "Manage chatbots",
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    icon: BarChart3,
    description: "Usage metrics",
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, organization, logout } = useAuthStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800/60 flex flex-col fixed h-full z-20">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-800/60">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
              <Zap className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight">ManualBot</span>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-online" />
                <span className="text-xs text-slate-400">AI Platform</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Org badge */}
        <div className="px-4 py-3 mx-3 mt-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Workspace</p>
          <p className="text-sm font-semibold text-slate-200 truncate">
            {organization?.name || "Loading..."}
          </p>
          <p className="text-xs text-slate-500 mt-0.5 capitalize">
            {organization?.plan || "free"} plan
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="text-xs text-slate-600 uppercase tracking-widest font-semibold px-3 mb-2">
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  active
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent"
                }`}
              >
                {active && <div className="nav-active-indicator" />}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                    active
                      ? "bg-indigo-500/20 text-indigo-400"
                      : "bg-slate-800 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={active ? "text-indigo-300" : ""}>{item.label}</p>
                  <p className="text-xs text-slate-600 group-hover:text-slate-500 transition-colors">
                    {item.description}
                  </p>
                </div>
                {active && (
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-4 space-y-2 border-t border-slate-800/60 pt-3">
          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/60 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-md">
                {initials}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-slate-300 truncate">
                  {user?.full_name || user?.email?.split("@")[0]}
                </p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700">
                  <p className="text-xs text-slate-400">Signed in as</p>
                  <p className="text-sm font-medium text-slate-200 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-14 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800/60 flex items-center px-6 gap-4 sticky top-0 z-10">
          <div className="flex-1 flex items-center gap-3">
            <div className="relative max-w-sm w-full hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search bots, documents..."
                className="w-full pl-9 pr-4 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-slate-800"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
