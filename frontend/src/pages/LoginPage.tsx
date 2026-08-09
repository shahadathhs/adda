import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { MessageCircle, Radio, Users } from "lucide-react";
import { LoginForm } from "@/features/auth/components/login-form";
import { RegisterForm } from "@/features/auth/components/register-form";

export default function LoginPage({
  initialMode = "login",
}: {
  initialMode?: "login" | "register";
}) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const isLogin = mode === "login";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary to-purple-600 p-12 text-primary-foreground lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_50%_at_15%_10%,rgba(255,255,255,0.18),transparent)]"
        />
        <Link to="/" className="relative text-2xl font-extrabold">
          adda
        </Link>
        <div className="relative space-y-6">
          <h2 className="text-3xl font-bold leading-tight">Bring your community to life.</h2>
          <p className="text-primary-foreground/80">
            Live streaming, realtime chat, and a real home for your audience — all in one place.
          </p>
          <ul className="space-y-3">
            {[
              { icon: Radio, t: "HD live streaming" },
              { icon: MessageCircle, t: "Realtime chat with presence" },
              { icon: Users, t: "Members, roles, and posts" },
            ].map((b) => (
              <li key={b.t} className="flex items-center gap-3 text-sm">
                <b.icon className="h-4 w-4" /> {b.t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-primary-foreground/70">
          © {new Date().getFullYear()} adda
        </p>
      </aside>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <Link
            to="/"
            className="mb-8 inline-block bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-2xl font-extrabold text-transparent lg:hidden"
          >
            adda
          </Link>

          <h1 className="text-2xl font-bold tracking-tight">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLogin ? "Log in to continue to adda." : "Start building your community in minutes."}
          </p>

          <div className="mt-8">{isLogin ? <LoginForm /> : <RegisterForm />}</div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              className="font-medium text-primary hover:underline"
              onClick={() => setMode(isLogin ? "register" : "login")}
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
