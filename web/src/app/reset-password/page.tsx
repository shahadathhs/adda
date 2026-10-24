"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "@/lib/api";
import { AuthNotice } from "@/components/auth-notice";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { describedBy } from "@/lib/field-aria";
import { Input } from "@/components/ui/input";

function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const mismatch =
    confirm.length > 0 && password !== confirm ? "The passwords do not match." : null;

  const save = useMutation({
    mutationFn: () => resetPassword(token, password),
    onSuccess: () => setTimeout(() => router.push("/login"), 1500),
  });

  if (!token || save.isError) {
    return (
      <div className="mt-5 space-y-4">
        <AuthNotice tone="error">
          This link has expired or was already used.{" "}
          <Link href="/forgot-password" className="text-primary hover:underline">
            Request a new one
          </Link>
        </AuthNotice>
      </div>
    );
  }

  if (save.isSuccess) {
    return (
      <p role="status" className="mt-4 text-sm text-muted-foreground">
        Password saved. Taking you to sign in…
      </p>
    );
  }

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!mismatch) save.mutate();
      }}
    >
      <Field label="New password" htmlFor="password" help="At least 8 characters.">
        <Input
          id="password"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <Field label="Confirm password" htmlFor="confirm" error={mismatch}>
        <Input
          id="confirm"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          {...describedBy("confirm", !!mismatch, mismatch)}
        />
      </Field>
      <Button
        variant="primary"
        size="lg"
        type="submit"
        className="w-full"
        disabled={save.isPending || !password || !!mismatch}
      >
        {save.isPending ? "Saving…" : "Save password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Reset
      </p>
      <h1 className="mt-1 font-display text-[28px] font-bold leading-8 tracking-tight text-foreground">
        Choose a new password
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick something you do not use anywhere else.
      </p>
      <Suspense fallback={<p className="mt-4 text-sm text-muted-foreground">Loading…</p>}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
