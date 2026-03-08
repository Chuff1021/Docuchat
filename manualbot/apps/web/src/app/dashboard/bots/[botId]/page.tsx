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
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-stone-200 rounded w-48" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-stone-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="p-8 text-center">
        <p className="text-stone-500">Bot not found</p>
      </div>
    );
  }

  const sections = [
    {
      href: `/dashboard/bots/${botId}/documents`,
      icon: FileText,
      label: "Documents",
      description: "Upload and manage PDF documents",
      stat: `${bot.document_count} docs · ${bot.chunk_count} chunks`,
      color: "blue",
    },
    {
      href: `/dashboard/bots/${botId}/chat`,
      icon: MessageSquare,
      label: "Test Chat",
      description: "Test your bot in the dashboard",
      stat: "Live chat tester",
      color: "green",
    },
    {
      href: `/dashboard/bots/${botId}/embed`,
      icon: Code2,
      label: "Embed",
      description: "Get the embed snippet for your website",
      stat: "Widget code",
      color: "purple",
    },
    {
      href: `/dashboard/bots/${botId}/settings`,
      icon: Settings,
      label: "Settings",
      description: "Configure bot behavior and branding",
      stat: "Bot configuration",
      color: "amber",
    },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-stone-400 mb-6">
        <Link href="/dashboard/bots" className="hover:text-stone-600">
          Bots
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-stone-700 font-medium">{bot.name}</span>
      </div>

      {/* Bot header */}
      <div className="flex items-center gap-4 mb-8">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: bot.brand_color || "#6366f1" }}
        >
          {bot.name[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{bot.name}</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            {bot.is_active ? (
              <span className="text-green-600">● Active</span>
            ) : (
              <span className="text-stone-400">● Inactive</span>
            )}{" "}
            · {bot.document_count} documents · {bot.chunk_count} chunks indexed
          </p>
        </div>
      </div>

      {/* Quick actions grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="bg-white rounded-xl border border-stone-200 hover:border-stone-300 p-5 flex items-center gap-4 transition-all hover:shadow-sm group"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[section.color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-stone-900 group-hover:text-indigo-700 transition-colors">
                  {section.label}
                </h3>
                <p className="text-sm text-stone-500 mt-0.5">{section.description}</p>
                <p className="text-xs text-stone-400 mt-1">{section.stat}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
            </Link>
          );
        })}
      </div>

      {/* Bot info */}
      <div className="mt-6 bg-white rounded-xl border border-stone-200 p-5">
        <h2 className="font-semibold text-stone-900 mb-4">Bot Configuration</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-stone-400 text-xs mb-1">Citation Mode</p>
            <p className="font-medium text-stone-700">
              {bot.citation_mode ? "Enabled" : "Disabled"}
            </p>
          </div>
          <div>
            <p className="text-stone-400 text-xs mb-1">Strict Mode</p>
            <p className="font-medium text-stone-700">
              {bot.strict_mode ? "Docs only" : "General knowledge"}
            </p>
          </div>
          <div>
            <p className="text-stone-400 text-xs mb-1">Lead Capture</p>
            <p className="font-medium text-stone-700">
              {bot.lead_capture ? "Enabled" : "Disabled"}
            </p>
          </div>
          <div>
            <p className="text-stone-400 text-xs mb-1">Model</p>
            <p className="font-medium text-stone-700">
              {bot.chat_model || "Default"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
