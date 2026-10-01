import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { GOOGLE_CLIENT_ID } from "../google-config";
import { useLogin } from "../hooks";
import { loginSchema, type LoginValues } from "../schemas";
import { redirectAfterLogin } from "../utils";
import { GoogleSignIn } from "./google-sign-in";
import { Divider } from "./divider";

export function PasswordForm({
  onRequires2fa,
  onSwitchToOtp,
}: {
  onRequires2fa: (tempToken: string) => void;
  onSwitchToOtp: (email: string) => void;
}) {
  const navigate = useNavigate();
  const login = useLogin();
  const [busy, setBusy] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    setBusy(true);
    try {
      const res = await login.mutateAsync(values);
      if ("requires_2fa" in res) {
        onRequires2fa(res.temp_token);
        toast.info("Enter the code sent to your email.");
        return;
      }
      navigate({ to: redirectAfterLogin(res.user.system_role) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {GOOGLE_CLIENT_ID ? (
        <>
          <GoogleSignIn />
          <Divider label="or" />
        </>
      ) : null}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : "Log in"}
          </Button>
        </form>
      </Form>
      <p className="text-center text-sm text-muted-foreground">
        <button
          type="button"
          className="font-medium text-primary hover:underline"
          onClick={() => onSwitchToOtp(form.getValues("email"))}
        >
          Sign in with email code
        </button>
      </p>
    </div>
  );
}
