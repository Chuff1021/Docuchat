"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { botsApi } from "@/lib/api";
import type { Bot, WidgetToken } from "@/types";
import {
  ChevronRight,
  Copy,
  Check,
  Plus,
  RefreshCw,
  Code2,
  Globe,
  Zap,
  Key,
  CheckCircle2,
  ExternalLink,
  Trash2,
} from "lucide-react";

const WIDGET_CDN = process.env.NEXT_PUBLIC_WIDGET_URL || "http://localhost:3001";

function CodeBlock({ code, language = "html" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border border-slate-700/60 rounded-t-xl border-b-0">
        <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">{language}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="bg-slate-950 border border-slate-700/60 rounded-b-xl p-4 text-sm overflow-x-auto font-mono leading-relaxed text-slate-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function StepBadge({ number }: { number: number }) {
  return (
    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-indigo-400">{number}</span>
    </div>
  );
}

export default function EmbedPage() {
  const params = useParams();
  const botId = params.botId as string;
  const { organization, accessToken } = useAuthStore();
  const [bot, setBot] = useState<Bot | null>(null);
  const [tokens, setTokens] = useState<WidgetToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<"html" | "react">("html");

  useEffect(() => {
    if (!organization || !accessToken) return;
    Promise.all([
      botsApi.get(organization.id, botId, accessToken),
      botsApi.getWidgetTokens(organization.id, botId, accessToken),
    ])
      .then(([botData, tokensData]) => {
        setBot(botData);
        setTokens(tokensData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [organization, accessToken, botId]);

  const createToken = async () => {
    if (!organization || !accessToken) return;
    setCreating(true);
    try {
      const token = await botsApi.createWidgetToken(organization.id, botId, accessToken);
      setTokens((prev) => [...prev, token]);
    } catch {
      alert("Failed to create token");
    } finally {
      setCreating(false);
    }
  };

  const activeToken = tokens.find((t) => t.is_active);

  const htmlSnippet = activeToken
    ? `<!-- DocuBot Widget -->
<script
  src="${WIDGET_CDN}/widget.js"
  data-bot="${activeToken.token}"
  async
></script>`
    : `<!-- Create a widget token first to get your embed code -->`;

  const reactSnippet = activeToken
    ? `// Install: npm install @docubot/widget
import { DocuBotWidget } from '@docubot/widget';

export default function App() {
  return (
    <>
      {/* Your app content */}
      <DocuBotWidget
        token="${activeToken.token}"
        position="bottom-right"
      />
    </>
  );
}`
    : `// Create a widget token first`;

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-slate-800 rounded w-48" />
          <div className="h-40 bg-slate-800 rounded-2xl" />
          <div className="h-60 bg-slate-800 rounded-2xl" />
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
        <span className="text-slate-300 font-medium">Embed</span>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Code2 className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-purple-400 font-medium">Widget Integration</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Embed Widget</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Add your AI chatbot to any website in 3 simple steps
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {/* Step 1: Create token */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800/60 p-5">
          <div className="flex items-center gap-3 mb-4">
            <StepBadge number={1} />
            <div>
              <h2 className="font-bold text-white">Generate Widget Token</h2>
              <p className="text-xs text-slate-500 mt-0.5">Create a secure token to authenticate your widget</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-400">
                {tokens.length} token{tokens.length !== 1 ? "s" : ""}
              </span>
            </div>
            <button
              onClick={createToken}
              disabled={creating}
              className="flex items-center gap-1.5 text-sm font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 hover:border-indigo-500/30 px-3 py-1.5 rounded-xl transition-all"
            >
              {creating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              New token
            </button>
          </div>

          {tokens.length === 0 ? (
            <div className="text-center py-6 bg-slate-800/40 rounded-xl border border-slate-700/50">
              <Key className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No tokens yet</p>
              <p className="text-xs text-slate-600 mt-0.5">Create a token to get your embed code</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tokens.map((token) => (
                <div
                  key={token.id}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-all ${
                    token.is_active
                      ? "bg-emerald-500/5 border-emerald-500/20"
                      : "bg-slate-800/40 border-slate-700/50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${token.is_active ? "bg-emerald-400 status-online" : "bg-slate-600"}`} />
                    <div className="min-w-0">
                      <code className="text-xs font-mono text-slate-300 truncate block max-w-xs">
                        {token.token}
                      </code>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Created {new Date(token.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-3 ${
                      token.is_active
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-slate-800 text-slate-500 border border-slate-700"
                    }`}
                  >
                    {token.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Copy code */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800/60 p-5">
          <div className="flex items-center gap-3 mb-4">
            <StepBadge number={2} />
            <div>
              <h2 className="font-bold text-white">Copy Embed Code</h2>
              <p className="text-xs text-slate-500 mt-0.5">Choose your integration method</p>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl mb-4 w-fit">
            {(["html", "react"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab
                    ? "bg-slate-700 text-slate-200 shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {tab === "html" ? "HTML" : "React / Next.js"}
              </button>
            ))}
          </div>

          {activeTab === "html" ? (
            <div>
              <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                Paste before the closing <code className="bg-slate-800 px-1 rounded text-slate-400">&lt;/body&gt;</code> tag
              </p>
              <CodeBlock code={htmlSnippet} language="html" />
            </div>
          ) : (
            <div>
              <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Install the npm package and import the component
              </p>
              <CodeBlock code={reactSnippet} language="tsx" />
            </div>
          )}
        </div>

        {/* Step 3: Go live */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800/60 p-5">
          <div className="flex items-center gap-3 mb-4">
            <StepBadge number={3} />
            <div>
              <h2 className="font-bold text-white">Go Live</h2>
              <p className="text-xs text-slate-500 mt-0.5">Deploy and verify your widget is working</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                icon: CheckCircle2,
                title: "Widget appears",
                desc: "A floating chat bubble appears on your site",
                color: "text-emerald-400",
                bg: "bg-emerald-500/10 border-emerald-500/20",
              },
              {
                icon: Globe,
                title: "Domain secured",
                desc: "Configure allowed domains in bot settings",
                color: "text-blue-400",
                bg: "bg-blue-500/10 border-blue-500/20",
              },
              {
                icon: ExternalLink,
                title: "Test it live",
                desc: "Use the Test Chat tab to verify responses",
                color: "text-purple-400",
                bg: "bg-purple-500/10 border-purple-500/20",
              },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className={`rounded-xl p-4 border ${bg}`}>
                <Icon className={`w-5 h-5 ${color} mb-2`} />
                <p className="text-sm font-semibold text-slate-200">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>

          {bot?.allowed_domains && bot.allowed_domains.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-800/60">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Allowed Domains
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {bot.allowed_domains.map((domain) => (
                  <span
                    key={domain}
                    className="text-xs font-mono text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg"
                  >
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
