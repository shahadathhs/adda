import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { resetPassword } from "@/features/auth/api";
import { resetPasswordSchema, type ResetPasswordValues } from "@/features/auth/schemas";

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-bold tracking-tight">Invalid link</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This password reset link is missing a token and can&apos;t be used.
          </p>
          <Button asChild className="mt-6">
            <Link to="/login">Back to login</Link>
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = async (values: ResetPasswordValues) => {
    setBusy(true);
    try {
      await resetPassword(token, values.password);
      toast.success("Your password has been reset.");
      navigate({ to: "/login" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Link
          to="/"
          className="mb-8 inline-block bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-2xl font-extrabold text-transparent"
        >
          adda
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a new password for your account.
        </p>

        <div className="mt-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="At least 8 characters" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Re-enter password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Please wait…" : "Reset password"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/reset-password")({
  validateSearch: (input: Record<string, unknown>) => ({
    token: typeof input.token === "string" ? input.token : undefined,
  }),
  head: () => ({
    title: "Reset password — adda",
    meta: [
      { name: "description", content: "Set a new password for your adda account." },
      { property: "og:title", content: "Reset password — adda" },
      { property: "og:description", content: "Set a new password for your adda account." },
    ],
  }),
  component: ResetPasswordPage,
});
