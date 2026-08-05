import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useAuthStore } from "../store/auth-store";

export default function LoginPage({ initialMode = "login" }: { initialMode?: "login" | "register" }) {
  const { login, register } = useAuthStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    display_name: "",
  });
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
        // Admins land on the admin dashboard; everyone else on communities.
        const admin = useAuthStore.getState().user?.is_admin;
        navigate(admin ? "/admin" : "/");
      } else {
        await register(form);
        navigate("/");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-block bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-4xl font-extrabold text-transparent">
            adda
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Communities that happen to stream.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-card p-6">
          {mode === "register" && (
            <>
              <Input placeholder="Display name" value={form.display_name} onChange={set("display_name")} required />
              <Input placeholder="Username" value={form.username} onChange={set("username")} required />
            </>
          )}
          <Input type="email" placeholder="Email" value={form.email} onChange={set("email")} required />
          <Input type="password" placeholder="Password" value={form.password} onChange={set("password")} required />

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button
            className="font-medium text-primary hover:underline"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Create an account" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
