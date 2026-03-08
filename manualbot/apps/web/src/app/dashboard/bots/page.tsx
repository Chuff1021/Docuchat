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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-stone-100">
          <h2 className="text-lg font-semibold text-stone-900">Create new bot</h2>
          <p className="text-sm text-stone-500 mt-0.5">
            Set up your AI chatbot in seconds
          </p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Bot name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Support Bot"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Greeting message
            </label>
            <input
              type="text"
              value={form.greeting || ""}
              onChange={(e) => setForm({ ...form, greeting: e.target.value })}
              className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Hi! How can I help you today?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Brand color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.brand_color || "#6366f1"}
                onChange={(e) => setForm({ ...form, brand_color: e.target.value })}
                className="w-10 h-10 rounded-lg border border-stone-200 cursor-pointer"
              />
              <input
                type="text"
                value={form.brand_color || "#6366f1"}
                onChange={(e) => setForm({ ...form, brand_color: e.target.value })}
                className="flex-1 px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.citation_mode}
                onChange={(e) => setForm({ ...form, citation_mode: e.target.checked })}
                className="rounded border-stone-300 text-indigo-600"
              />
              <span className="text-sm text-stone-700">Show citations</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.strict_mode}
                onChange={(e) => setForm({ ...form, strict_mode: e.target.checked })}
                className="rounded border-stone-300 text-indigo-600"
              />
              <span className="text-sm text-stone-700">Docs only mode</span>
            </label>
          </div>
        </form>
        <div className="px-6 py-4 border-t border-stone-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-stone-600 hover:text-stone-800 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !form.name}
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
          >
            {loading ? "Creating..." : "Create bot"}
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
    } catch (err) {
      alert("Failed to delete bot");
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Bots</h1>
          <p className="text-stone-500 mt-0.5">Manage your AI chatbots</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Bot
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-stone-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : bots.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-stone-200">
          <BotIcon className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-stone-700 mb-1">No bots yet</h3>
          <p className="text-stone-500 text-sm mb-4">
            Create your first bot and upload documents to get started
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create your first bot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bots.map((bot) => (
            <div
              key={bot.id}
              className="bg-white rounded-xl border border-stone-200 hover:border-stone-300 transition-colors overflow-hidden"
            >
              {/* Color bar */}
              <div
                className="h-1.5"
                style={{ backgroundColor: bot.brand_color || "#6366f1" }}
              />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: bot.brand_color || "#6366f1" }}
                    >
                      {bot.name[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-900">{bot.name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        {bot.is_active ? (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-stone-400">
                            <XCircle className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(bot.id)}
                    className="text-stone-300 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs text-stone-500 mb-4">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {bot.document_count} docs
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {bot.chunk_count} chunks
                  </span>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/bots/${bot.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 border border-stone-200 hover:border-stone-300 rounded-lg py-2 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Manage
                  </Link>
                  <Link
                    href={`/dashboard/bots/${bot.id}/chat`}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-300 rounded-lg py-2 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Test Chat
                  </Link>
                </div>
              </div>
            </div>
          ))}
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
