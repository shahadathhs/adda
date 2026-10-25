import type { ButtonHTMLAttributes } from "react";
import { buttonClass, type Size, type Variant } from "@/components/ui/button-styles";

export function Button({
  variant = "default",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}
