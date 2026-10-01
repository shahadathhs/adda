"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  changePassword,
  disable2fa,
  enable2fa,
  enable2faVerify,
  setPassword as setPasswordApi,
  updateProfile,
} from "@adda/api-client";
import type { User } from "@adda/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RequireAuth, TopBar } from "@/components/top-bar";
import { useMe } from "@/lib/session";
import { apiBaseUrl } from "@adda/shared";

function ProfileSection({ user }: { user: User }) {
  const [form, setForm] = useState({
    display_name: user.display_name,
    username: user.username,
    bio: user.bio ?? "",
  });
  const save = useMutation({
    mutationFn: () =>
      updateProfile({
        display_name: form.display_name,
        username: form.username,
        bio: form.bio || null,
      }),
    onSuccess: () => toast.success("Profile saved"),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });
  return (
    <Card className="space-y-3 p-4">
      <h2 className="font-semibold">Profile</h2>
      <Input
        placeholder="Display name"
        value={form.display_name}
        onChange={(e) => setForm({ ...form, display_name: e.target.value })}
      />
      <Input
        placeholder="Username"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
      />
      <Input
        placeholder="Bio"
        value={form.bio}
        onChange={(e) => setForm({ ...form, bio: e.target.value })}
      />
      <Button variant="primary" size="sm" disabled={save.isPending} onClick={() => save.mutate()}>
        {save.isPending ? "Saving…" : "Save profile"}
      </Button>
    </Card>
  );
}

function PasswordSection({ hasPassword }: { hasPassword: boolean }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const change = useMutation({
    mutationFn: () => changePassword(current, next),
    onSuccess: () => {
      toast.success("Password changed");
      setCurrent("");
      setNext("");
      setConfirm("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Change failed"),
  });
  const setInitial = useMutation({
    mutationFn: () => setPasswordApi(next),
    onSuccess: () => {
      toast.success("Password set");
      setNext("");
      setConfirm("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not set password"),
  });

  return (
    <Card className="space-y-3 p-4">
      <h2 className="font-semibold">{hasPassword ? "Change password" : "Set a password"}</h2>
      {hasPassword && (
        <Input
          type="password"
          placeholder="Current password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      )}
      <Input
        type="password"
        placeholder="New password (min 8)"
        value={next}
        onChange={(e) => setNext(e.target.value)}
      />
      <Input
        type="password"
        placeholder="Confirm new password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      <Button
        variant="primary"
        size="sm"
        disabled={next.length < 8 || next !== confirm || (hasPassword && !current)}
        onClick={() => (hasPassword ? change.mutate() : setInitial.mutate())}
      >
        {hasPassword ? "Change password" : "Set password"}
      </Button>
    </Card>
  );
}

function TwoFactorSection({ user }: { user: User }) {
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
      <h2 className="font-semibold">
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

export default function SettingsPage() {
  const { data: user } = useMe();

  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="mb-4 text-2xl font-bold">Settings</h1>
        <RequireAuth>
          {user && (
            <div className="grid gap-4 lg:grid-cols-2">
              <ProfileSection user={user} />
              <PasswordSection hasPassword={user.has_password} />
              <TwoFactorSection user={user} />
              <Card className="space-y-2 p-4 text-sm text-muted-foreground">
                <h2 className="font-semibold text-foreground">Connection</h2>
                <p>
                  Server: <span className="font-mono text-xs">{apiBaseUrl()}</span>
                </p>
                <p className="text-xs">
                  Streamers and admins: manage streams and communities from the{" "}
                  <strong className="text-foreground">adda Console</strong> desktop app.
                </p>
              </Card>
            </div>
          )}
        </RequireAuth>
      </main>
    </>
  );
}
