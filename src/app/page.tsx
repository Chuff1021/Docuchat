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
  Layers,
} from "lucide-react";

function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
  iconBg,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  iconBg: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 border border-slate-700/50 hover-lift group ${gradient}`}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/5 to-transparent" />
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg} shadow-lg mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
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
    <div className="relative flex flex-col items-center text-center group">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center mb-4 group-hover:border-indigo-500/40 transition-colors">
        <Icon className="w-7 h-7 text-indigo-400" />
      </div>
      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-indigo-500/30">
        {step}
      </div>
      <h3 className="text-base font-bold text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Zap className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">ManualBot</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm text-slate-400 hover:text-slate-200 font-medium transition-colors px-3 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
            >
              Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-indigo-500/8 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-pink-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-8">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-300">AI-Powered Documentation Chatbots</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
            <span className="gradient-text">Turn your docs</span>
            <br />
            <span className="text-white">into an AI chatbot</span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your PDFs, and ManualBot creates an intelligent chatbot that answers
            questions from your documentation. Embed it on your website in minutes.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold px-8 py-3.5 rounded-xl text-base transition-all shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40"
            >
              <Sparkles className="w-4 h-4" />
              Try the Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/register"
              className="flex items-center gap-2 text-slate-300 hover:text-white font-semibold px-8 py-3.5 rounded-xl text-base border border-slate-700 hover:border-slate-600 hover:bg-slate-800/50 transition-all"
            >
              Create Account
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[
              { value: "4,826", label: "Chunks Indexed" },
              { value: "1,284", label: "Conversations" },
              { value: "96%", label: "Resolution Rate" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-2xl border border-slate-700/50 bg-slate-900/80 overflow-hidden shadow-2xl shadow-indigo-500/5">
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/80 border-b border-slate-700/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-slate-700/60 rounded-lg px-4 py-1 text-xs text-slate-400 font-mono">
                  app.manualbot.ai/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard mockup */}
            <div className="p-6 space-y-4">
              {/* Stat cards row */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Documents", value: "23", color: "from-blue-950/80 to-slate-900", icon: "📄" },
                  { label: "Chunks", value: "4,826", color: "from-violet-950/80 to-slate-900", icon: "🧩" },
                  { label: "Chats Today", value: "47", color: "from-indigo-950/80 to-slate-900", icon: "💬" },
                  { label: "Active Bots", value: "2", color: "from-emerald-950/80 to-slate-900", icon: "🤖" },
                ].map(({ label, value, color, icon }) => (
                  <div key={label} className={`bg-gradient-to-br ${color} rounded-xl p-4 border border-slate-700/30`}>
                    <span className="text-lg">{icon}</span>
                    <p className="text-xl font-bold text-white mt-2">{value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>

              {/* Bot cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: "Support Bot", color: "#6366f1", docs: 12, status: "Active" },
                  { name: "Sales Assistant", color: "#10b981", docs: 8, status: "Active" },
                  { name: "Onboarding Guide", color: "#f59e0b", docs: 3, status: "Draft" },
                ].map(({ name, color, docs, status }) => (
                  <div key={name} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: color }}
                      >
                        {name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-200">{name}</p>
                        <p className="text-xs text-slate-500">{docs} docs · {status}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 border-t border-slate-800/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 mb-4">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-semibold text-purple-300">Features</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">
              Everything you need to build
              <br />
              <span className="gradient-text">intelligent chatbots</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              From document upload to website embedding, ManualBot handles the entire pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={FileText}
              title="PDF Document Upload"
              description="Drag and drop your PDFs. ManualBot automatically extracts, chunks, and indexes the content for AI retrieval."
              gradient="bg-gradient-to-br from-blue-950/60 to-slate-900"
              iconBg="bg-blue-500"
            />
            <FeatureCard
              icon={Bot}
              title="AI-Powered Chat"
              description="GPT-powered chatbot that answers questions accurately from your documentation with source citations."
              gradient="bg-gradient-to-br from-indigo-950/60 to-slate-900"
              iconBg="bg-indigo-500"
            />
            <FeatureCard
              icon={Code2}
              title="Embed Anywhere"
              description="Add the chat widget to any website with a simple code snippet. Works with HTML, React, and more."
              gradient="bg-gradient-to-br from-purple-950/60 to-slate-900"
              iconBg="bg-purple-500"
            />
            <FeatureCard
              icon={BarChart3}
              title="Analytics Dashboard"
              description="Track conversations, top questions, resolution rates, and identify knowledge gaps in your docs."
              gradient="bg-gradient-to-br from-emerald-950/60 to-slate-900"
              iconBg="bg-emerald-500"
            />
            <FeatureCard
              icon={Shield}
              title="Domain Restrictions"
              description="Control exactly which websites can embed your chatbot. Keep your knowledge base secure."
              gradient="bg-gradient-to-br from-amber-950/60 to-slate-900"
              iconBg="bg-amber-500"
            />
            <FeatureCard
              icon={Globe}
              title="Multi-Bot Support"
              description="Create multiple bots for different products, teams, or use cases — each with their own knowledge base."
              gradient="bg-gradient-to-br from-rose-950/60 to-slate-900"
              iconBg="bg-rose-500"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-20 border-t border-slate-800/60">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-4">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-300">How It Works</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">
              Three steps to your
              <br />
              <span className="gradient-text">AI chatbot</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <StepCard
              step={1}
              icon={FileText}
              title="Upload Documents"
              description="Drag and drop your PDF files. They're automatically processed and indexed."
            />
            <StepCard
              step={2}
              icon={MessageSquare}
              title="Test & Configure"
              description="Chat with your bot, adjust settings, and fine-tune the AI behavior."
            />
            <StepCard
              step={3}
              icon={Code2}
              title="Embed & Go Live"
              description="Copy the widget code to your website. Your chatbot is live in seconds."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-6 py-20 border-t border-slate-800/60">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-slate-400">Start free, upgrade when you need more.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800/60 p-6">
              <h3 className="text-lg font-bold text-white mb-1">Free</h3>
              <p className="text-sm text-slate-400 mb-4">Perfect for trying it out</p>
              <p className="text-3xl font-extrabold text-white mb-6">
                $0<span className="text-sm font-normal text-slate-500">/mo</span>
              </p>
              <ul className="space-y-3 mb-6">
                {["1 bot", "5 documents", "100 chats/month", "Basic analytics"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register"
                className="block text-center text-sm font-semibold text-slate-300 border border-slate-700 hover:border-slate-600 hover:bg-slate-800/50 rounded-xl py-2.5 transition-all"
              >
                Get Started
              </Link>
            </div>

            {/* Pro - highlighted */}
            <div className="bg-gradient-to-b from-indigo-950/60 to-slate-900 rounded-2xl border border-indigo-500/30 p-6 relative shadow-xl shadow-indigo-500/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                Most Popular
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Pro</h3>
              <p className="text-sm text-slate-400 mb-4">For growing teams</p>
              <p className="text-3xl font-extrabold text-white mb-6">
                $49<span className="text-sm font-normal text-slate-500">/mo</span>
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  "10 bots",
                  "Unlimited documents",
                  "5,000 chats/month",
                  "Advanced analytics",
                  "Custom branding",
                  "Domain restrictions",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register"
                className="block text-center text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl py-2.5 transition-all shadow-lg shadow-indigo-500/20"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800/60 p-6">
              <h3 className="text-lg font-bold text-white mb-1">Enterprise</h3>
              <p className="text-sm text-slate-400 mb-4">For large organizations</p>
              <p className="text-3xl font-extrabold text-white mb-6">
                Custom
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  "Unlimited bots",
                  "Unlimited everything",
                  "SSO & SAML",
                  "Dedicated support",
                  "SLA guarantee",
                  "On-premise option",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register"
                className="block text-center text-sm font-semibold text-slate-300 border border-slate-700 hover:border-slate-600 hover:bg-slate-800/50 rounded-xl py-2.5 transition-all"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 border-t border-slate-800/60">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-r from-indigo-950/50 to-purple-950/50 border border-indigo-500/20 rounded-2xl p-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-7 h-7 text-indigo-400" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white mb-3">
              Ready to build your AI chatbot?
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Start with the demo dashboard to see ManualBot in action, or create your account to get started.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40"
              >
                <Sparkles className="w-4 h-4" />
                Explore Demo
              </Link>
              <Link
                href="/auth/register"
                className="text-slate-300 hover:text-white font-semibold px-8 py-3 rounded-xl border border-slate-700 hover:border-slate-600 hover:bg-slate-800/50 transition-all"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 border-t border-slate-800/60">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">ManualBot</span>
          </div>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} ManualBot. AI-powered documentation chatbots.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Docs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
