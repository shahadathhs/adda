import { GoogleLogin } from "@react-oauth/google";
import { GOOGLE_CLIENT_ID } from "./google-config";

/**
 * Google's official "Sign in with Google" button via @react-oauth/google.
 * Renders nothing when no client ID is configured.
 */
export function GoogleButton({
  onSuccess,
  onError,
}: {
  onSuccess: (idToken: string) => void;
  onError?: () => void;
}) {
  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <GoogleLogin
      onSuccess={(res) => {
        if (res.credential) onSuccess(res.credential);
      }}
      onError={() => onError?.()}
      width="360"
      shape="rectangular"
      theme="outline"
      size="large"
      text="signin_with"
    />
  );
}
