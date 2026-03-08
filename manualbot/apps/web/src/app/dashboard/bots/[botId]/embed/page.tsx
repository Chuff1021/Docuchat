"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { botsApi } from "@/lib/api";
import type { Bot, WidgetToken } from "@/types";
import { ChevronRight, Copy, Check, Plus, RefreshCw, Code2 } from "lucide-react";

const WIDGET_CDN = process.env.NEXT_PUBLIC_WIDGET_URL || "http://localhost:3001";

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <pre className="bg-stone-900 text-stone-100 rounded-xl p-4 text-sm overflow-x-auto font-mono leading-relaxed">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-3 right-3 flex items-center gap-1.5 text-xs bg-stone-700 hover:bg-stone-600 text-stone-200 px-2.5 py-1.5 rounded-lg transition-colors"
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? "Copied!" : "Copy"}
      </button>
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

  const embedSnippet = activeToken
    ? `<!-- ManualBot Widget -->
<script
  src="${WIDGET_CDN}/widget.js"
  data-bot="${activeToken.token}"
  async
></script>`
    : "<!-- No active widget token. Create one above. -->";

  const reactSnippet = activeToken
    ? `// Install: npm install @manualbot/widget
import { ManualBotWidget } from '@manualbot/widget';

export default function App() {
  return (
    <>
      {/* Your app */}
      <ManualBotWidget token="${activeToken.token}" />
    </>
  );
}`
    : "// Create a widget token first";

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-stone-200 rounded w-48" />
          <div className="h-40 bg-stone-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-stone-400 mb-6">
        <Link href="/dashboard/bots" className="hover:text-stone-600">Bots</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/dashboard/bots/${botId}`} className="hover:text-stone-600">{bot?.name}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-stone-700">Embed</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Embed Widget</h1>
          <p className="text-stone-500 mt-0.5">Add your chatbot to any website</p>
        </div>
      </div>

      {/* Widget tokens */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-stone-900">Widget Tokens</h2>
          <button
            onClick={createToken}
            disabled={creating}
            className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            {creating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            New token
          </button>
        </div>

        {tokens.length === 0 ? (
          <p className="text-sm text-stone-500">No tokens yet. Create one to get your embed code.</p>
        ) : (
          <div className="space-y-2">
            {tokens.map((token) => (
              <div
                key={token.id}
                className="flex items-center justify-between bg-stone-50 rounded-lg px-4 py-3"
              >
                <div>
                  <code className="text-sm font-mono text-stone-700">{token.token}</code>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Created {new Date(token.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    token.is_active
                      ? "bg-green-50 text-green-600"
                      : "bg-stone-100 text-stone-400"
                  }`}
                >
                  {token.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Embed code */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Code2 className="w-4 h-4 text-stone-500" />
            <h2 className="font-semibold text-stone-900">HTML Snippet</h2>
            <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
              Paste before &lt;/body&gt;
            </span>
          </div>
          <CodeBlock code={embedSnippet} />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Code2 className="w-4 h-4 text-stone-500" />
            <h2 className="font-semibold text-stone-900">React / Next.js</h2>
          </div>
          <CodeBlock code={reactSnippet} />
        </div>

        {/* Instructions */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
          <h3 className="font-semibold text-indigo-900 mb-2">How it works</h3>
          <ol className="space-y-1.5 text-sm text-indigo-800">
            <li>1. Copy the HTML snippet above</li>
            <li>2. Paste it before the closing <code className="bg-indigo-100 px-1 rounded">&lt;/body&gt;</code> tag on your website</li>
            <li>3. A floating chat bubble will appear on your site</li>
            <li>4. Visitors can ask questions answered from your uploaded documents</li>
          </ol>
          {bot?.allowed_domains && bot.allowed_domains.length > 0 && (
            <div className="mt-3 pt-3 border-t border-indigo-200">
              <p className="text-xs text-indigo-700">
                <strong>Allowed domains:</strong> {bot.allowed_domains.join(", ")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
