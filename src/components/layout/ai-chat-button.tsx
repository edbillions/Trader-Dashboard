"use client";

import { useRef, useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function AiChatButton() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function sendMessage() {
    const text = input.trim();
    if (!text || isStreaming) return;

    setError(null);
    setInput("");
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setIsStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Something went wrong.");
        setMessages(nextMessages);
        setIsStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages([
          ...nextMessages,
          { role: "assistant", content: accumulated },
        ]);
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      }
    } catch {
      setError("Something went wrong.");
      setMessages(nextMessages);
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 flex h-96 w-80 flex-col rounded-xl border border-border bg-surface-raised shadow-xl">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Ask AI</p>
          </div>
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-3 text-sm"
          >
            {messages.length === 0 && (
              <p className="text-muted">
                Ask about your trades, sessions, patterns, discipline, or
                your business and personal goals — e.g. &quot;How am I
                tracking on my goals this month?&quot;
              </p>
            )}
            <div className="flex flex-col gap-3">
              {messages.map((m, i) => (
                <div key={i}>
                  <p className="text-xs font-medium text-muted">
                    {m.role === "user" ? "You" : "AI"}
                  </p>
                  <p className="whitespace-pre-line text-foreground">
                    {m.content || (isStreaming ? "..." : "")}
                  </p>
                </div>
              ))}
            </div>
            {error && <p className="mt-2 text-xs text-loss">{error}</p>}
          </div>
          <div className="flex gap-2 border-t border-border p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask a question..."
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={isStreaming}
              className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              Send
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-transform hover:scale-105"
        aria-label="Ask AI"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8-1.06 0-2.077-.162-3.02-.462L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z"
          />
        </svg>
      </button>
    </div>
  );
}
