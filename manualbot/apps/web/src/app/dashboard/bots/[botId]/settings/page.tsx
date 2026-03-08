"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { botsApi } from "@/lib/api";
import type { Bot } from "@/types";
import { ChevronRight, Save, Loader2 } from "lucide-react";

export default function BotSettingsPage() {
  const params = useParams();
  const botId = params.botId as string;
  const { organization, accessToken } = useAuthStore();
  const [bot, setBot] = useState<Bot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Partial<Bot>>({});

  useEffect(() => {
    if (!organization || !accessToken) return;
    botsApi
      .get(organization.id, botId, accessToken)
      .then((data) => {
        setBot(data);
        setForm(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [organization, accessToken, botId]);

  const handleSave = async () => {
    if (!organization || !accessToken) return;
    setSaving(true);
    setError("");
    try {
      const updated = await botsApi.update(organization.id, botId, form, accessToken);
      setBot(updated);
      setForm(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-stone-200 rounded w-48" />
          <div className="h-64 bg-stone-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-stone-400 mb-6">
        <Link href="/dashboard/bots" className="hover:text-stone-600">Bots</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/dashboard/bots/${botId}`} className="hover:text-stone-600">{bot?.name}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-stone-700">Settings</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Bot Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : "Save changes"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Basic */}
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <h2 className="font-semibold text-stone-900 mb-4">Basic Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Bot name</label>
              <input
                type="text"
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Greeting message</label>
              <input
                type="text"
                value={form.greeting || ""}
                onChange={(e) => setForm({ ...form, greeting: e.target.value })}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Fallback message</label>
              <textarea
                value={form.fallback_message || ""}
                onChange={(e) => setForm({ ...form, fallback_message: e.target.value })}
                rows={2}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Brand color</label>
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
          </div>
        </div>

        {/* AI Settings */}
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <h2 className="font-semibold text-stone-900 mb-4">AI Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">System prompt</label>
              <textarea
                value={form.system_prompt || ""}
                onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
                rows={4}
                placeholder="Custom instructions for the AI..."
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Temperature</label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={form.temperature ?? 0.1}
                  onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Max tokens</label>
                <input
                  type="number"
                  min="256"
                  max="4096"
                  value={form.max_tokens ?? 1024}
                  onChange={(e) => setForm({ ...form, max_tokens: parseInt(e.target.value) })}
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Feature flags */}
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <h2 className="font-semibold text-stone-900 mb-4">Features</h2>
          <div className="space-y-3">
            {[
              { key: "citation_mode", label: "Show citations", desc: "Display source references in answers" },
              { key: "strict_mode", label: "Docs-only mode", desc: "Only answer from uploaded documents" },
              { key: "lead_capture", label: "Lead capture", desc: "Ask visitors for their email" },
              { key: "is_active", label: "Bot active", desc: "Enable or disable the bot" },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-stone-700">{label}</p>
                  <p className="text-xs text-stone-400">{desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={!!(form as Record<string, unknown>)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                  className="w-4 h-4 rounded border-stone-300 text-indigo-600"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Domain allowlist */}
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <h2 className="font-semibold text-stone-900 mb-1">Allowed Domains</h2>
          <p className="text-sm text-stone-500 mb-4">
            Restrict the widget to specific domains (one per line). Leave empty to allow all.
          </p>
          <textarea
            value={(form.allowed_domains || []).join("\n")}
            onChange={(e) =>
              setForm({
                ...form,
                allowed_domains: e.target.value
                  .split("\n")
                  .map((d) => d.trim())
                  .filter(Boolean),
              })
            }
            rows={3}
            placeholder="example.com&#10;app.example.com"
            className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono"
          />
        </div>

        {/* Escalation */}
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <h2 className="font-semibold text-stone-900 mb-4">Escalation</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Escalation email</label>
              <input
                type="email"
                value={form.escalation_email || ""}
                onChange={(e) => setForm({ ...form, escalation_email: e.target.value })}
                placeholder="support@yourcompany.com"
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
