"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { changePassword } from "@/lib/api";
import { describedBy } from "@/lib/field-aria";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/** Change the account password; the current one is required. */
export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [currentError, setCurrentError] = useState<string | null>(null);
  const mismatch = confirm.length > 0 && next !== confirm ? "The passwords do not match." : null;

  const save = useMutation({
    mutationFn: () => changePassword(current, next),
    onSuccess: () => {
      toast.success("Password changed");
      setCurrent("");
      setNext("");
      setConfirm("");
    },
    onError: (e) =>
      setCurrentError(e instanceof Error ? e.message : "Could not change the password"),
  });

  return (
    <form
      className="space-y-5 rounded-md border border-border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        setCurrentError(null);
        save.mutate();
      }}
    >
      <Field label="Current password" htmlFor="current" error={currentError}>
        <Input
          id="current"
          type="password"
          required
          autoComplete="current-password"
          value={current}
          onChange={(e) => {
            setCurrent(e.target.value);
            setCurrentError(null);
          }}
          {...describedBy("current", !!currentError, currentError)}
        />
      </Field>
      <Field label="New password" htmlFor="next" help="At least 8 characters.">
        <Input
          id="next"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
      </Field>
      <Field label="Confirm new password" htmlFor="confirm" error={mismatch}>
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
      <div className="flex justify-end">
        <Button
          variant="primary"
          type="submit"
          disabled={save.isPending || !current || next.length < 8 || !!mismatch}
        >
          {save.isPending ? "Saving…" : "Change password"}
        </Button>
      </div>
    </form>
  );
}
