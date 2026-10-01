import { useCallback, useState, type ReactNode } from "react";
import { ConfirmDialog } from "./confirm-dialog";

interface ConfirmOptions {
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  destructive?: boolean;
}

/** Drop-in replacement for native `confirm()`. Returns `{ confirm, dialog }`.
 *  Call `confirm({...})` to open, render `{dialog}` at the bottom of your JSX.
 */
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
  }, []);

  const dialog: ReactNode = (
    <ConfirmDialog
      open={!!options}
      onOpenChange={(o) => !o && setOptions(null)}
      title={options?.title ?? ""}
      description={options?.description ?? ""}
      confirmText={options?.confirmText}
      destructive={options?.destructive}
      onConfirm={() => options?.onConfirm()}
    />
  );

  return { confirm, dialog };
}
