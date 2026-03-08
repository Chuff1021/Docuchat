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
} from "lucide-react";

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Analytics</h1>
        <p className="text-stone-500 mt-0.5">Usage and performance metrics</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Docs Uploaded", value: overview?.docs_uploaded ?? 0, icon: FileText, color: "blue" },
          { label: "Chunks Indexed", value: overview?.chunks_indexed ?? 0, icon: TrendingUp, color: "green" },
          { label: "Chats Today", value: overview?.chats_today ?? 0, icon: MessageSquare, color: "indigo" },
          { label: "Total Chats", value: overview?.chats_total ?? 0, icon: BotIcon, color: "amber" },
        ].map(({ label, value, icon: Icon, color }) => {
          const colorMap: Record<string, string> = {
            blue: "bg-blue-50 text-blue-600",
            green: "bg-green-50 text-green-600",
            indigo: "bg-indigo-50 text-indigo-600",
            amber: "bg-amber-50 text-amber-600",
          };
          return (
            <div key={label} className="bg-white rounded-xl border border-stone-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-stone-500">{label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-stone-900">{value.toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top questions */}
        <div className="bg-white rounded-xl border border-stone-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <h2 className="font-semibold text-stone-900">Top Questions</h2>
            <span className="text-xs text-stone-400">All time</span>
          </div>
          <div className="divide-y divide-stone-100">
            {!overview?.top_questions?.length ? (
              <div className="px-5 py-8 text-center">
                <MessageSquare className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-sm text-stone-500">No questions yet</p>
              </div>
            ) : (
              overview.top_questions.map((q, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-stone-400 w-5 text-right">{i + 1}</span>
                    <p className="text-sm text-stone-700 truncate max-w-xs">{q.question}</p>
                  </div>
                  <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                    {q.count}x
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Unresolved */}
        <div className="bg-white rounded-xl border border-stone-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <h2 className="font-semibold text-stone-900">Unresolved Questions</h2>
            {overview && overview.unresolved_count > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                <AlertCircle className="w-3 h-3" />
                {overview.unresolved_count} total
              </span>
            )}
          </div>
          <div className="px-5 py-8 text-center">
            {overview?.unresolved_count === 0 ? (
              <>
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-600 text-lg">✓</span>
                </div>
                <p className="text-sm text-stone-500">All questions answered!</p>
                <p className="text-xs text-stone-400 mt-1">
                  Your bot is handling all questions from the documentation
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-stone-700">
                  {overview?.unresolved_count} questions not found in docs
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  Consider uploading more documentation to cover these topics
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
