"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/lib/session";
import { AuthShell } from "@/components/auth-shell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();

  return (
    <AuthShell>
      <div className="flex min-h-screen items-center justify-center p-6 py-24">
        <Card className="w-full max-w-sm p-6">
          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15">
              <Radio className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold tracking-tight">Welcome back</h1>
              <p className="text-xs text-muted-foreground">Sign in to watch and chat</p>
            </div>
          </div>

          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              login.mutate(
                { email: email.trim(), password },
                { onSuccess: () => router.push("/") },
              );
            }}
          >
            <Input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              variant="primary"
              type="submit"
              className="w-full"
              disabled={login.isPending || !email || !password}
            >
              {login.isPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Link href="/forgot-password" className="hover:underline">
              Forgot password?
            </Link>
            {" · "}
            No account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Create one
            </Link>
          </p>
        </Card>
      </div>
    </AuthShell>
  );
}
