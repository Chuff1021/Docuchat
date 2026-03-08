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
  Loader2,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  sources?: string[];
  answer_found?: boolean;
  confidence?: string | null;
}

function CitationCard({ citation }: { citation: Citation }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-stone-50 hover:bg-stone-100 transition-colors text-left"
      >
        <span className="font-medium text-stone-700 truncate">
          {citation.file_name}
          {citation.page_number && ` · p.${citation.page_number}`}
        </span>
        <span className="text-stone-400 ml-2 flex-shrink-0">
          {expanded ? "▲" : "▼"}
        </span>
      </button>
      {expanded && (
        <div className="px-3 py-2 text-stone-600 bg-white">
          {citation.text_snippet}
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  const params = useParams();
  const botId = params.botId as string;
  const { organization, accessToken } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading || !organization || !accessToken) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await chatApi.send(
        organization.id,
        botId,
        { message: userMsg.content, session_token: sessionToken },
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
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        answer_found: false,
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

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-stone-400 px-8 py-4 border-b border-stone-200 bg-white">
        <Link href="/dashboard/bots" className="hover:text-stone-600">Bots</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/dashboard/bots/${botId}`} className="hover:text-stone-600">Bot</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-stone-700">Test Chat</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => { setMessages([]); setSessionToken(undefined); }}
            className="text-xs text-stone-400 hover:text-stone-600 border border-stone-200 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors"
          >
            Clear chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 bg-stone-50">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <BotIcon className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500 font-medium">Start a conversation</p>
            <p className="text-stone-400 text-sm mt-1">
              Ask a question about your uploaded documents
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-stone-200 text-stone-600"
              }`}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <BotIcon className="w-4 h-4" />
              )}
            </div>

            <div className={`max-w-2xl ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-2`}>
              <div
                className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-stone-200 text-stone-800"
                }`}
              >
                {msg.content}
              </div>

              {/* Citations */}
              {msg.role === "assistant" && msg.citations && msg.citations.length > 0 && (
                <div className="w-full space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-stone-400">
                    <BookOpen className="w-3 h-3" />
                    <span>Sources ({msg.citations.length})</span>
                  </div>
                  {msg.citations.map((c, i) => (
                    <CitationCard key={i} citation={c} />
                  ))}
                </div>
              )}

              {/* Not found warning */}
              {msg.role === "assistant" && msg.answer_found === false && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600">
                  <AlertCircle className="w-3 h-3" />
                  Answer not found in documents
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center">
              <BotIcon className="w-4 h-4 text-stone-600" />
            </div>
            <div className="bg-white border border-stone-200 rounded-xl px-4 py-3">
              <Loader2 className="w-4 h-4 text-stone-400 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-8 py-4 bg-white border-t border-stone-200">
        <div className="flex gap-3 max-w-3xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your documents..."
            rows={1}
            className="flex-1 px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-11 h-11 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-stone-400 text-center mt-2">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
