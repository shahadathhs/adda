"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { resetPassword } from "@adda/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setPending(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setPending(false);
    }
  };

  if (!token) {
    return (
      <p className="text-sm text-muted-foreground">
        This link is missing its token — request a new reset email from the sign-in page.
      </p>
    );
  }

  if (done) {
    return <p className="text-sm">Password updated — redirecting you to sign in…</p>;
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      <Input
        required
        type="password"
        minLength={8}
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Input
        required
        type="password"
        minLength={8}
        placeholder="Confirm new password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      <Button variant="primary" type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Reset password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm p-6">
        <h1 className="mb-4 font-semibold">Reset your password</h1>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <ResetForm />
        </Suspense>
      </Card>
    </div>
  );
}
