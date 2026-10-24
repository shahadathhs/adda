"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { forgotPassword } from "@/lib/api";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reset link");
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthShell>
      <div className="flex min-h-screen items-center justify-center p-6 py-24">
        <Card className="w-full max-w-sm space-y-4 p-6">
          <h1 className="font-display text-lg font-bold tracking-tight">Reset your password</h1>
          {sent ? (
            <p className="text-sm text-muted-foreground">
              If that account exists, a reset link is on its way. Check your inbox.
            </p>
          ) : (
            <form className="space-y-3" onSubmit={submit}>
              <Input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                variant="primary"
                type="submit"
                className="w-full"
                disabled={pending || !email}
              >
                {pending ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}
          <p className="text-center text-xs text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </Card>
      </div>
    </AuthShell>
  );
}
