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
  CheckCircle2,
  Clock,
} from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
  color = "indigo",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
  };
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-stone-500">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-stone-900">{value.toLocaleString()}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { organization, accessToken } = useAuthStore();
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-stone-200 rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-stone-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Overview</h1>
          <p className="text-stone-500 mt-0.5">
            Welcome back, {organization?.name}
          </p>
        </div>
        <Link
          href="/dashboard/bots"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Bot
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Docs Uploaded"
          value={overview?.docs_uploaded ?? 0}
          icon={FileText}
          color="blue"
        />
        <StatCard
          label="Chunks Indexed"
          value={overview?.chunks_indexed ?? 0}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          label="Chats Today"
          value={overview?.chats_today ?? 0}
          icon={MessageSquare}
          color="indigo"
        />
        <StatCard
          label="Active Bots"
          value={overview?.active_bots ?? 0}
          icon={BotIcon}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bots list */}
        <div className="bg-white rounded-xl border border-stone-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <h2 className="font-semibold text-stone-900">Your Bots</h2>
            <Link
              href="/dashboard/bots"
              className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-stone-100">
            {bots.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <BotIcon className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-sm text-stone-500">No bots yet</p>
                <Link
                  href="/dashboard/bots"
                  className="text-sm text-indigo-600 hover:text-indigo-700 mt-1 inline-block"
                >
                  Create your first bot →
                </Link>
              </div>
            ) : (
              bots.slice(0, 5).map((bot) => (
                <Link
                  key={bot.id}
                  href={`/dashboard/bots/${bot.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: bot.brand_color || "#6366f1" }}
                    >
                      {bot.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-800">{bot.name}</p>
                      <p className="text-xs text-stone-400">
                        {bot.document_count} docs · {bot.chunk_count} chunks
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {bot.is_active ? (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-stone-400">
                        <Clock className="w-3 h-3" /> Inactive
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-stone-300" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Top questions */}
        <div className="bg-white rounded-xl border border-stone-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <h2 className="font-semibold text-stone-900">Top Questions</h2>
            {overview && overview.unresolved_count > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                <AlertCircle className="w-3 h-3" />
                {overview.unresolved_count} unresolved
              </span>
            )}
          </div>
          <div className="divide-y divide-stone-100">
            {!overview?.top_questions?.length ? (
              <div className="px-5 py-8 text-center">
                <MessageSquare className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-sm text-stone-500">No questions yet</p>
                <p className="text-xs text-stone-400 mt-1">
                  Questions will appear after users chat with your bots
                </p>
              </div>
            ) : (
              overview.top_questions.slice(0, 8).map((q, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <p className="text-sm text-stone-700 truncate flex-1 mr-4">{q.question}</p>
                  <span className="text-xs text-stone-400 flex-shrink-0">{q.count}x</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
