import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { KeyRound, Mail, ShieldCheck, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Badge } from "@/shared/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { GoogleButton } from "@/features/auth/GoogleButton";
import {
  useChangePassword,
  useDisable2fa,
  useEnable2fa,
  useEnable2faVerify,
  useLinkGoogle,
  useMe,
  useSetPassword,
  useUpdateProfile,
} from "@/features/auth/hooks";
import {
  changePasswordSchema,
  codeSchema,
  passwordSchema,
  profileSchema,
  setPasswordSchema,
  type ChangePasswordValues,
  type CodeValues,
  type ProfileValues,
  type SetPasswordValues,
} from "@/features/auth/schemas";

export default function SettingsPage() {
  const { data: user } = useMe();

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile, security, and connections.
        </p>
      </div>

      <ProfileSection key={`profile-${user?.id}`} />
      <PasswordSection hasPassword={!!user?.has_password} />
      <TwoFactorSection />
      <GoogleSection linked={!!user?.google_id} />
    </div>
  );
}

function SectionShell({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <div className="space-y-1">
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ProfileSection() {
  const { data: user } = useMe();
  const update = useUpdateProfile();
  const [busy, setBusy] = useState(false);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      display_name: user?.display_name ?? "",
      username: user?.username ?? "",
      avatar_url: user?.avatar_url ?? "",
      bio: user?.bio ?? "",
    },
  });

  const onSubmit = async (values: ProfileValues) => {
    setBusy(true);
    try {
      await update.mutateAsync({
        display_name: values.display_name,
        username: values.username,
        avatar_url: values.avatar_url || null,
        bio: values.bio || null,
      });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionShell icon={UserIcon} title="Profile" description="How you appear across adda.">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="avatar_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avatar URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Tell people about yourself" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </Form>
    </SectionShell>
  );
}

function PasswordSection({ hasPassword }: { hasPassword: boolean }) {
  return (
    <SectionShell
      icon={KeyRound}
      title={hasPassword ? "Password" : "Set a password"}
      description={
        hasPassword
          ? "Change the password you use to sign in."
          : "Your account has no password yet. Set one to sign in with email."
      }
    >
      {hasPassword ? <ChangePasswordForm /> : <SetPasswordForm />}
    </SectionShell>
  );
}

function ChangePasswordForm() {
  const change = useChangePassword();
  const [busy, setBusy] = useState(false);
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current_password: "", new_password: "", confirm: "" },
  });

  const onSubmit = async (values: ChangePasswordValues) => {
    setBusy(true);
    try {
      await change.mutateAsync({
        current_password: values.current_password,
        new_password: values.new_password,
      });
      toast.success("Password changed");
      form.reset({ current_password: "", new_password: "", confirm: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="current_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="new_password"
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
                <FormLabel>Confirm new password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Change password"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function SetPasswordForm() {
  const setPassword = useSetPassword();
  const [busy, setBusy] = useState(false);
  const form = useForm<SetPasswordValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { new_password: "", confirm: "" },
  });

  const onSubmit = async (values: SetPasswordValues) => {
    setBusy(true);
    try {
      await setPassword.mutateAsync(values.new_password);
      toast.success("Password set");
      form.reset({ new_password: "", confirm: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to set password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="new_password"
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
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Set password"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function TwoFactorSection() {
  const { data: user } = useMe();
  const enabled = !!user?.two_factor_enabled;
  const enable = useEnable2fa();
  const enableVerify = useEnable2faVerify();
  const disable = useDisable2fa();

  const [stage, setStage] = useState<"idle" | "verifying">("idle");
  const [disabling, setDisabling] = useState(false);

  const verifyForm = useForm<CodeValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });
  const disableForm = useForm<{ password: string }>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
  });

  const startEnable = async () => {
    try {
      await enable.mutateAsync();
      setStage("verifying");
      toast.success("Verification code sent to your email.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to enable 2FA");
    }
  };

  const onVerify = async (values: CodeValues) => {
    try {
      await enableVerify.mutateAsync(values.code);
      toast.success("Two-factor authentication enabled.");
      setStage("idle");
      verifyForm.reset({ code: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid or expired code");
    }
  };

  const onDisable = async (values: { password: string }) => {
    try {
      await disable.mutateAsync(values.password);
      toast.success("Two-factor authentication disabled.");
      setDisabling(false);
      disableForm.reset({ password: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disable 2FA");
    }
  };

  return (
    <SectionShell
      icon={ShieldCheck}
      title="Two-factor authentication"
      description="Add an email code as a second step at sign in."
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Status:</span>
          <Badge variant={enabled ? "default" : "secondary"}>
            {enabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
        {enabled
          ? !disabling && (
              <Button variant="outline" size="sm" onClick={() => setDisabling(true)}>
                Disable
              </Button>
            )
          : stage === "idle" && (
              <Button size="sm" onClick={startEnable} disabled={enable.isPending}>
                {enable.isPending ? "Sending…" : "Enable"}
              </Button>
            )}
      </div>

      {stage === "verifying" && !enabled && (
        <Form {...verifyForm}>
          <form onSubmit={verifyForm.handleSubmit(onVerify)} className="mt-4 space-y-4">
            <FormField
              control={verifyForm.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification code</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={enableVerify.isPending}>
                {enableVerify.isPending ? "Verifying…" : "Verify & enable"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setStage("idle");
                  verifyForm.reset({ code: "" });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      )}

      {disabling && enabled && (
        <Form {...disableForm}>
          <form onSubmit={disableForm.handleSubmit(onDisable)} className="mt-4 space-y-4">
            <FormField
              control={disableForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enter your password to confirm</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <Button type="submit" variant="destructive" disabled={disable.isPending}>
                {disable.isPending ? "Disabling…" : "Confirm disable"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDisabling(false);
                  disableForm.reset({ password: "" });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      )}
    </SectionShell>
  );
}

function GoogleSection({ linked }: { linked: boolean }) {
  const link = useLinkGoogle();

  return (
    <SectionShell
      icon={Mail}
      title="Google account"
      description="Sign in faster and link your Google identity."
    >
      {linked ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="default">Linked</Badge>
            <span className="text-muted-foreground">Your Google account is connected.</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">No Google account linked yet.</p>
          <GoogleButton
            onSuccess={(idToken) => {
              link.mutate(idToken, {
                onSuccess: () => toast.success("Google account linked."),
                onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to link"),
              });
            }}
            onError={() => toast.error("Google linking failed")}
          />
        </div>
      )}
    </SectionShell>
  );
}
