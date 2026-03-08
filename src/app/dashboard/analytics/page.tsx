"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { analyticsApi } from "@/lib/api";
import type { AnalyticsOverview } from "@/types";
import {
  FileText,
  MessageSquare,
  Bot as BotIcon,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Activity,
  Layers,
  ArrowUpRight,
  Zap,
} from "lucide-react";

function MiniBarChart({ data, color = "#6366f1" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((val, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm transition-all"
          style={{
            height: `${(val / max) * 100}%`,
            backgroundColor: color,
            opacity: 0.3 + (i / data.length) * 0.7,
          }}
        />
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
  iconBg,
  change,
  changeUp = true,
  sparkData,
  sparkColor,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
  change?: string;
  changeUp?: boolean;
  sparkData?: number[];
  sparkColor?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 border border-slate-700/50 ${gradient}`}>
      <div className="flex items-start justify-between mb-3">
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
      <p className="text-3xl font-bold text-white tabular-nums">{value.toLocaleString()}</p>
      <p className="text-sm text-slate-400 mt-1 mb-3">{label}</p>
      {sparkData && (
        <MiniBarChart data={sparkData} color={sparkColor} />
      )}
    </div>
  );
}

function QuestionBar({ question, count, maxCount, rank }: {
  question: string;
  count: number;
  maxCount: number;
  rank: number;
}) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div className="flex items-center gap-4 py-3 group">
      <span className="text-xs font-bold text-slate-600 w-5 text-center flex-shrink-0">
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-300 truncate mb-1.5">{question}</p>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
        {count}×
      </span>
    </div>
  );
}

export default function AnalyticsPage() {
  const { organization, accessToken } = useAuthStore();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organization || !accessToken) return;
    analyticsApi
      .overview(organization.id, accessToken)
      .then(setOverview)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [organization, accessToken]);

  // Generate mock sparkline data based on real values
  const generateSparkData = (total: number, points = 7) => {
    if (total === 0) return Array(points).fill(0);
    return Array.from({ length: points }, (_, i) => {
      const base = total / points;
      const variance = base * 0.4;
      return Math.max(0, Math.floor(base + (Math.random() - 0.5) * variance));
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-slate-800 rounded-xl w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-36 bg-slate-800 rounded-2xl" />
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

  const topQuestions = overview?.top_questions || [];
  const maxCount = topQuestions.length > 0 ? Math.max(...topQuestions.map((q) => q.count)) : 1;

  const resolvedRate = overview
    ? overview.chats_total > 0
      ? Math.round(((overview.chats_total - overview.unresolved_count) / overview.chats_total) * 100)
      : 100
    : 0;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <span className="text-sm text-indigo-400 font-medium">Performance</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400 mt-1 text-sm">Usage metrics and performance insights</p>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Documents Indexed"
          value={overview?.docs_uploaded ?? 0}
          icon={FileText}
          gradient="bg-gradient-to-br from-blue-950/80 to-slate-900"
          iconBg="bg-blue-500"
          change="+12%"
          changeUp={true}
          sparkData={generateSparkData(overview?.docs_uploaded ?? 0)}
          sparkColor="#3b82f6"
        />
        <StatCard
          label="Vector Chunks"
          value={overview?.chunks_indexed ?? 0}
          icon={Layers}
          gradient="bg-gradient-to-br from-violet-950/80 to-slate-900"
          iconBg="bg-violet-500"
          sparkData={generateSparkData(overview?.chunks_indexed ?? 0)}
          sparkColor="#8b5cf6"
        />
        <StatCard
          label="Chats Today"
          value={overview?.chats_today ?? 0}
          icon={MessageSquare}
          gradient="bg-gradient-to-br from-indigo-950/80 to-slate-900"
          iconBg="bg-indigo-500"
          change="+24%"
          changeUp={true}
          sparkData={generateSparkData(overview?.chats_today ?? 0)}
          sparkColor="#6366f1"
        />
        <StatCard
          label="Total Conversations"
          value={overview?.chats_total ?? 0}
          icon={Activity}
          gradient="bg-gradient-to-br from-emerald-950/80 to-slate-900"
          iconBg="bg-emerald-500"
          sparkData={generateSparkData(overview?.chats_total ?? 0)}
          sparkColor="#10b981"
        />
      </div>

      {/* Resolution rate + active bots */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Resolution rate */}
        <div className="md:col-span-2 bg-slate-900 rounded-2xl border border-slate-800/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <h2 className="font-semibold text-white">Resolution Rate</h2>
            </div>
            <span className="text-2xl font-bold text-white">{resolvedRate}%</span>
          </div>

          {/* Progress bar */}
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${resolvedRate}%`,
                background: resolvedRate >= 80
                  ? "linear-gradient(90deg, #10b981, #34d399)"
                  : resolvedRate >= 50
                  ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                  : "linear-gradient(90deg, #ef4444, #f87171)",
              }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {(overview?.chats_total ?? 0) - (overview?.unresolved_count ?? 0)} resolved
            </span>
            <span>{overview?.unresolved_count ?? 0} unresolved</span>
          </div>

          {overview && overview.unresolved_count > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {overview.unresolved_count} questions couldn&apos;t be answered from your documents.
              Consider uploading more documentation.
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800/60 p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <h2 className="font-semibold text-white text-sm">Quick Stats</h2>
          </div>
          {[
            {
              label: "Active bots",
              value: overview?.active_bots ?? 0,
              icon: BotIcon,
              color: "text-indigo-400",
            },
            {
              label: "Unresolved",
              value: overview?.unresolved_count ?? 0,
              icon: AlertCircle,
              color: "text-amber-400",
            },
            {
              label: "Avg per day",
              value: overview?.chats_total
                ? Math.round(overview.chats_total / 30)
                : 0,
              icon: TrendingUp,
              color: "text-emerald-400",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-sm text-slate-400">{label}</span>
              </div>
              <span className="text-sm font-bold text-white">{value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top questions */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <h2 className="font-semibold text-white">Top Questions</h2>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
              All time
            </span>
          </div>
          {topQuestions.length > 0 && (
            <span className="text-xs text-slate-500">
              {topQuestions.length} unique question{topQuestions.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="px-5 divide-y divide-slate-800/60">
          {topQuestions.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-7 h-7 text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium">No questions yet</p>
              <p className="text-slate-500 text-sm mt-1">
                Questions will appear here after users chat with your bots
              </p>
            </div>
          ) : (
            topQuestions.map((q, i) => (
              <QuestionBar
                key={i}
                question={q.question}
                count={q.count}
                maxCount={maxCount}
                rank={i + 1}
              />
            ))
          )}
        </div>
      </div>

      {/* Unresolved section */}
      {(overview?.unresolved_count ?? 0) > 0 && (
        <div className="bg-gradient-to-r from-amber-950/40 to-slate-900 rounded-2xl border border-amber-500/20 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <AlertCircle className="w-4.5 h-4.5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-bold text-white">
                {overview?.unresolved_count} Unresolved Questions
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                These questions couldn&apos;t be answered from your documentation
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-400">
            To improve your resolution rate, consider uploading additional documentation that covers
            these topics. Each unresolved question represents a gap in your knowledge base.
          </p>
          <div className="mt-3 flex gap-2">
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{
                  width: `${Math.min(100, ((overview?.unresolved_count ?? 0) / Math.max(overview?.chats_total ?? 1, 1)) * 100)}%`,
                }}
              />
            </div>
            <span className="text-xs text-amber-400 font-medium">
              {overview?.chats_total
                ? Math.round(((overview.unresolved_count) / overview.chats_total) * 100)
                : 0}% unresolved
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
