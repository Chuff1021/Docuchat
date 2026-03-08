"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { botsApi } from "@/lib/api";
import type { Bot } from "@/types";
import {
  ChevronRight,
  Save,
  Loader2,
  Palette,
  Brain,
  Shield,
  Globe,
  Mail,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

type Tab = "basic" | "ai" | "features" | "domains" | "escalation";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "basic", label: "Basic", icon: Palette },
  { id: "ai", label: "AI Settings", icon: Brain },
  { id: "features", label: "Features", icon: Sparkles },
  { id: "domains", label: "Domains", icon: Globe },
  { id: "escalation", label: "Escalation", icon: Mail },
];

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-slate-200">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-all flex-shrink-0 ${
          checked ? "bg-indigo-600" : "bg-slate-700"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:bg-slate-800 transition-colors"
      />
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

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
  const [activeTab, setActiveTab] = useState<Tab>("basic");

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
      // Strip null values — API expects undefined not null for optional fields
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== null)
      ) as Partial<Bot>;
      const updated = await botsApi.update(organization.id, botId, payload as Parameters<typeof botsApi.update>[2], accessToken);
      setBot(updated);
      setForm(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof Bot, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-slate-800 rounded w-48" />
          <div className="h-12 bg-slate-800 rounded-2xl" />
          <div className="h-64 bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard/bots" className="hover:text-slate-300 transition-colors">
          Bots
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/dashboard/bots/${botId}`} className="hover:text-slate-300 transition-colors">
          {bot?.name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-300 font-medium">Settings</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bot Settings</h1>
          <p className="text-slate-400 mt-1 text-sm">Configure your bot&apos;s behavior and appearance</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all ${
            saved
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
              : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 disabled:opacity-40"
          }`}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? "Saved!" : "Save changes"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800/60 p-1 rounded-2xl overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === id
                ? "bg-slate-800 text-slate-200 shadow-sm"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/40"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800/60 p-6">
        {activeTab === "basic" && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-5">
              <Palette className="w-4 h-4 text-indigo-400" />
              <h2 className="font-bold text-white">Basic Settings</h2>
            </div>

            <InputField
              label="Bot name"
              value={form.name || ""}
              onChange={(v) => update("name", v)}
              placeholder="Support Bot"
            />

            <InputField
              label="Greeting message"
              value={form.greeting || ""}
              onChange={(v) => update("greeting", v)}
              placeholder="Hi! How can I help you today?"
              hint="This message is shown when users first open the chat widget"
            />

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Fallback message
              </label>
              <textarea
                value={form.fallback_message || ""}
                onChange={(e) => update("fallback_message", e.target.value)}
                rows={2}
                placeholder="I couldn't find an answer in the documentation. Please contact support."
                className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:bg-slate-800 transition-colors resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">Shown when the bot can&apos;t find an answer</p>
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
                    onChange={(e) => update("brand_color", e.target.value)}
                    className="w-12 h-12 rounded-xl border border-slate-700 cursor-pointer bg-transparent"
                  />
                </div>
                <input
                  type="text"
                  value={form.brand_color || "#6366f1"}
                  onChange={(e) => update("brand_color", e.target.value)}
                  className="flex-1 px-3 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500/60 focus:bg-slate-800 transition-colors"
                />
                <div
                  className="w-12 h-12 rounded-xl border border-slate-700 flex-shrink-0 shadow-lg"
                  style={{ backgroundColor: form.brand_color || "#6366f1" }}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "ai" && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-5">
              <Brain className="w-4 h-4 text-indigo-400" />
              <h2 className="font-bold text-white">AI Settings</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                System prompt
              </label>
              <textarea
                value={form.system_prompt || ""}
                onChange={(e) => update("system_prompt", e.target.value)}
                rows={5}
                placeholder="You are a helpful assistant. Answer questions based on the provided documentation..."
                className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:bg-slate-800 transition-colors resize-none font-mono"
              />
              <p className="text-xs text-slate-500 mt-1">
                Custom instructions that guide the AI&apos;s behavior and tone
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Temperature
                  <span className="text-slate-500 font-normal ml-1">
                    ({form.temperature ?? 0.1})
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={form.temperature ?? 0.1}
                  onChange={(e) => update("temperature", parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Max tokens
                </label>
                <input
                  type="number"
                  min="256"
                  max="4096"
                  value={form.max_tokens ?? 1024}
                  onChange={(e) => update("max_tokens", parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/60 focus:bg-slate-800 transition-colors"
                />
              </div>
            </div>

            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">
                <span className="text-slate-400 font-medium">Model:</span> gpt-4o-mini
              </p>
              <p className="text-xs text-slate-500">
                <span className="text-slate-400 font-medium">Embeddings:</span> text-embedding-3-small
              </p>
            </div>
          </div>
        )}

        {activeTab === "features" && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h2 className="font-bold text-white">Features</h2>
            </div>

            <div className="divide-y divide-slate-800/60">
              <Toggle
                checked={!!form.citation_mode}
                onChange={(v) => update("citation_mode", v)}
                label="Show citations"
                description="Display source document references alongside answers"
              />
              <Toggle
                checked={!!form.strict_mode}
                onChange={(v) => update("strict_mode", v)}
                label="Docs-only mode"
                description="Only answer questions from uploaded documents, refuse general knowledge"
              />
              <Toggle
                checked={!!form.lead_capture}
                onChange={(v) => update("lead_capture", v)}
                label="Lead capture"
                description="Ask visitors for their email address before chatting"
              />
              <Toggle
                checked={!!form.is_active}
                onChange={(v) => update("is_active", v)}
                label="Bot active"
                description="Enable or disable the bot for all users"
              />
            </div>
          </div>
        )}

        {activeTab === "domains" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-5">
              <Globe className="w-4 h-4 text-indigo-400" />
              <h2 className="font-bold text-white">Allowed Domains</h2>
            </div>

            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50 mb-4">
              <p className="text-sm text-slate-300 mb-1">Domain allowlist</p>
              <p className="text-xs text-slate-500">
                Restrict the widget to specific domains. Leave empty to allow all domains.
                Enter one domain per line (e.g., <code className="text-slate-400">example.com</code>).
              </p>
            </div>

            <div>
              <textarea
                value={(form.allowed_domains || []).join("\n")}
                onChange={(e) =>
                  update(
                    "allowed_domains",
                    e.target.value
                      .split("\n")
                      .map((d) => d.trim())
                      .filter(Boolean)
                  )
                }
                rows={6}
                placeholder={"example.com\napp.example.com\nwww.example.com"}
                className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:bg-slate-800 transition-colors resize-none font-mono"
              />
              <p className="text-xs text-slate-500 mt-1">
                {(form.allowed_domains || []).length} domain{(form.allowed_domains || []).length !== 1 ? "s" : ""} configured
              </p>
            </div>
          </div>
        )}

        {activeTab === "escalation" && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-5">
              <Mail className="w-4 h-4 text-indigo-400" />
              <h2 className="font-bold text-white">Escalation</h2>
            </div>

            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50 mb-4">
              <p className="text-sm text-slate-300 mb-1">Human escalation</p>
              <p className="text-xs text-slate-500">
                When the bot can&apos;t answer a question, it can offer to escalate to a human agent via email.
              </p>
            </div>

            <InputField
              label="Escalation email"
              value={form.escalation_email || ""}
              onChange={(v) => update("escalation_email", v)}
              type="email"
              placeholder="support@yourcompany.com"
              hint="Users will be directed to this email when the bot can't help"
            />

            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
              <p className="text-xs text-indigo-400 font-medium mb-1">How escalation works</p>
              <ol className="text-xs text-slate-400 space-y-1">
                <li>1. Bot fails to find an answer in documents</li>
                <li>2. Bot shows the fallback message</li>
                <li>3. If escalation email is set, bot offers to connect with support</li>
                <li>4. User&apos;s question is forwarded to the escalation email</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
