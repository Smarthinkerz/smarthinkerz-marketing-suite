"use client";

import { useRef, useState } from "react";
import { Send, Bot, User as UserIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { SetupNotice } from "@/components/setup-notice";
import { sendChat, type ChatTurn } from "./actions";

export function ChatbotClient() {
  const [business, setBusiness] = useState("");
  const [persona, setPersona] = useState(
    "Friendly, concise, and professional. Always offer next steps.",
  );
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setup, setSetup] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send() {
    const text = draft.trim();
    if (!text || loading) return;
    setError(null);
    const history = [...messages, { role: "user" as const, content: text }];
    setMessages(history);
    setDraft("");
    setLoading(true);

    const res = await sendChat({ persona, business, history, message: text });
    setLoading(false);

    if (!res.ok) {
      if (res.setup) setSetup(true);
      else setError(res.error ?? "Failed to get a reply.");
      return;
    }
    setMessages((m) => [...m, { role: "assistant", content: res.reply ?? "" }]);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card className="space-y-4">
        <div>
          <Label htmlFor="business">Business name / description</Label>
          <Input
            id="business"
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
            placeholder="e.g. Acme SaaS — project management tool"
          />
        </div>
        <div>
          <Label htmlFor="persona">Bot persona & instructions</Label>
          <Textarea
            id="persona"
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            placeholder="Describe tone, do's and don'ts, escalation rules…"
          />
        </div>
        <p className="text-xs text-muted">
          Settings apply to the live preview on the right. Deploy options (web widget
          embed) are available on Business and Enterprise plans.
        </p>
      </Card>

      <Card className="flex h-[560px] flex-col">
        {setup ? (
          <SetupNotice
            service="OpenAI"
            hint="Add your OPENAI_API_KEY to enable the live chatbot preview."
          />
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-1">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center text-muted">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Bot className="h-7 w-7" />
                  </span>
                  <p className="mt-4 font-semibold text-foreground">Test your assistant</p>
                  <p className="mt-1 max-w-xs text-sm">
                    Send a message as a customer to preview responses.
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      m.role === "user" ? "bg-surface-2 text-foreground" : "gradient-brand text-white"
                    }`}
                  >
                    {m.role === "user" ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </span>
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                      m.role === "user"
                        ? "bg-primary text-white"
                        : "bg-surface-2 text-foreground"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full gradient-brand text-white">
                    <Bot className="h-4 w-4" />
                  </span>
                  <div className="rounded-2xl bg-surface-2 px-4 py-3">
                    <span className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted" />
                    </span>
                  </div>
                </div>
              )}
            </div>

            {error && <p className="py-2 text-center text-sm text-error">{error}</p>}

            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Type a customer message…"
                className="flex-1 rounded-full border border-border bg-surface-2 px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              <Button size="icon" onClick={send} loading={loading} aria-label="Send">
                {!loading && <Send className="h-4 w-4" />}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
