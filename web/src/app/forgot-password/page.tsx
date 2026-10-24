"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { authConfig, forgotPassword } from "@/lib/api";
import { AuthNotice } from "@/components/auth-notice";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const { data: config } = useQuery({ queryKey: ["auth-config"], queryFn: authConfig });
  const send = useMutation({ mutationFn: () => forgotPassword(email.trim()) });
  const minutes = config?.reset_link_minutes ?? 30;
  const noEmail = config?.email_enabled === false;

  return (
    <AuthShell>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {send.isSuccess ? "Sent" : "Request"}
      </p>
      <h1 className="mt-1 font-display text-[28px] font-bold leading-8 tracking-tight text-foreground">
        {send.isSuccess ? "Check your inbox" : "Reset your password"}
      </h1>

      {send.isSuccess ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            If an account exists for <span className="font-semibold text-foreground">{email}</span>,
            a reset link is on its way. It can take a minute.
          </p>
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3.5 py-2.5 text-[13px]">
            <Check className="h-4 w-4" aria-hidden="true" />
            Link valid for <span className="font-num">{minutes} minutes</span>
          </div>
          <p className="text-xs text-muted-foreground/80">
            Nothing arrived? Check spam, or ask the person who runs this server.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted-foreground">
            We will email you a link that works for {minutes} minutes.
          </p>
          {noEmail && (
            <div className="mt-5">
              <AuthNotice tone="warn">
                Email is not set up on this server, so reset links can&apos;t be sent. Ask the host
                to reset your password.
              </AuthNotice>
            </div>
          )}
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              send.mutate();
            }}
          >
            <Field
              label="Email"
              htmlFor="email"
              error={send.isError ? "Could not send the link. Try again." : null}
            >
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
            <Button
              variant="primary"
              size="lg"
              type="submit"
              className="w-full"
              disabled={send.isPending || !email || noEmail}
            >
              {send.isPending ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        </>
      )}

      <p className="mt-5 text-center text-[13px] text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
