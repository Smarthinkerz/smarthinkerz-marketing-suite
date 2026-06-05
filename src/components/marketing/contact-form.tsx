"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { submitContact } from "@/app/contact/actions";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await submitContact({
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      message: String(form.get("message") ?? ""),
    });
    if (res.ok) {
      setStatus("sent");
    } else {
      setStatus("error");
      setError(res.error ?? "Failed to send. Please try again.");
    }
  }

  if (status === "sent") {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 text-center">
        <CheckCircle2 className="h-12 w-12 text-success" />
        <h3 className="text-lg font-semibold text-foreground">Message received</h3>
        <p className="text-sm text-muted">
          Thanks for reaching out — we&apos;ll get back to you soon.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required placeholder="Your name" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required placeholder="you@company.com" />
        </div>
        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" name="message" required placeholder="How can we help?" />
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
        <Button type="submit" className="w-full" loading={status === "sending"}>
          Send message
        </Button>
      </form>
    </Card>
  );
}
