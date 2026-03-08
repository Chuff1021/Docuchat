"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { botsApi } from "@/lib/api";
import type { Bot } from "@/types";
import {
  FileText,
  MessageSquare,
  Code2,
  Settings,
  ChevronRight,
  Bot as BotIcon,
  Zap,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Layers,
  Globe,
} from "lucide-react";

export default function BotDetailPage() {
  const params = useParams();
  const botId = params.botId as string;
  const { organization, accessToken } = useAuthStore();
  const [bot, setBot] = useState<Bot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organization || !accessToken) return;
    botsApi
      .get(organization.id, botId, accessToken)
      .then(setBot)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [organization, accessToken, botId]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-slate-800 rounded w-48" />
          <div className="h-20 bg-slate-800 rounded-2xl" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-36 bg-slate-800 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4">
          <BotIcon className="w-8 h-8 text-slate-600" />
        </div>
        <p className="text-slate-400 font-medium">Bot not found</p>
        <Link href="/dashboard/bots" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
          ← Back to bots
        </Link>
      </div>
    );
  }

  const sections = [
    {
      href: `/dashboard/bots/${botId}/documents`,
      icon: FileText,
      label: "Documents",
      description: "Upload and manage PDF documents for training",
      stat: `${bot.document_count} docs · ${bot.chunk_count.toLocaleString()} chunks`,
      gradient: "from-blue-950/60 to-slate-900",
      iconColor: "bg-blue-500/10 border-blue-500/20 text-blue-400",
      accentColor: "#3b82f6",
    },
    {
      href: `/dashboard/bots/${botId}/chat`,
      icon: MessageSquare,
      label: "Test Chat",
      description: "Test your bot with live conversations",
      stat: "Interactive chat tester",
      gradient: "from-emerald-950/60 to-slate-900",
      iconColor: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
      accentColor: "#10b981",
    },
    {
      href: `/dashboard/bots/${botId}/embed`,
      icon: Code2,
      label: "Embed Widget",
      description: "Get the embed snippet for your website",
      stat: "HTML & React snippets",
      gradient: "from-purple-950/60 to-slate-900",
      iconColor: "bg-purple-500/10 border-purple-500/20 text-purple-400",
      accentColor: "#a855f7",
    },
    {
      href: `/dashboard/bots/${botId}/settings`,
      icon: Settings,
      label: "Settings",
      description: "Configure AI behavior, branding, and domains",
      stat: "Bot configuration",
      gradient: "from-amber-950/60 to-slate-900",
      iconColor: "bg-amber-500/10 border-amber-500/20 text-amber-400",
      accentColor: "#f59e0b",
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard/bots" className="hover:text-slate-300 transition-colors">
          Bots
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-300 font-medium">{bot.name}</span>
      </div>

      {/* Bot hero */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800/60 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-xl flex-shrink-0"
              style={{
                backgroundColor: bot.brand_color || "#6366f1",
                boxShadow: `0 8px 24px ${bot.brand_color || "#6366f1"}40`,
              }}
            >
              {bot.name[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{bot.name}</h1>
                {bot.is_active ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-online" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-sm mt-1">
                {bot.document_count} documents · {bot.chunk_count.toLocaleString()} chunks indexed
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{bot.document_count}</p>
              <p className="text-xs text-slate-500">Docs</p>
            </div>
            <div className="w-px h-10 bg-slate-800" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{bot.chunk_count.toLocaleString()}</p>
              <p className="text-xs text-slate-500">Chunks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className={`bg-gradient-to-br ${section.gradient} rounded-2xl border border-slate-800/60 hover:border-slate-700/60 p-5 flex items-center gap-4 transition-all hover-lift group`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0 ${section.iconColor}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {section.label}
                </h3>
                <p className="text-sm text-slate-400 mt-0.5 truncate">{section.description}</p>
                <p className="text-xs text-slate-600 mt-1">{section.stat}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* Config summary */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-indigo-400" />
          <h2 className="font-semibold text-white">Configuration</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Citations",
              value: bot.citation_mode ? "Enabled" : "Disabled",
              icon: CheckCircle2,
              active: bot.citation_mode,
            },
            {
              label: "Strict Mode",
              value: bot.strict_mode ? "Docs only" : "General",
              icon: Layers,
              active: bot.strict_mode,
            },
            {
              label: "Lead Capture",
              value: bot.lead_capture ? "Enabled" : "Disabled",
              icon: bot.lead_capture ? CheckCircle2 : XCircle,
              active: bot.lead_capture,
            },
            {
              label: "Domains",
              value: bot.allowed_domains?.length
                ? `${bot.allowed_domains.length} allowed`
                : "All domains",
              icon: Globe,
              active: true,
            },
          ].map(({ label, value, icon: Icon, active }) => (
            <div key={label} className="bg-slate-800/40 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className={`w-3.5 h-3.5 ${active ? "text-indigo-400" : "text-slate-500"}`} />
                <p className="text-xs text-slate-500">{label}</p>
              </div>
              <p className={`text-sm font-semibold ${active ? "text-slate-200" : "text-slate-500"}`}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {bot.greeting && (
          <div className="mt-4 pt-4 border-t border-slate-800/60">
            <p className="text-xs text-slate-500 mb-1.5">Greeting message</p>
            <p className="text-sm text-slate-300 bg-slate-800/40 rounded-xl px-3 py-2 italic">
              &ldquo;{bot.greeting}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
