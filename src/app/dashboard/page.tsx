"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { analyticsApi, botsApi } from "@/lib/api";
import type { AnalyticsOverview, Bot } from "@/types";
import {
  FileText,
  MessageSquare,
  Bot as BotIcon,
  TrendingUp,
  Plus,
  ChevronRight,
  AlertCircle,
  Zap,
  ArrowUpRight,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  BarChart3,
} from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
  change?: string;
  changeUp?: boolean;
  delay?: number;
}

function StatCard({ label, value, icon: Icon, gradient, iconBg, change, changeUp, delay = 0 }: StatCardProps) {
  const [displayed, setDisplayed] = useState(0);
  const numValue = typeof value === "number" ? value : 0;

  useEffect(() => {
    if (numValue === 0) return;
    const duration = 800;
    const steps = 30;
    const increment = numValue / steps;
    let current = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        current += increment;
        if (current >= numValue) {
          setDisplayed(numValue);
          clearInterval(interval);
        } else {
          setDisplayed(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [numValue, delay]);

  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 border border-slate-700/50 hover-lift group cursor-default ${gradient}`}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/5 to-transparent" />
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg} shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
            changeUp ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
          }`}>
            <ArrowUpRight className={`w-3 h-3 ${!changeUp ? "rotate-180" : ""}`} />
            {change}
          </div>
        )}
      </div>
      <div className="count-up">
        <p className="text-3xl font-bold text-white tabular-nums">
          {numValue > 0 ? displayed.toLocaleString() : (typeof value === "string" ? value : "0")}
        </p>
      </div>
      <p className="text-sm text-slate-400 mt-1">{label}</p>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

function BotStatusDot({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex w-2 h-2 rounded-full flex-shrink-0 ${active ? "bg-emerald-400 status-online" : "bg-slate-600"}`} />
  );
}

export default function DashboardPage() {
  const { organization, accessToken, user } = useAuthStore();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organization || !accessToken) return;
    const load = async () => {
      try {
        const [overviewData, botsData] = await Promise.all([
          analyticsApi.overview(organization.id, accessToken),
          botsApi.list(organization.id, accessToken),
        ]);
        setOverview(overviewData);
        setBots(botsData.bots);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [organization, accessToken]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-slate-800 rounded-xl w-72" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-800 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-slate-800 rounded-2xl" />
            <div className="h-80 bg-slate-800 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const activeBots = bots.filter((b) => b.is_active);
  const totalDocs = bots.reduce((sum, b) => sum + b.document_count, 0);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-indigo-400 font-medium">
              {greeting()}, {user?.full_name?.split(" ")[0] || "there"}
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            {organization?.name}
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Here&apos;s what&apos;s happening with your AI bots today
          </p>
        </div>
        <Link
          href="/dashboard/bots"
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
        >
          <Plus className="w-4 h-4" />
          New Bot
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Documents Indexed"
          value={overview?.docs_uploaded ?? 0}
          icon={FileText}
          gradient="bg-gradient-to-br from-blue-950/80 to-slate-900"
          iconBg="bg-blue-500"
          change="+12%"
          changeUp={true}
          delay={0}
        />
        <StatCard
          label="Vector Chunks"
          value={overview?.chunks_indexed ?? 0}
          icon={Layers}
          gradient="bg-gradient-to-br from-violet-950/80 to-slate-900"
          iconBg="bg-violet-500"
          change="+8%"
          changeUp={true}
          delay={100}
        />
        <StatCard
          label="Chats Today"
          value={overview?.chats_today ?? 0}
          icon={MessageSquare}
          gradient="bg-gradient-to-br from-indigo-950/80 to-slate-900"
          iconBg="bg-indigo-500"
          change="+24%"
          changeUp={true}
          delay={200}
        />
        <StatCard
          label="Active Bots"
          value={overview?.active_bots ?? activeBots.length}
          icon={BotIcon}
          gradient="bg-gradient-to-br from-emerald-950/80 to-slate-900"
          iconBg="bg-emerald-500"
          delay={300}
        />
      </div>

      {/* Secondary stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{overview?.chats_total?.toLocaleString() ?? 0}</p>
            <p className="text-xs text-slate-400">Total conversations</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{overview?.unresolved_count ?? 0}</p>
            <p className="text-xs text-slate-400">Unresolved questions</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{totalDocs}</p>
            <p className="text-xs text-slate-400">Total documents</p>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Bots list */}
        <div className="lg:col-span-3 bg-slate-900 rounded-2xl border border-slate-800/60 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <BotIcon className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <h2 className="font-semibold text-white">Your Bots</h2>
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                {bots.length}
              </span>
            </div>
            <Link
              href="/dashboard/bots"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-800/60">
            {bots.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-3">
                  <BotIcon className="w-7 h-7 text-slate-600" />
                </div>
                <p className="text-slate-400 font-medium mb-1">No bots yet</p>
                <p className="text-slate-500 text-sm mb-4">Create your first AI chatbot to get started</p>
                <Link
                  href="/dashboard/bots"
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create bot
                </Link>
              </div>
            ) : (
              bots.slice(0, 6).map((bot) => (
                <Link
                  key={bot.id}
                  href={`/dashboard/bots/${bot.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-800/40 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md flex-shrink-0"
                      style={{ backgroundColor: bot.brand_color || "#6366f1" }}
                    >
                      {bot.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                          {bot.name}
                        </p>
                        <BotStatusDot active={bot.is_active} />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {bot.document_count} docs · {bot.chunk_count.toLocaleString()} chunks
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      {bot.is_active ? (
                        <span className="text-xs text-emerald-400 font-medium">Active</span>
                      ) : (
                        <span className="text-xs text-slate-500">Inactive</span>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Top questions */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800/60 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <h2 className="font-semibold text-white">Top Questions</h2>
            </div>
            {overview && overview.unresolved_count > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full">
                <AlertCircle className="w-3 h-3" />
                {overview.unresolved_count} unresolved
              </span>
            )}
          </div>
          <div className="divide-y divide-slate-800/60">
            {!overview?.top_questions?.length ? (
              <div className="px-5 py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-7 h-7 text-slate-600" />
                </div>
                <p className="text-slate-400 font-medium mb-1">No questions yet</p>
                <p className="text-slate-500 text-sm">
                  Questions appear after users chat with your bots
                </p>
              </div>
            ) : (
              overview.top_questions.slice(0, 8).map((q, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-800/40 transition-colors">
                  <span className="text-xs font-bold text-slate-600 w-5 text-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-300 truncate flex-1">{q.question}</p>
                  <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                    {q.count}×
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-gradient-to-r from-indigo-950/50 to-purple-950/50 border border-indigo-500/20 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-indigo-400" />
          <h2 className="font-semibold text-white text-sm">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/dashboard/bots", icon: Plus, label: "Create Bot", desc: "New AI chatbot" },
            { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics", desc: "View metrics" },
            { href: "/dashboard/bots", icon: FileText, label: "Upload Docs", desc: "Add documents" },
            { href: "/dashboard/bots", icon: ExternalLink, label: "Embed Widget", desc: "Get code snippet" },
          ].map(({ href, icon: Icon, label, desc }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-3 bg-slate-900/60 hover:bg-slate-800/60 border border-slate-700/50 hover:border-indigo-500/30 rounded-xl p-3 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/20 transition-colors">
                <Icon className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
