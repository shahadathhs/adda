import { PasswordForm } from "@/components/settings/password-form";

export default function PasswordSettingsPage() {
  return (
    <section className="lg:w-1/2 lg:pr-4" aria-labelledby="password-heading">
      <h2
        id="password-heading"
        className="mb-3 font-display text-xl font-semibold tracking-tight text-foreground"
      >
        Password
      </h2>
      <PasswordForm />
    </section>
  );
}
