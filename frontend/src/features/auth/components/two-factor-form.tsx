import { useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { useVerify2faLogin } from "../hooks";
import { codeSchema, type CodeValues } from "../schemas";
import { redirectAfterLogin } from "../utils";

export function TwoFactorForm({
  tempToken,
  onCancel,
}: {
  tempToken: string;
  onCancel: () => void;
}) {
  const navigate = useNavigate();
  const verify = useVerify2faLogin();
  const form = useForm<CodeValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  const onSubmit = async (values: CodeValues) => {
    try {
      const token = await verify.mutateAsync({ temp_token: tempToken, code: values.code });
      navigate({ to: redirectAfterLogin(token.user.system_role) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enter the 6-digit code sent to your email to complete sign in.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Authentication code</FormLabel>
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
          <Button type="submit" className="w-full" disabled={verify.isPending}>
            {verify.isPending ? "Verifying…" : "Verify & log in"}
          </Button>
        </form>
      </Form>
      <button
        type="button"
        className="w-full text-center text-sm text-muted-foreground hover:underline"
        onClick={onCancel}
      >
        Back to sign in
      </button>
    </div>
  );
}
