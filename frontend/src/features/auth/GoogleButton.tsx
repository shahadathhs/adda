import { useEffect, useRef } from "react";
import { useGoogleOAuth } from "@react-oauth/google";
import { GOOGLE_CLIENT_ID } from "./google-config";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (parent: HTMLElement, config: Record<string, unknown>) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export function GoogleButton({
  onSuccess,
  onError,
}: {
  onSuccess: (idToken: string) => void;
  onError?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scriptLoadedSuccessfully } = useGoogleOAuth();

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !scriptLoadedSuccessfully || !containerRef.current) return;
    if (!window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response: { credential?: string }) => {
        if (response.credential) {
          onSuccess(response.credential);
        } else {
          console.error("[GIS] No credential in response:", response);
          onError?.();
        }
      },
      use_fedcm_for_prompt: false,
    });

    window.google.accounts.id.renderButton(containerRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      width: 360,
    });

    return () => {
      try {
        window.google?.accounts?.id?.disableAutoSelect();
      } catch {
        // noop
      }
    };
  }, [scriptLoadedSuccessfully, onSuccess, onError]);

  if (!GOOGLE_CLIENT_ID) return null;

  return <div ref={containerRef} />;
}
