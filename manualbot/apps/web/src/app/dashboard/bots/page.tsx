"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { botsApi } from "@/lib/api";
import type { Bot, BotCreate } from "@/types";
import {
  Plus,
  Bot as BotIcon,
  FileText,
  MessageSquare,
  Settings,
  ChevronRight,
  Trash2,
  CheckCircle2,
  XCircle,
  Zap,
  Code2,
  Sparkles,
  X,
} from "lucide-react";

function CreateBotModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (bot: Bot) => void;
}) {
  const { organization, accessToken } = useAuthStore();
  const [form, setForm] = useState<BotCreate>({
    name: "",
    greeting: "Hi! How can I help you today?",
    brand_color: "#6366f1",
    citation_mode: true,
    strict_mode: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !accessToken) return;
    setLoading(true);
    setError("");
    try {
      const bot = await botsApi.create(organization.id, form, accessToken);
      onCreated(bot);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create bot");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Create new bot</h2>
              <p className="text-xs text-slate-400">Set up your AI chatbot in seconds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Bot name <span className="text-indigo-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:bg-slate-800 transition-colors"
              placeholder="Support Bot"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Greeting message
            </label>
            <input
              type="text"
              value={form.greeting || ""}
              onChange={(e) => setForm({ ...form, greeting: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:bg-slate-800 transition-colors"
              placeholder="Hi! How can I help you today?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Brand color
            </label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  value={form.brand_color || "#6366f1"}
                  onChange={(e) => setForm({ ...form, brand_color: e.target.value })}
                  className="w-10 h-10 rounded-xl border border-slate-700 cursor-pointer bg-transparent"
                />
              </div>
              <input
                type="text"
                value={form.brand_color || "#6366f1"}
                onChange={(e) => setForm({ ...form, brand_color: e.target.value })}
                className="flex-1 px-3 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500/60 focus:bg-slate-800 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { key: "citation_mode" as const, label: "Show citations", desc: "Source references" },
                { key: "strict_mode" as const, label: "Docs-only mode", desc: "No general knowledge" },
              ] as const
            ).map(({ key, label, desc }) => (
              <label
                key={key}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  form[key]
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                    : "bg-slate-800/40 border-slate-700/50 text-slate-400 hover:border-slate-600"
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                  form[key]
                    ? "bg-indigo-500 border-indigo-500"
                    : "border-slate-600"
                }`}>
                  {form[key] && (
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium">{label}</p>
                  <p className="text-xs opacity-60">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-800/60 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !form.name}
            className="px-5 py-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white rounded-xl transition-all font-semibold shadow-lg shadow-indigo-500/20"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              "Create bot"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BotsPage() {
  const { organization, accessToken } = useAuthStore();
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!organization || !accessToken) return;
    botsApi
      .list(organization.id, accessToken)
      .then((data) => setBots(data.bots))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [organization, accessToken]);

  const handleDelete = async (botId: string) => {
    if (!organization || !accessToken) return;
    if (!confirm("Delete this bot and all its data? This cannot be undone.")) return;
    try {
      await botsApi.delete(organization.id, botId, accessToken);
      setBots((prev) => prev.filter((b) => b.id !== botId));
    } catch {
      alert("Failed to delete bot");
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BotIcon className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-indigo-400 font-medium">AI Chatbots</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Bots</h1>
          <p className="text-slate-400 mt-1 text-sm">
            {bots.length > 0
              ? `${bots.length} bot${bots.length !== 1 ? "s" : ""} · ${bots.filter((b) => b.is_active).length} active`
              : "Manage your AI chatbots"}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
        >
          <Plus className="w-4 h-4" />
          New Bot
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-52 bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : bots.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 rounded-2xl border border-slate-800/60">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4">
            <BotIcon className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No bots yet</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
            Create your first AI chatbot, upload documents, and embed it on your website in minutes
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25"
          >
            <Plus className="w-4 h-4" />
            Create your first bot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {bots.map((bot) => (
            <div
              key={bot.id}
              className="bg-slate-900 rounded-2xl border border-slate-800/60 hover:border-slate-700/60 transition-all overflow-hidden hover-lift group"
            >
              {/* Color accent bar */}
              <div
                className="h-1"
                style={{
                  background: `linear-gradient(90deg, ${bot.brand_color || "#6366f1"}, ${bot.brand_color || "#6366f1"}88)`,
                }}
              />

              <div className="p-5">
                {/* Bot header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-lg flex-shrink-0"
                      style={{ backgroundColor: bot.brand_color || "#6366f1" }}
                    >
                      {bot.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {bot.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {bot.is_active ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-online" />
                            <span className="text-xs text-emerald-400 font-medium">Active</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                            <span className="text-xs text-slate-500">Inactive</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(bot.id)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/30 flex items-center justify-center text-slate-500 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-slate-800/60 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <FileText className="w-3 h-3 text-blue-400" />
                      <span className="text-xs text-slate-500">Documents</span>
                    </div>
                    <p className="text-sm font-bold text-white">{bot.document_count}</p>
                  </div>
                  <div className="bg-slate-800/60 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span className="text-xs text-slate-500">Chunks</span>
                    </div>
                    <p className="text-sm font-bold text-white">{bot.chunk_count.toLocaleString()}</p>
                  </div>
                </div>

                {/* Feature badges */}
                <div className="flex gap-1.5 mb-4">
                  {bot.citation_mode && (
                    <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                      Citations
                    </span>
                  )}
                  {bot.strict_mode && (
                    <span className="text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full">
                      Strict
                    </span>
                  )}
                  {bot.lead_capture && (
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      Leads
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <Link
                    href={`/dashboard/bots/${bot.id}`}
                    className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl py-2 transition-all"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Manage
                  </Link>
                  <Link
                    href={`/dashboard/bots/${bot.id}/chat`}
                    className="flex items-center justify-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 hover:border-indigo-500/30 rounded-xl py-2 transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Chat
                  </Link>
                  <Link
                    href={`/dashboard/bots/${bot.id}/embed`}
                    className="flex items-center justify-center gap-1.5 text-xs font-medium text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/20 hover:border-purple-500/30 rounded-xl py-2 transition-all"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    Embed
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Add new bot card */}
          <button
            onClick={() => setShowCreate(true)}
            className="bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-700/60 hover:border-indigo-500/40 hover:bg-slate-900 transition-all p-5 flex flex-col items-center justify-center gap-3 min-h-52 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-800 group-hover:bg-indigo-500/10 border border-slate-700 group-hover:border-indigo-500/30 flex items-center justify-center transition-all">
              <Plus className="w-6 h-6 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">
                New Bot
              </p>
              <p className="text-xs text-slate-600 group-hover:text-slate-500 transition-colors mt-0.5">
                Create AI chatbot
              </p>
            </div>
          </button>
        </div>
      )}

      {showCreate && (
        <CreateBotModal
          onClose={() => setShowCreate(false)}
          onCreated={(bot) => {
            setBots((prev) => [bot, ...prev]);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}
