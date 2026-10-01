import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { useRequestOtp, useVerifyOtp } from "../hooks";
import { codeSchema, otpRequestSchema, type CodeValues, type OtpRequestValues } from "../schemas";
import { redirectAfterLogin } from "../utils";

export function OtpForm({ initialEmail, onBack }: { initialEmail: string; onBack: () => void }) {
  const navigate = useNavigate();
  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState(initialEmail);

  const requestForm = useForm<OtpRequestValues>({
    resolver: zodResolver(otpRequestSchema),
    defaultValues: { email },
  });

  const codeForm = useForm<CodeValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  const onSend = async (values: OtpRequestValues) => {
    try {
      await requestOtp.mutateAsync(values.email);
      setEmail(values.email);
      setSent(true);
      toast.success("If that account exists, a code has been sent.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const onVerify = async (values: CodeValues) => {
    try {
      const token = await verifyOtp.mutateAsync({ email, code: values.code });
      navigate({ to: redirectAfterLogin(token.user.system_role) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  if (sent) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          A 6-digit code was sent to <span className="font-medium text-foreground">{email}</span>.
        </p>
        <Form {...codeForm}>
          <form onSubmit={codeForm.handleSubmit(onVerify)} className="space-y-4">
            <FormField
              control={codeForm.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification code</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="123456"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={verifyOtp.isPending}>
              {verifyOtp.isPending ? "Verifying…" : "Verify & log in"}
            </Button>
          </form>
        </Form>
        <button
          type="button"
          className="w-full text-center text-sm text-muted-foreground hover:underline"
          onClick={() => onSend({ email })}
        >
          Resend code
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Form {...requestForm}>
        <form onSubmit={requestForm.handleSubmit(onSend)} className="space-y-4">
          <FormField
            control={requestForm.control}
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
          <Button type="submit" className="w-full" disabled={requestOtp.isPending}>
            {requestOtp.isPending ? "Sending…" : "Send code"}
          </Button>
        </form>
      </Form>
      <button
        type="button"
        className="w-full text-center text-sm text-muted-foreground hover:underline"
        onClick={onBack}
      >
        Back to password sign in
      </button>
    </div>
  );
}
