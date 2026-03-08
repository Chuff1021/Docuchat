/**
 * ManualBot Embeddable Widget
 * Lightweight, self-contained chat widget for embedding on any website.
 * 
 * Usage:
 * <script src="https://cdn.manualbot.ai/widget.js" data-bot="wt_xxxxx" async></script>
 */

interface BotConfig {
  bot_id: string;
  name: string;
  greeting: string | null;
  brand_color: string | null;
  logo_url: string | null;
  citation_mode: boolean;
  lead_capture: boolean;
}

interface Citation {
  chunk_id: string;
  document_id: string;
  file_name: string;
  page_number: number | null;
  text_snippet: string;
  score: number | null;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  answer_found?: boolean;
}

const API_BASE = (window as unknown as { MANUALBOT_API?: string }).MANUALBOT_API || "http://localhost:8000";

class ManualBotWidget {
  private token: string;
  private config: BotConfig | null = null;
  private sessionToken: string | null = null;
  private messages: ChatMessage[] = [];
  private container: HTMLElement | null = null;
  private isOpen = false;
  private isLoading = false;

  constructor(token: string) {
    this.token = token;
  }

  async init() {
    try {
      const response = await fetch(`${API_BASE}/api/v1/widget/chat/${this.token}/config`);
      if (!response.ok) throw new Error("Failed to load bot config");
      this.config = await response.json();
      this.render();
    } catch (err) {
      console.error("[ManualBot] Failed to initialize widget:", err);
    }
  }

  private get brandColor(): string {
    return this.config?.brand_color || "#6366f1";
  }

  private render() {
    // Inject styles
    const style = document.createElement("style");
    style.textContent = this.getStyles();
    document.head.appendChild(style);

    // Create container
    this.container = document.createElement("div");
    this.container.id = "manualbot-widget";
    this.container.innerHTML = this.getHTML();
    document.body.appendChild(this.container);

    this.bindEvents();
  }

  private getStyles(): string {
    return `
      #manualbot-widget * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      #manualbot-widget { position: fixed; bottom: 20px; right: 20px; z-index: 999999; }
      
      .mb-bubble {
        width: 52px; height: 52px;
        background: ${this.brandColor};
        border-radius: 50%;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: transform 0.2s, box-shadow 0.2s;
        border: none; outline: none;
      }
      .mb-bubble:hover { transform: scale(1.05); box-shadow: 0 6px 16px rgba(0,0,0,0.2); }
      .mb-bubble svg { width: 24px; height: 24px; fill: white; }
      
      .mb-window {
        position: absolute; bottom: 64px; right: 0;
        width: 360px; height: 520px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        display: flex; flex-direction: column;
        overflow: hidden;
        transform-origin: bottom right;
        transition: transform 0.2s, opacity 0.2s;
      }
      .mb-window.mb-hidden { transform: scale(0.9); opacity: 0; pointer-events: none; }
      
      .mb-header {
        background: ${this.brandColor};
        padding: 14px 16px;
        display: flex; align-items: center; gap: 10px;
        flex-shrink: 0;
      }
      .mb-header-avatar {
        width: 32px; height: 32px;
        background: rgba(255,255,255,0.2);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 14px; font-weight: bold; color: white;
      }
      .mb-header-name { color: white; font-weight: 600; font-size: 14px; }
      .mb-header-status { color: rgba(255,255,255,0.7); font-size: 11px; }
      .mb-close {
        margin-left: auto; background: none; border: none;
        color: rgba(255,255,255,0.7); cursor: pointer; padding: 4px;
        font-size: 18px; line-height: 1;
      }
      .mb-close:hover { color: white; }
      
      .mb-messages {
        flex: 1; overflow-y: auto; padding: 16px;
        display: flex; flex-direction: column; gap: 12px;
        background: #f9f9f8;
      }
      .mb-messages::-webkit-scrollbar { width: 4px; }
      .mb-messages::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
      
      .mb-msg { display: flex; gap: 8px; max-width: 85%; }
      .mb-msg.mb-user { flex-direction: row-reverse; align-self: flex-end; }
      .mb-msg.mb-assistant { align-self: flex-start; }
      
      .mb-msg-bubble {
        padding: 10px 12px; border-radius: 12px;
        font-size: 13px; line-height: 1.5;
      }
      .mb-user .mb-msg-bubble { background: ${this.brandColor}; color: white; border-radius: 12px 12px 2px 12px; }
      .mb-assistant .mb-msg-bubble { background: white; color: #1c1917; border: 1px solid #e7e5e4; border-radius: 12px 12px 12px 2px; }
      
      .mb-citations { margin-top: 6px; }
      .mb-citation {
        font-size: 11px; color: #78716c;
        background: #f5f5f4; border-radius: 6px;
        padding: 4px 8px; margin-top: 3px;
        border-left: 2px solid ${this.brandColor};
      }
      
      .mb-typing { display: flex; gap: 4px; padding: 10px 12px; }
      .mb-typing span {
        width: 6px; height: 6px; background: #a8a29e;
        border-radius: 50%; animation: mb-bounce 1.2s infinite;
      }
      .mb-typing span:nth-child(2) { animation-delay: 0.2s; }
      .mb-typing span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes mb-bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }
      
      .mb-input-area {
        padding: 12px; border-top: 1px solid #e7e5e4;
        display: flex; gap: 8px; background: white; flex-shrink: 0;
      }
      .mb-input {
        flex: 1; border: 1px solid #e7e5e4; border-radius: 8px;
        padding: 8px 12px; font-size: 13px; outline: none;
        resize: none; max-height: 80px;
        transition: border-color 0.15s;
      }
      .mb-input:focus { border-color: ${this.brandColor}; }
      .mb-send {
        width: 36px; height: 36px; flex-shrink: 0;
        background: ${this.brandColor}; border: none; border-radius: 8px;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: opacity 0.15s;
      }
      .mb-send:disabled { opacity: 0.5; cursor: not-allowed; }
      .mb-send svg { width: 16px; height: 16px; fill: white; }
      
      .mb-greeting {
        text-align: center; padding: 20px 16px;
        color: #78716c; font-size: 13px;
      }
      .mb-greeting strong { display: block; color: #1c1917; font-size: 15px; margin-bottom: 4px; }
      
      @media (max-width: 480px) {
        .mb-window { width: calc(100vw - 24px); right: -8px; }
      }
    `;
  }

  private getHTML(): string {
    const name = this.config?.name || "Support";
    const greeting = this.config?.greeting || "Hi! How can I help you today?";

    return `
      <div class="mb-window mb-hidden" id="mb-window">
        <div class="mb-header">
          <div class="mb-header-avatar">${name[0]}</div>
          <div>
            <div class="mb-header-name">${name}</div>
            <div class="mb-header-status">● Online</div>
          </div>
          <button class="mb-close" id="mb-close">×</button>
        </div>
        <div class="mb-messages" id="mb-messages">
          <div class="mb-greeting">
            <strong>${name}</strong>
            ${greeting}
          </div>
        </div>
        <div class="mb-input-area">
          <textarea
            class="mb-input"
            id="mb-input"
            placeholder="Ask a question..."
            rows="1"
          ></textarea>
          <button class="mb-send" id="mb-send">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>
      <button class="mb-bubble" id="mb-bubble" aria-label="Open chat">
        <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
      </button>
    `;
  }

  private bindEvents() {
    const bubble = document.getElementById("mb-bubble");
    const closeBtn = document.getElementById("mb-close");
    const sendBtn = document.getElementById("mb-send");
    const input = document.getElementById("mb-input") as HTMLTextAreaElement;

    bubble?.addEventListener("click", () => this.toggle());
    closeBtn?.addEventListener("click", () => this.close());
    sendBtn?.addEventListener("click", () => this.sendMessage());
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  private toggle() {
    this.isOpen ? this.close() : this.open();
  }

  private open() {
    this.isOpen = true;
    document.getElementById("mb-window")?.classList.remove("mb-hidden");
    document.getElementById("mb-input")?.focus();
  }

  private close() {
    this.isOpen = false;
    document.getElementById("mb-window")?.classList.add("mb-hidden");
  }

  private appendMessage(msg: ChatMessage) {
    const container = document.getElementById("mb-messages");
    if (!container) return;

    const div = document.createElement("div");
    div.className = `mb-msg mb-${msg.role}`;

    let citationsHTML = "";
    if (msg.citations && msg.citations.length > 0 && this.config?.citation_mode) {
      citationsHTML = `<div class="mb-citations">`;
      for (const c of msg.citations.slice(0, 3)) {
        const page = c.page_number ? ` · p.${c.page_number}` : "";
        citationsHTML += `<div class="mb-citation">📄 ${c.file_name}${page}</div>`;
      }
      citationsHTML += `</div>`;
    }

    div.innerHTML = `
      <div class="mb-msg-bubble">
        ${msg.content}
        ${citationsHTML}
      </div>
    `;

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  private showTyping() {
    const container = document.getElementById("mb-messages");
    if (!container) return;
    const div = document.createElement("div");
    div.className = "mb-msg mb-assistant";
    div.id = "mb-typing";
    div.innerHTML = `<div class="mb-msg-bubble mb-typing"><span></span><span></span><span></span></div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  private hideTyping() {
    document.getElementById("mb-typing")?.remove();
  }

  private async sendMessage() {
    const input = document.getElementById("mb-input") as HTMLTextAreaElement;
    const sendBtn = document.getElementById("mb-send") as HTMLButtonElement;
    const message = input?.value.trim();

    if (!message || this.isLoading) return;

    input.value = "";
    this.isLoading = true;
    if (sendBtn) sendBtn.disabled = true;

    this.appendMessage({ role: "user", content: message });
    this.showTyping();

    try {
      const response = await fetch(`${API_BASE}/api/v1/widget/chat/${this.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          session_token: this.sessionToken,
        }),
      });

      if (!response.ok) throw new Error("Chat request failed");
      const data = await response.json();

      if (!this.sessionToken) {
        this.sessionToken = data.session_token;
      }

      this.hideTyping();
      this.appendMessage({
        role: "assistant",
        content: data.answer,
        citations: data.citations,
        answer_found: data.answer_found,
      });
    } catch (err) {
      this.hideTyping();
      this.appendMessage({
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        answer_found: false,
      });
    } finally {
      this.isLoading = false;
      if (sendBtn) sendBtn.disabled = false;
      input?.focus();
    }
  }
}

// Auto-initialize from script tag
function autoInit() {
  const scripts = document.querySelectorAll<HTMLScriptElement>(
    'script[data-bot]'
  );

  scripts.forEach((script) => {
    const token = script.getAttribute("data-bot");
    if (token) {
      const widget = new ManualBotWidget(token);
      widget.init();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoInit);
} else {
  autoInit();
}

export { ManualBotWidget };
