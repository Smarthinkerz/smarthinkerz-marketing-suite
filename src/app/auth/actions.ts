"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { config } from "@/lib/config";

const signUpSchema = z.object({
  fullName: z.string().min(1, "Please enter your name").max(120),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export type AuthResult = { ok: boolean; error?: string };

export async function signUpAction(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  if (!supabase) {
    return {
      ok: false,
      error:
        "Authentication is not configured yet. Add your Supabase keys to enable sign up.",
    };
  }

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${config.appUrl}/auth/callback`,
    },
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signInAction(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  if (!supabase) {
    return {
      ok: false,
      error:
        "Authentication is not configured yet. Add your Supabase keys to enable sign in.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}
