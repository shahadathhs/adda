import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { GoogleButton } from "../GoogleButton";
import { redirectAfterLogin } from "../utils";
import { useGoogleLogin } from "../hooks";

export function GoogleSignIn() {
  const navigate = useNavigate();
  const googleLogin = useGoogleLogin();

  return (
    <GoogleButton
      onSuccess={(idToken) => {
        googleLogin.mutate(idToken, {
          onSuccess: (token) => {
            navigate({ to: redirectAfterLogin(token.user.system_role) });
          },
          onError: (e: Error) => {
            console.error("[Google Login] Backend error:", e);
            toast.error(e.message);
          },
        });
      }}
      onError={() => toast.error("Google sign-in failed")}
    />
  );
}
