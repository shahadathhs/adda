"use client";

import { GoogleLogin } from "@react-oauth/google";

export function GoogleSignIn({
  onSuccess,
}: {
  clientId: string;
  onSuccess: (idToken: string) => void;
}) {
  return (
    <div className="flex justify-center">
      {/* clientId comes from the GoogleOAuthProvider in the root layout. */}
      <GoogleLogin
        onSuccess={(credential) => {
          if (credential.credential) onSuccess(credential.credential);
        }}
        onError={() => undefined}
        useOneTap={false}
      />
    </div>
  );
}
