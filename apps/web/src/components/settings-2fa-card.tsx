"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { disable2fa, enable2fa, enable2faVerify } from "@adda/api-client";
import type { User } from "@adda/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function TwoFactorCard({ user }: { user: User }) {
  const [code, setCode] = useState("");
  const [challenged, setChallenged] = useState(false);
  const [password, setPassword] = useState("");

  const enable = useMutation({
    mutationFn: () => enable2fa(),
    onSuccess: () => {
      setChallenged(true);
      toast.info("Check your email for a 6-digit code.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to start 2FA"),
  });
  const verify = useMutation({
    mutationFn: () => enable2faVerify(code),
    onSuccess: () => toast.success("Two-factor authentication enabled"),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Verification failed"),
  });
  const disable = useMutation({
    mutationFn: () => disable2fa(password),
    onSuccess: () => {
      toast.success("Two-factor authentication disabled");
      setPassword("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Disable failed"),
  });

  return (
    <Card className="space-y-3 p-4">
      <h2 className="font-display font-bold tracking-tight">
        Two-factor authentication {user.two_factor_enabled ? "· enabled" : "· disabled"}
      </h2>
      {!user.two_factor_enabled ? (
        challenged ? (
          <div className="flex gap-2">
            <Input
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-32"
              aria-label="Two-factor code"
            />
            <Button
              variant="primary"
              size="sm"
              disabled={code.length !== 6 || verify.isPending}
              onClick={() => verify.mutate()}
            >
              Verify & enable
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={enable.isPending}
            onClick={() => enable.mutate()}
          >
            Enable 2FA (email codes)
          </Button>
        )
      ) : (
        <div className="flex gap-2">
          <Input
            type="password"
            placeholder="Confirm with your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-label="Confirm password to disable 2FA"
          />
          <Button
            variant="danger"
            size="sm"
            disabled={!password || disable.isPending}
            onClick={() => disable.mutate()}
          >
            Disable
          </Button>
        </div>
      )}
    </Card>
  );
}
