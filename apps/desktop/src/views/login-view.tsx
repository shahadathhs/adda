import { useState } from "react";
import { Radio } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { apiBaseUrl } from "@adda/shared";
import { useLogin, useLogin2fa } from "@/lib/session";

export function LoginView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const login = useLogin();
  const login2fa = useLogin2fa();

  const submitCredentials = () => {
    login.mutate(
      { email: email.trim(), password },
      {
        onSuccess: (res) => {
          if ("requires_2fa" in res) setTempToken(res.temp_token);
        },
      },
    );
  };

  const submitCode = () => {
    if (!tempToken) return;
    login2fa.mutate({ tempToken, code: code.trim() });
  };

  return (
    <div className="flex h-full items-center justify-center bg-bg">
      <div className="w-full max-w-xs rounded-sm border border-line bg-panel p-6">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-accent/15">
            <Radio className="h-4.5 w-4.5 text-accent" />
          </div>
          <div>
            <h1 className="text-sm font-semibold">Sign in</h1>
            <p className="max-w-40 truncate text-2xs text-muted">{apiBaseUrl()}</p>
          </div>
        </div>

        {tempToken === null ? (
          <form
            className="space-y-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              submitCredentials();
            }}
          >
            <Input
              autoFocus
              type="email"
              placeholder="Operator email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-8"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-8"
            />
            <Button
              variant="primary"
              type="submit"
              className="h-8 w-full"
              disabled={login.isPending || !email || !password}
            >
              {login.isPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        ) : (
          <form
            className="space-y-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              submitCode();
            }}
          >
            <p className="text-2xs text-muted">Enter the 6-digit code sent to your email.</p>
            <Input
              autoFocus
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="h-8 text-center font-num text-sm tracking-[0.5em]"
            />
            <Button
              variant="primary"
              type="submit"
              className="h-8 w-full"
              disabled={login2fa.isPending || code.length !== 6}
            >
              {login2fa.isPending ? "Verifying…" : "Verify"}
            </Button>
            <Button
              variant="ghost"
              type="button"
              className="h-7 w-full"
              onClick={() => {
                setTempToken(null);
                setCode("");
              }}
            >
              Back
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
