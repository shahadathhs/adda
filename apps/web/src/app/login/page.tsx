"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLogin, useLogin2fa } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const login = useLogin();
  const login2fa = useLogin2fa();

  const done = () => router.push("/");

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15">
            <Radio className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold">Welcome back</h1>
            <p className="text-xs text-muted-foreground">Sign in to watch and chat</p>
          </div>
        </div>

        {tempToken === null ? (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              login.mutate(
                { email: email.trim(), password },
                {
                  onSuccess: (res) => {
                    if ("requires_2fa" in res) setTempToken(res.temp_token);
                    else done();
                  },
                },
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
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              login2fa.mutate({ tempToken, code }, { onSuccess: done });
            }}
          >
            <p className="text-xs text-muted-foreground">
              Enter the 6-digit code sent to your email.
            </p>
            <Input
              inputMode="numeric"
              maxLength={6}
              required
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="text-center tracking-[0.5em]"
            />
            <Button
              variant="primary"
              type="submit"
              className="w-full"
              disabled={login2fa.isPending || code.length !== 6}
            >
              {login2fa.isPending ? "Verifying…" : "Verify"}
            </Button>
            <Button
              variant="ghost"
              type="button"
              className="w-full"
              onClick={() => {
                setTempToken(null);
                setCode("");
              }}
            >
              Back
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-muted-foreground">
          No account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Create one
          </Link>
        </p>
      </Card>
    </div>
  );
}
