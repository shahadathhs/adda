"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Radio } from "lucide-react";
import { adoptSessionAfterRegister } from "./register-flow";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/lib/session";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    display_name: "",
    username: "",
    email: "",
    password: "",
  });
  const register = useRegister();

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15">
            <Radio className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold">Create your account</h1>
            <p className="text-xs text-muted-foreground">Join this adda instance</p>
          </div>
        </div>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            register.mutate(form, {
              onSuccess: async (token) => {
                await adoptSessionAfterRegister(token);
                router.push("/");
              },
            });
          }}
        >
          <Input
            required
            placeholder="Display name"
            value={form.display_name}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
          />
          <Input
            required
            pattern="[a-zA-Z0-9_]+"
            title="Letters, numbers and underscores only"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <Input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            required
            type="password"
            minLength={8}
            placeholder="Password (min 8 chars)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Button variant="primary" type="submit" className="w-full" disabled={register.isPending}>
            {register.isPending ? "Creating…" : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
