"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { describedBy } from "@/lib/field-aria";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const login = useLogin();

  return (
    <AuthShell>
      <h1 className="font-display text-[28px] font-bold leading-8 tracking-tight text-foreground">
        Welcome back
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to chat, follow and get alerts.</p>

      <form
        className="mt-7 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          login.mutate(
            { email: email.trim(), password },
            {
              onSuccess: () => router.push("/"),
              onError: (err) => setError(err instanceof Error ? err.message : "Could not sign in"),
            },
          );
        }}
      >
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            autoFocus
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="password" error={error}>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            {...describedBy("password", !!error, error)}
          />
        </Field>
        <p className="text-right text-xs">
          <Link href="/forgot-password" className="text-primary hover:underline">
            Forgot password?
          </Link>
        </p>
        <Button
          variant="primary"
          size="lg"
          type="submit"
          className="w-full"
          disabled={login.isPending || !email || !password}
        >
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-5 text-center text-[13px] text-muted-foreground">
        No account yet?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Create one
        </Link>
      </p>
      <p className="mt-5 border-t border-border pt-5 text-center text-xs text-muted-foreground/80">
        Just looking? You can watch any public channel without an account.
      </p>
    </AuthShell>
  );
}
