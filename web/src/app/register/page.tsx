"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { describedBy } from "@/lib/field-aria";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/lib/session";
import { adoptSessionAfterRegister } from "./register-flow";

type Fields = "username" | "display_name" | "email" | "password";

/** Which field a server message is about, so the error sits under that field. */
const fieldOf = (message: string): Fields | null => {
  const m = message.toLowerCase();
  if (m.includes("username")) return "username";
  if (m.includes("email")) return "email";
  if (m.includes("password")) return "password";
  return null;
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", display_name: "", email: "", password: "" });
  const [error, setError] = useState<{ field: Fields | null; message: string } | null>(null);
  const register = useRegister();

  const set = (key: Fields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [key]: e.target.value });
    if (error?.field === key) setError(null);
  };
  const errorFor = (key: Fields) => (error?.field === key ? error.message : null);

  return (
    <AuthShell>
      <h1 className="font-display text-[28px] font-bold leading-8 tracking-tight text-foreground">
        Create your account
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        An account is needed to chat, react, vote and follow.
      </p>

      <form
        className="mt-7 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          register.mutate(
            { ...form, username: form.username.trim(), email: form.email.trim() },
            {
              onSuccess: async (token) => {
                await adoptSessionAfterRegister(token);
                router.push("/");
              },
              onError: (err) => {
                const message = err instanceof Error ? err.message : "Could not create the account";
                setError({ field: fieldOf(message), message });
              },
            },
          );
        }}
      >
        <Field
          label="Username"
          htmlFor="username"
          help="Letters, numbers and underscores. Used in @mentions."
          error={errorFor("username")}
        >
          <Input
            id="username"
            required
            minLength={3}
            maxLength={50}
            pattern="[a-zA-Z0-9_]+"
            title="Letters, numbers and underscores only"
            autoComplete="username"
            autoFocus
            value={form.username}
            onChange={set("username")}
            {...describedBy("username", true, errorFor("username"))}
          />
        </Field>
        <Field label="Display name" htmlFor="display_name">
          <Input
            id="display_name"
            required
            maxLength={100}
            autoComplete="name"
            value={form.display_name}
            onChange={set("display_name")}
          />
        </Field>
        <Field label="Email" htmlFor="email" error={errorFor("email")}>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set("email")}
            {...describedBy("email", !!errorFor("email"), errorFor("email"))}
          />
        </Field>
        <Field
          label="Password"
          htmlFor="password"
          help="At least 8 characters."
          error={errorFor("password")}
        >
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            value={form.password}
            onChange={set("password")}
            {...describedBy("password", true, errorFor("password"))}
          />
        </Field>
        {error && !error.field && (
          <p role="alert" className="text-xs text-destructive">
            {error.message}
          </p>
        )}
        <Button
          variant="primary"
          size="lg"
          type="submit"
          className="w-full"
          disabled={register.isPending}
        >
          {register.isPending ? "Creating…" : "Create account"}
        </Button>
      </form>

      <p className="mt-5 text-center text-[13px] text-muted-foreground">
        Already registered?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
