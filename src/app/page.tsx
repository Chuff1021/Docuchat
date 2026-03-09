import Link from "next/link";
import {
  Zap,
  FileText,
  MessageSquare,
  Code2,
  BarChart3,
  Shield,
  Globe,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Bot,
  Search,
  Eye,
  Brain,
  Upload,
  MousePointerClick,
} from "lucide-react";

/* ─── Reusable Components ─── */

function FeatureCard({
  icon: Icon,
  title,
  description,
  iconColor,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  iconColor: string;
}) {
  return (
    <div className="group relative rounded-2xl bg-slate-900/60 border border-slate-800/60 p-6 hover:border-slate-700/80 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${iconColor}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-base font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
  icon: Icon,
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 flex items-center justify-center">
          <Icon className="w-7 h-7 text-blue-400" />
        </div>
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
          {step}
        </div>
      </div>
      <h3 className="text-base font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
        {description}
      </p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  href,
  highlighted,
}: {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl p-6 ${
        highlighted
          ? "bg-gradient-to-b from-blue-950/40 to-slate-900 border border-blue-500/30 shadow-xl shadow-blue-500/5"
          : "bg-slate-900/60 border border-slate-800/60"
      }`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
          Most Popular
        </div>
      )}
      <h3 className="text-lg font-bold text-white mb-1">{name}</h3>
      <p className="text-sm text-slate-400 mb-4">{description}</p>
      <p className="text-3xl font-extrabold text-white mb-6">
        {price}
        {period && (
          <span className="text-sm font-normal text-slate-500">{period}</span>
        )}
      </p>
      <ul className="space-y-3 mb-6">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
            <CheckCircle2
              className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                highlighted ? "text-blue-400" : "text-slate-500"
              }`}
            />
            {f}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`block text-center text-sm font-semibold rounded-xl py-2.5 transition-all ${
          highlighted
            ? "text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20"
            : "text-slate-300 border border-slate-700 hover:border-slate-600 hover:bg-slate-800/50"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

/* ─── Main Page ─── */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/25">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">
              DocuBot
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm text-slate-400 hover:text-white font-medium transition-colors px-3 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-lg shadow-blue-600/20"
            >
              Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-32 left-1/3 w-[500px] h-[500px] bg-blue-500/[0.07] rounded-full blur-[100px]" />
          <div className="absolute top-48 right-1/3 w-[400px] h-[400px] bg-cyan-500/[0.05] rounded-full blur-[100px]" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-semibold text-blue-300">
              AI-Powered Business Chatbot
            </span>
          </div>

          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-300">
            Live demo update: auto-shipped from Kilo Builder → GitHub → Vercel
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            Your business knowledge,{" "}
            <span className="gradient-text">instantly accessible</span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your docs. Get an AI expert that answers questions for your
            team and customers — with citations, on the first try. Embed it on
            your website in minutes.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3.5 rounded-xl text-base transition-all shadow-xl shadow-blue-600/25 hover:shadow-blue-500/35"
            >
              <Sparkles className="w-4 h-4" />
              Try the Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/register"
              className="flex items-center gap-2 text-slate-300 hover:text-white font-semibold px-8 py-3.5 rounded-xl text-base border border-slate-700 hover:border-slate-600 hover:bg-slate-800/50 transition-all"
            >
              Create Free Account
            </Link>
          </div>

          {/* Social proof stats */}
          <div className="grid grid-cols-3 gap-8 max-w-md mx-auto">
            {[
              { value: "5 min", label: "Setup Time" },
              { value: "96%", label: "Resolution Rate" },
              { value: "$0", label: "AI Cost to You" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dashboard Preview ── */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl border border-slate-800/60 bg-slate-900/50 overflow-hidden shadow-2xl">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-900 border-b border-slate-800/60">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-slate-800 rounded-lg px-4 py-1 text-xs text-slate-500 font-mono">
                  app.docubot.ai/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-5 space-y-4">
              {/* Stat row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Documents", value: "23", icon: "📄" },
                  { label: "Knowledge Chunks", value: "4,826", icon: "🧩" },
                  { label: "Chats Today", value: "47", icon: "💬" },
                  { label: "Active Bots", value: "3", icon: "🤖" },
                ].map(({ label, value, icon }) => (
                  <div
                    key={label}
                    className="bg-slate-800/50 rounded-xl p-3.5 border border-slate-700/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">{icon}</span>
                      <span className="text-[10px] text-emerald-400 font-medium">
                        ↑ 12%
                      </span>
                    </div>
                    <p className="text-lg font-bold text-white">{value}</p>
                    <p className="text-[11px] text-slate-500">{label}</p>
                  </div>
                ))}
              </div>

              {/* Bot cards row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    name: "Customer Support",
                    docs: 12,
                    chats: 847,
                    status: "Active",
                    color: "#3b82f6",
                  },
                  {
                    name: "Sales Assistant",
                    docs: 8,
                    chats: 312,
                    status: "Active",
                    color: "#10b981",
                  },
                  {
                    name: "HR Onboarding",
                    docs: 3,
                    chats: 125,
                    status: "Active",
                    color: "#f59e0b",
                  },
                ].map(({ name, docs, chats, status, color }) => (
                  <div
                    key={name}
                    className="bg-slate-800/50 rounded-xl p-3.5 border border-slate-700/30"
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: color }}
                      >
                        {name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {docs} docs · {chats} chats
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[11px] text-emerald-400 font-medium">
                        {status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="px-6 py-24 border-t border-slate-800/40">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-4">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-300">
                How It Works
              </span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">
              Three steps to your{" "}
              <span className="gradient-text">AI expert</span>
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto">
              No training required. Upload your documents and DocuBot becomes an
              expert on your business instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            <StepCard
              step={1}
              icon={Upload}
              title="Upload Your Docs"
              description="Drag & drop PDFs — manuals, policies, FAQs, guides. DocuBot extracts text, diagrams, and tables automatically."
            />
            <StepCard
              step={2}
              icon={Brain}
              title="AI Learns Instantly"
              description="Your documents are chunked, embedded, and indexed. The AI understands your content in minutes, not days."
            />
            <StepCard
              step={3}
              icon={MousePointerClick}
              title="Embed & Go Live"
              description="Copy one line of code to your website. Your AI chatbot is live and answering customer questions."
            />
          </div>
        </div>
      </section>

      {/* ── The Brain Section ── */}
      <section className="px-6 py-24 border-t border-slate-800/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 mb-4">
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-semibold text-purple-300">
                The Engine
              </span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">
              How DocuBot{" "}
              <span className="gradient-text">thinks</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              A multi-layer AI engine that understands your documents deeply —
              text, diagrams, tables — and answers with precision.
            </p>
          </div>

          {/* Engine diagram */}
          <div className="space-y-4 max-w-3xl mx-auto">
            {/* Layer 1 */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800/60 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Layer 1 — Knowledge Ingestion
                  </h3>
                  <p className="text-xs text-slate-500">
                    Your documents become searchable knowledge
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "PDF Upload", sub: "Drag & drop" },
                  { label: "Text Extract", sub: "Every page" },
                  { label: "Vision AI", sub: "Diagrams & tables" },
                  { label: "Smart Chunk", sub: "800 tokens + overlap" },
                ].map(({ label, sub }) => (
                  <div
                    key={label}
                    className="bg-slate-800/50 rounded-lg p-3 text-center"
                  >
                    <p className="text-xs font-semibold text-slate-200">
                      {label}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <div className="w-px h-6 bg-slate-700" />
            </div>

            {/* Layer 2 */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800/60 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Search className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Layer 2 — Semantic Search
                  </h3>
                  <p className="text-xs text-slate-500">
                    Finds answers by meaning, not just keywords
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: "Vector Database", sub: "1536-dim embeddings" },
                  { label: "Web Search", sub: "When docs aren't enough" },
                  { label: "Result Fusion", sub: "Merge & rank sources" },
                ].map(({ label, sub }) => (
                  <div
                    key={label}
                    className="bg-slate-800/50 rounded-lg p-3 text-center"
                  >
                    <p className="text-xs font-semibold text-slate-200">
                      {label}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <div className="w-px h-6 bg-slate-700" />
            </div>

            {/* Layer 3 */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800/60 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Layer 3 — Answer Engine
                  </h3>
                  <p className="text-xs text-slate-500">
                    Expert answers with citations on the first try
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "Query Planner", sub: "Optimizes questions" },
                  { label: "Context Builder", sub: "Assembles evidence" },
                  { label: "GPT-4.1", sub: "Generates answer" },
                  { label: "Citations", sub: "Page-level sources" },
                ].map(({ label, sub }) => (
                  <div
                    key={label}
                    className="bg-slate-800/50 rounded-lg p-3 text-center"
                  >
                    <p className="text-xs font-semibold text-slate-200">
                      {label}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="px-6 py-24 border-t border-slate-800/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 mb-4">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-300">
                Features
              </span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">
              Everything your business needs
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto">
              From document upload to website embedding — DocuBot handles the
              entire pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              icon={FileText}
              title="Smart Document Upload"
              description="Drag & drop PDFs. DocuBot extracts text, diagrams, and tables automatically — even from scanned documents."
              iconColor="bg-blue-500/15 text-blue-400"
            />
            <FeatureCard
              icon={Eye}
              title="Vision AI for Diagrams"
              description="GPT-4.1 Vision reads diagrams, flowcharts, and tables that text extraction misses. Your bot understands visual content."
              iconColor="bg-purple-500/15 text-purple-400"
            />
            <FeatureCard
              icon={Bot}
              title="One-Shot Expert Answers"
              description="Answers questions completely on the first response with page-level citations. No back-and-forth needed."
              iconColor="bg-emerald-500/15 text-emerald-400"
            />
            <FeatureCard
              icon={Search}
              title="AI Web Search Fallback"
              description="When your docs don't have the answer, DocuBot searches the web and clearly labels which sources it used."
              iconColor="bg-amber-500/15 text-amber-400"
            />
            <FeatureCard
              icon={Code2}
              title="Embed Anywhere"
              description="Add the chat widget to any website with one line of code. Works with HTML, React, WordPress, and more."
              iconColor="bg-cyan-500/15 text-cyan-400"
            />
            <FeatureCard
              icon={BarChart3}
              title="Analytics Dashboard"
              description="Track conversations, top questions, resolution rates, and identify knowledge gaps in your documentation."
              iconColor="bg-rose-500/15 text-rose-400"
            />
            <FeatureCard
              icon={Shield}
              title="Domain Restrictions"
              description="Control exactly which websites can embed your chatbot. Keep your knowledge base secure and private."
              iconColor="bg-orange-500/15 text-orange-400"
            />
            <FeatureCard
              icon={Globe}
              title="Multi-Bot Support"
              description="Create separate bots for support, sales, HR, onboarding — each with their own knowledge base and settings."
              iconColor="bg-indigo-500/15 text-indigo-400"
            />
            <FeatureCard
              icon={Zap}
              title="Zero AI Costs"
              description="Connect your OpenAI account via OAuth. You use your own API access — DocuBot charges nothing for AI usage."
              iconColor="bg-yellow-500/15 text-yellow-400"
            />
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="px-6 py-24 border-t border-slate-800/40">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-slate-400">
              Start free. Connect your OpenAI account for unlimited AI-powered
              chats.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <PricingCard
              name="Starter"
              price="$0"
              period="/mo"
              description="Try it out with your first bot"
              features={[
                "1 bot",
                "5 documents",
                "50 chats/month",
                "Basic analytics",
                "Community support",
              ]}
              cta="Get Started Free"
              href="/auth/register"
            />
            <PricingCard
              name="Pro"
              price="$29"
              period="/mo"
              description="For growing businesses"
              features={[
                "5 bots",
                "Unlimited documents",
                "Unlimited chats*",
                "Advanced analytics",
                "Custom branding",
                "Web search augmentation",
                "Priority support",
              ]}
              cta="Start Free Trial"
              href="/auth/register"
              highlighted
            />
            <PricingCard
              name="Business"
              price="$79"
              period="/mo"
              description="For teams and organizations"
              features={[
                "25 bots",
                "Unlimited everything",
                "Vision AI for diagrams",
                "Domain restrictions",
                "Team management",
                "API access",
                "Dedicated support",
              ]}
              cta="Start Free Trial"
              href="/auth/register"
            />
          </div>

          <p className="text-center text-xs text-slate-600 mt-6">
            * Unlimited chats when you connect your own OpenAI account. DocuBot
            charges for the platform, not the AI.
          </p>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="px-6 py-24 border-t border-slate-800/40">
        <div className="max-w-2xl mx-auto text-center">
          <div className="rounded-2xl bg-gradient-to-b from-blue-950/30 to-slate-900/50 border border-blue-500/15 p-10">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
              <Bot className="w-7 h-7 text-blue-400" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white mb-3">
              Ready to build your AI expert?
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Upload your docs and have a working chatbot in 5 minutes. No
              training, no code, no AI costs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-xl shadow-blue-600/25"
              >
                <Sparkles className="w-4 h-4" />
                Explore Demo
              </Link>
              <Link
                href="/auth/register"
                className="text-slate-300 hover:text-white font-semibold px-8 py-3 rounded-xl border border-slate-700 hover:border-slate-600 hover:bg-slate-800/50 transition-all"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 py-10 border-t border-slate-800/40">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">DocuBot</span>
          </div>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} DocuBot. Your business knowledge,
            instantly accessible.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <span className="hover:text-slate-300 cursor-pointer transition-colors">
              Privacy
            </span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">
              Terms
            </span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">
              Docs
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
