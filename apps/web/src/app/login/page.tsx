"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Radio } from "lucide-react";
import { toast } from "sonner";
import { requestOtp, verifyOtp } from "@adda/api-client";
import type { Token } from "@adda/types";
import { setSession } from "@adda/api-client";
import { me } from "@adda/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLogin, useLogin2fa } from "@/lib/session";

type Mode = "password" | "otp";

async function adopt(token: Token) {
  setSession({ access_token: token.access_token, refresh_token: token.refresh_token });
  await me();
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");

  // Password flow (+ 2FA step)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const login = useLogin();
  const login2fa = useLogin2fa();

  // OTP flow
  const [otpEmail, setOtpEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpPending, setOtpPending] = useState(false);

  const done = () => router.push("/");

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpPending(true);
    try {
      await requestOtp(otpEmail.trim());
      setOtpSent(true);
      toast.info("Check your email for a 6-digit code.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setOtpPending(false);
    }
  };

  const verifyOtpCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpPending(true);
    try {
      await adopt(await verifyOtp(otpEmail.trim(), otpCode));
      done();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setOtpPending(false);
    }
  };

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

        {tempToken !== null ? (
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
        ) : (
          <>
            <div className="mb-4 flex gap-1 rounded-md bg-muted p-1">
              {(["password", "otp"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-sm px-2 py-1 text-xs font-medium transition-colors ${
                    mode === m
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "password" ? "Password" : "Email code"}
                </button>
              ))}
            </div>

            {mode === "password" ? (
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
              <form className="space-y-3" onSubmit={otpSent ? verifyOtpCode : sendOtp}>
                <Input
                  type="email"
                  required
                  disabled={otpSent}
                  placeholder="Email"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                />
                {otpSent && (
                  <Input
                    inputMode="numeric"
                    maxLength={6}
                    required
                    placeholder="6-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    className="text-center tracking-[0.5em]"
                  />
                )}
                <Button
                  variant="primary"
                  type="submit"
                  className="w-full"
                  disabled={
                    otpPending || (otpSent ? otpCode.length !== 6 : !otpEmail) || otpPending
                  }
                >
                  {otpPending ? "…" : otpSent ? "Sign in with code" : "Email me a code"}
                </Button>
                {otpSent && (
                  <Button
                    variant="ghost"
                    type="button"
                    className="w-full"
                    onClick={() => setOtpSent(false)}
                  >
                    Use a different email
                  </Button>
                )}
              </form>
            )}

            <p className="mt-4 text-center text-xs text-muted-foreground">
              No account?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Create one
              </Link>
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
