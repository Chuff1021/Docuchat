"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { chatApi } from "@/lib/api";
import type { ChatResponse, Citation } from "@/types";
import {
  Send,
  ChevronRight,
  Bot as BotIcon,
  User,
  BookOpen,
  AlertCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MessageSquare,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  sources?: string[];
  answer_found?: boolean;
  confidence?: string | null;
  timestamp: Date;
}

function CitationCard({ citation }: { citation: Citation }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-slate-700/60 rounded-xl overflow-hidden text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-800/60 hover:bg-slate-800 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="w-3 h-3 text-indigo-400 flex-shrink-0" />
          <span className="font-medium text-slate-300 truncate">
            {citation.file_name}
            {citation.page_number && (
              <span className="text-slate-500 ml-1">· p.{citation.page_number}</span>
            )}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-3 h-3 text-slate-500 flex-shrink-0 ml-2" />
        ) : (
          <ChevronDown className="w-3 h-3 text-slate-500 flex-shrink-0 ml-2" />
        )}
      </button>
      {expanded && (
        <div className="px-3 py-2.5 text-slate-400 bg-slate-900/60 leading-relaxed border-t border-slate-700/60">
          {citation.text_snippet}
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
        <BotIcon className="w-4 h-4 text-indigo-400" />
      </div>
      <div className="bg-slate-800 border border-slate-700/60 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center h-4">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-500 typing-dot" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-500 typing-dot" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-500 typing-dot" />
        </div>
      </div>
    </div>
  );
}

const SUGGESTED_QUESTIONS = [
  "What are the main features?",
  "How do I get started?",
  "What are the system requirements?",
  "How do I troubleshoot issues?",
];

export default function ChatPage() {
  const params = useParams();
  const botId = params.botId as string;
  const { organization, accessToken } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading || !organization || !accessToken) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await chatApi.send(
        organization.id,
        botId,
        { message: messageText, session_token: sessionToken },
        accessToken
      );

      if (!sessionToken) {
        setSessionToken(response.session_token);
      }

      const assistantMsg: Message = {
        id: response.message_id,
        role: "assistant",
        content: response.answer,
        citations: response.citations,
        sources: response.sources,
        answer_found: response.answer_found,
        confidence: response.confidence,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        answer_found: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionToken(undefined);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-slate-500 px-6 py-3.5 border-b border-slate-800/60 bg-slate-900/80 backdrop-blur-sm flex-shrink-0">
        <Link href="/dashboard/bots" className="hover:text-slate-300 transition-colors">
          Bots
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/dashboard/bots/${botId}`} className="hover:text-slate-300 transition-colors">
          Bot
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-300 font-medium">Test Chat</span>

        <div className="ml-auto flex items-center gap-2">
          {messages.length > 0 && (
            <span className="text-xs text-slate-600">
              {messages.length} message{messages.length !== 1 ? "s" : ""}
            </span>
          )}
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 px-3 py-1.5 rounded-lg transition-all"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white mb-1">Start a conversation</p>
              <p className="text-slate-400 text-sm">
                Ask questions about your uploaded documents
              </p>
            </div>

            {/* Suggested questions */}
            <div className="grid grid-cols-2 gap-2 max-w-lg w-full">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left text-sm text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800/60 hover:border-slate-700 rounded-xl px-4 py-3 transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400 mb-1.5" />
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20"
                  : "bg-slate-800 border border-slate-700"
              }`}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <BotIcon className="w-4 h-4 text-indigo-400" />
              )}
            </div>

            <div
              className={`max-w-2xl flex flex-col gap-2 ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              {/* Message bubble */}
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-sm shadow-lg shadow-indigo-500/20"
                    : "bg-slate-800 border border-slate-700/60 text-slate-200 rounded-tl-sm"
                }`}
              >
                {msg.content}
              </div>

              {/* Timestamp */}
              <p className="text-xs text-slate-600 px-1">
                {msg.timestamp.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>

              {/* Citations */}
              {msg.role === "assistant" && msg.citations && msg.citations.length > 0 && (
                <div className="w-full space-y-1.5 mt-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 px-1">
                    <BookOpen className="w-3 h-3" />
                    <span>{msg.citations.length} source{msg.citations.length !== 1 ? "s" : ""}</span>
                  </div>
                  {msg.citations.map((c, i) => (
                    <CitationCard key={i} citation={c} />
                  ))}
                </div>
              )}

              {/* Not found warning */}
              {msg.role === "assistant" && msg.answer_found === false && (
                <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                  <AlertCircle className="w-3 h-3" />
                  Answer not found in documents
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-6 py-4 bg-slate-900/80 backdrop-blur-sm border-t border-slate-800/60 flex-shrink-0">
        <div className="flex gap-3 max-w-3xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your documents..."
              rows={1}
              className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:bg-slate-800 resize-none transition-colors"
              style={{ minHeight: "44px", maxHeight: "120px" }}
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-600 text-center mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
