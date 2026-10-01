import { useState } from "react";
import { PasswordForm } from "./password-form";
import { OtpForm } from "./otp-form";
import { TwoFactorForm } from "./two-factor-form";

type LoginStep = "password" | "otp" | "2fa";

export function LoginForm() {
  const [step, setStep] = useState<LoginStep>("password");
  const [tempToken, setTempToken] = useState("");
  const [otpEmail, setOtpEmail] = useState("");

  if (step === "2fa") {
    return (
      <TwoFactorForm
        tempToken={tempToken}
        onCancel={() => {
          setTempToken("");
          setStep("password");
        }}
      />
    );
  }

  if (step === "otp") {
    return <OtpForm initialEmail={otpEmail} onBack={() => setStep("password")} />;
  }

  return (
    <PasswordForm
      onRequires2fa={(token) => {
        setTempToken(token);
        setStep("2fa");
      }}
      onSwitchToOtp={(email) => {
        setOtpEmail(email);
        setStep("otp");
      }}
    />
  );
}
